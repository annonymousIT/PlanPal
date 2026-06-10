package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type googleUserInfo struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

func getOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes: []string{
			"https://www.googleapis.com/auth/calendar",
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

func HandleGoogleLogin(c *gin.Context) {
	config := getOAuthConfig()
	url := config.AuthCodeURL("state", oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func HandleGoogleCallback(c *gin.Context) {
	config := getOAuthConfig()
	code := c.Query("code")

	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "OAuth exchange failed"})
		return
	}

	// Fetch user info via REST
	httpClient := config.Client(context.Background(), token)
	resp, err := httpClient.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user info"})
		return
	}
	defer resp.Body.Close()

	var userInfo googleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse user info"})
		return
	}

	// Find or create user
	var authIdentity AuthIdentity
	result := DB.Where("provider = ? AND provider_user_id = ?", "google", userInfo.ID).First(&authIdentity)

	var user User
	if result.Error != nil {
		user = User{
			ID:          uuid.New(),
			DisplayName: userInfo.Name,
			Email:       userInfo.Email,
		}
		DB.Create(&user)

		authIdentity = AuthIdentity{
			ID:             uuid.New(),
			UserID:         user.ID,
			Provider:       "google",
			ProviderUserID: userInfo.ID,
		}
		DB.Create(&authIdentity)
	} else {
		DB.First(&user, "id = ?", authIdentity.UserID)
	}

	// Save calendar connection (upsert)
	accessEnc, _ := Encrypt(token.AccessToken)
	refreshEnc, _ := Encrypt(token.RefreshToken)

	var conn CalendarConnection
	connResult := DB.Where("user_id = ? AND provider = ?", user.ID, "google").First(&conn)
	if connResult.Error != nil {
		conn = CalendarConnection{
			ID:              uuid.New(),
			UserID:          user.ID,
			Provider:        "google",
			AccessTokenEnc:  accessEnc,
			RefreshTokenEnc: refreshEnc,
			Expiry:          token.Expiry,
		}
		DB.Create(&conn)
	} else {
		DB.Model(&conn).Updates(map[string]interface{}{
			"access_token_enc":  accessEnc,
			"refresh_token_enc": refreshEnc,
			"expiry":            token.Expiry,
		})
	}

	// Sync calendar in background (don't block login)
	go SyncCalendarEvents(user.ID, conn.ID, token)

	// Issue JWTs
	accessToken, _ := GenerateAccessToken(user.ID)
	refreshToken, _ := GenerateRefreshToken(user.ID)

	frontendURL := os.Getenv("FRONTEND_URL")
	c.Redirect(http.StatusTemporaryRedirect,
		frontendURL+"/auth/callback?access_token="+accessToken+"&refresh_token="+refreshToken)
}

func HandleRefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	claims, err := ValidateToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	accessToken, err := GenerateAccessToken(claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"access_token": accessToken})
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			c.Abort()
			return
		}

		claims, err := ValidateToken(authHeader[7:])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Next()
	}
}

func getUserID(c *gin.Context) uuid.UUID {
	return c.MustGet("userID").(uuid.UUID)
}

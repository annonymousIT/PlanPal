package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println(".env not found, using environment variables")
	}

	InitDB()

	r := gin.Default()

	// CORS
	r.Use(func(c *gin.Context) {
		frontendURL := os.Getenv("FRONTEND_URL")
		c.Header("Access-Control-Allow-Origin", frontendURL)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Health check
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "PlanPal API is running!"})
	})

	// Auth routes
	r.GET("/auth/google", HandleGoogleLogin)
	r.GET("/auth/google/callback", HandleGoogleCallback)
	r.POST("/auth/refresh", HandleRefreshToken)

	// Protected API routes
	api := r.Group("/api", AuthMiddleware())
	{
		api.GET("/user/me", HandleGetMe)

		api.GET("/events", HandleListEvents)
		api.POST("/events", HandleCreateEvent)
		api.PUT("/events/:id", HandleUpdateEvent)
		api.DELETE("/events/:id", HandleDeleteEvent)

		api.GET("/events/:id/feedback", HandleGetFeedback)
		api.POST("/events/:id/feedback", HandleSubmitFeedback)
		api.DELETE("/events/:id/feedback", HandleDeleteFeedback)

		api.POST("/magic-bar", HandleMagicBar)
		api.POST("/calendar/sync", HandleSyncCalendar)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Println("Server starting on :" + port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("サーバー起動失敗:", err)
	}
}

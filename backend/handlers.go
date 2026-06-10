package main

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /api/user/me
func HandleGetMe(c *gin.Context) {
	userID := getUserID(c)
	var user User
	if err := DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// GET /api/events
func HandleListEvents(c *gin.Context) {
	userID := getUserID(c)
	var events []ScheduleEvent
	DB.Where("user_id = ?", userID).Order("start_at asc").Find(&events)
	c.JSON(http.StatusOK, events)
}

// POST /api/events
func HandleCreateEvent(c *gin.Context) {
	userID := getUserID(c)
	var req struct {
		Title       string    `json:"title" binding:"required"`
		StartAt     time.Time `json:"start_at" binding:"required"`
		EndAt       time.Time `json:"end_at" binding:"required"`
		Location    string    `json:"location"`
		Description string    `json:"description"`
		Category    string    `json:"category"`
		Color       string    `json:"color"`
		IsAllDay    bool      `json:"is_all_day"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !req.EndAt.After(req.StartAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end time must be after start time"})
		return
	}

	event := ScheduleEvent{
		ID:          uuid.New(),
		UserID:      userID,
		Title:       req.Title,
		StartAt:     req.StartAt,
		EndAt:       req.EndAt,
		Location:    req.Location,
		Description: req.Description,
		Category:    req.Category,
		Color:       req.Color,
		IsAllDay:    req.IsAllDay,
		Status:      "confirmed",
	}

	DB.Create(&event)

	// Push to Google Calendar if connected (best-effort, don't fail on error)
	var conn CalendarConnection
	if DB.Where("user_id = ? AND provider = ?", userID, "google").First(&conn).Error == nil {
		if externalID, err := CreateCalendarEvent(conn, event); err == nil {
			DB.Model(&event).Update("external_event_id", externalID)
			event.ExternalEventID = externalID
		} else {
			log.Printf("[CreateEvent] Google Calendar push failed: %v", err)
		}
	}

	c.JSON(http.StatusCreated, event)
}

// PUT /api/events/:id
func HandleUpdateEvent(c *gin.Context) {
	userID := getUserID(c)
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req struct {
		Title       string    `json:"title"`
		StartAt     time.Time `json:"start_at"`
		EndAt       time.Time `json:"end_at"`
		Location    string    `json:"location"`
		Description string    `json:"description"`
		Category    string    `json:"category"`
		Color       string    `json:"color"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title cannot be empty"})
		return
	}
	if !req.StartAt.IsZero() && !req.EndAt.IsZero() && !req.EndAt.After(req.StartAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end time must be after start time"})
		return
	}

	var event ScheduleEvent
	if err := DB.Where("id = ? AND user_id = ?", eventID, userID).First(&event).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		return
	}

	updates := map[string]interface{}{
		"title":       req.Title,
		"location":    req.Location,
		"description": req.Description,
		"category":    req.Category,
		"color":       req.Color,
	}
	if !req.StartAt.IsZero() {
		updates["start_at"] = req.StartAt
	}
	if !req.EndAt.IsZero() {
		updates["end_at"] = req.EndAt
	}

	DB.Model(&event).Updates(updates)
	var updated ScheduleEvent
	DB.First(&updated, "id = ?", eventID)

	// Push update to Google Calendar if this event has an external ID (best-effort)
	if updated.ExternalEventID != "" {
		var conn CalendarConnection
		if DB.Where("user_id = ? AND provider = ?", userID, "google").First(&conn).Error == nil {
			go func(c CalendarConnection, ev ScheduleEvent) {
				if err := UpdateCalendarEvent(c, ev); err != nil {
					log.Printf("[UpdateEvent] Google Calendar update failed: %v", err)
				}
			}(conn, updated)
		}
	}

	c.JSON(http.StatusOK, updated)
}

// DELETE /api/events/:id
func HandleDeleteEvent(c *gin.Context) {
	userID := getUserID(c)
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var event ScheduleEvent
	if err := DB.Where("id = ? AND user_id = ?", eventID, userID).First(&event).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		return
	}

	// For PlanPal-created events (no ConnectionID = not synced from Google),
	// also delete from Google Calendar if we pushed it there.
	if (event.ConnectionID == uuid.UUID{}) && event.ExternalEventID != "" {
		var conn CalendarConnection
		if DB.Where("user_id = ? AND provider = ?", userID, "google").First(&conn).Error == nil {
			go DeleteCalendarEvent(conn, event.ExternalEventID)
		}
	}

	DB.Delete(&event)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// GET /api/events/:id/feedback
func HandleGetFeedback(c *gin.Context) {
	userID := getUserID(c)
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var feedback EventFeedback
	if err := DB.Where("event_id = ? AND user_id = ?", eventID, userID).First(&feedback).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{})
		return
	}
	c.JSON(http.StatusOK, feedback)
}

// POST /api/events/:id/feedback
func HandleSubmitFeedback(c *gin.Context) {
	userID := getUserID(c)
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req struct {
		Rating  string `json:"rating" binding:"required"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	validRatings := map[string]bool{"circle": true, "cross": true, "triangle": true}
	if !validRatings[req.Rating] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid rating value"})
		return
	}

	var existing EventFeedback
	result := DB.Where("event_id = ? AND user_id = ?", eventID, userID).First(&existing)
	if result.Error != nil {
		feedback := EventFeedback{
			ID:      uuid.New(),
			EventID: eventID,
			UserID:  userID,
			Rating:  req.Rating,
			Comment: req.Comment,
		}
		DB.Create(&feedback)
		go updateUserPreference(userID, eventID, req.Rating)
		c.JSON(http.StatusCreated, feedback)
	} else {
		DB.Model(&existing).Updates(map[string]interface{}{
			"rating":  req.Rating,
			"comment": req.Comment,
		})
		go updateUserPreference(userID, eventID, req.Rating)
		c.JSON(http.StatusOK, existing)
	}
}

// DELETE /api/events/:id/feedback
func HandleDeleteFeedback(c *gin.Context) {
	userID := getUserID(c)
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// Fetch before deleting so we can decrement preference counts
	var feedback EventFeedback
	if err := DB.Where("event_id = ? AND user_id = ?", eventID, userID).First(&feedback).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "feedback not found"})
		return
	}

	DB.Delete(&feedback)
	go decrementUserPreference(userID, eventID, feedback.Rating)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// updateUserPreference updates category-level stats after a rating is submitted.
func updateUserPreference(userID uuid.UUID, eventID uuid.UUID, rating string) {
	var event ScheduleEvent
	if err := DB.First(&event, "id = ?", eventID).Error; err != nil || event.Category == "" {
		return
	}

	var pref UserPreference
	result := DB.Where("user_id = ? AND category = ? AND participant_key = ?",
		userID, event.Category, "self").First(&pref)

	prefs := map[string]int{"positive": 0, "negative": 0, "neutral": 0}
	if result.Error == nil && len(pref.Preferences) > 0 {
		var existing map[string]int
		if err := json.Unmarshal(pref.Preferences, &existing); err == nil {
			for k, v := range existing {
				prefs[k] = v
			}
		}
	}

	switch rating {
	case "circle":
		prefs["positive"]++
	case "cross":
		prefs["negative"]++
	case "triangle":
		prefs["neutral"]++
	}

	total := prefs["positive"] + prefs["negative"] + prefs["neutral"]
	confidence := math.Min(float64(total)/10.0, 1.0)
	prefsJSON, _ := json.Marshal(prefs)

	if result.Error != nil {
		DB.Create(&UserPreference{
			ID:             uuid.New(),
			UserID:         userID,
			Category:       event.Category,
			ParticipantKey: "self",
			Preferences:    prefsJSON,
			Confidence:     confidence,
		})
	} else {
		DB.Model(&pref).Updates(map[string]interface{}{
			"preferences": prefsJSON,
			"confidence":  confidence,
		})
	}
}

// decrementUserPreference undoes one rating from UserPreference counts (called on feedback delete).
func decrementUserPreference(userID uuid.UUID, eventID uuid.UUID, rating string) {
	var event ScheduleEvent
	if err := DB.First(&event, "id = ?", eventID).Error; err != nil || event.Category == "" {
		return
	}

	var pref UserPreference
	if err := DB.Where("user_id = ? AND category = ? AND participant_key = ?",
		userID, event.Category, "self").First(&pref).Error; err != nil {
		return
	}

	prefs := map[string]int{"positive": 0, "negative": 0, "neutral": 0}
	if len(pref.Preferences) > 0 {
		json.Unmarshal(pref.Preferences, &prefs) //nolint:errcheck
	}

	switch rating {
	case "circle":
		if prefs["positive"] > 0 {
			prefs["positive"]--
		}
	case "cross":
		if prefs["negative"] > 0 {
			prefs["negative"]--
		}
	case "triangle":
		if prefs["neutral"] > 0 {
			prefs["neutral"]--
		}
	}

	total := prefs["positive"] + prefs["negative"] + prefs["neutral"]
	confidence := math.Min(float64(total)/10.0, 1.0)
	prefsJSON, _ := json.Marshal(prefs)

	DB.Model(&pref).Updates(map[string]interface{}{
		"preferences": prefsJSON,
		"confidence":  confidence,
	})
}

// POST /api/magic-bar
func HandleMagicBar(c *gin.Context) {
	userID := getUserID(c)
	var req struct {
		Query string `json:"query" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Specific datetime detected → single direct proposal (no AI needed)
	if startAt, ok := DetectSpecificDatetime(req.Query, time.Now()); ok {
		proposal := BuildDirectProposal(req.Query, startAt)
		c.JSON(http.StatusOK, gin.H{
			"proposals": []Proposal{proposal},
			"direct":    true,
		})
		return
	}

	// Vague query → AI proposals from free slots
	freeSlots := GetFreeSlots(userID)
	proposals, err := GenerateProposals(userID, req.Query, freeSlots)
	if err != nil {
		log.Printf("[MagicBar] AI error for user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"proposals": proposals})
}

// POST /api/calendar/sync
func HandleSyncCalendar(c *gin.Context) {
	userID := getUserID(c)
	var conn CalendarConnection
	if err := DB.Where("user_id = ? AND provider = ?", userID, "google").First(&conn).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no calendar connected"})
		return
	}
	token, err := getOAuthTokenFromConn(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get token"})
		return
	}
	go SyncCalendarEvents(userID, conn.ID, token)
	c.JSON(http.StatusOK, gin.H{"message": "sync started"})
}

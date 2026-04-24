package main

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;"`
	DisplayName string    `json:"display_name"`
	CreatedAt   time.Time `json:"created_at"`
	Settings    []byte    `json:"settings"`
}

type ScheduleEvent struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primary_key;"`
	ExternalEventID string    `json:"external_event_id"`
	UserID          uuid.UUID `json:"user_id" gorm:"type:uuid;"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	StartAt         time.Time `json:"start_at"`
	EndAt           time.Time `json:"end_at"`
	Location        string    `json:"location"`
	Participants    []byte    `json:"participants"`
	Category        string    `json:"category"`
}

type EventFeedback struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;"`
	EventID   uuid.UUID `json:"event_id" gorm:"type:uuid;"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;"`
	Rating    string    `json:"rating"`
	Comments  string    `json:"comments"`
	CreatedAt time.Time `json:"created_at"`
}

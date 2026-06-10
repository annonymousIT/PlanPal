package main

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	DisplayName string    `json:"display_name"`
	Email       string    `json:"email" gorm:"uniqueIndex"`
	CreatedAt   time.Time `json:"created_at"`
	Settings    []byte    `json:"settings"`
}

type AuthIdentity struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID         uuid.UUID `json:"user_id" gorm:"type:uuid;index"`
	Provider       string    `json:"provider"`
	ProviderUserID string    `json:"provider_user_id" gorm:"uniqueIndex:idx_provider_user"`
	CreatedAt      time.Time `json:"created_at"`
}

type CalendarConnection struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID          uuid.UUID `json:"user_id" gorm:"type:uuid;index"`
	Provider        string    `json:"provider"`
	AccessTokenEnc  string    `json:"-"`
	RefreshTokenEnc string    `json:"-"`
	LastSyncToken   string    `json:"-"`
	Expiry          time.Time `json:"expiry"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type ScheduleEvent struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ExternalEventID string    `json:"external_event_id" gorm:"index"`
	UserID          uuid.UUID `json:"user_id" gorm:"type:uuid;index"`
	ConnectionID    uuid.UUID `json:"connection_id" gorm:"type:uuid"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	StartAt         time.Time `json:"start_at"`
	EndAt           time.Time `json:"end_at"`
	Location        string    `json:"location"`
	Participants    []byte    `json:"participants"`
	Category        string    `json:"category"`
	Color           string    `json:"color"`
	Status          string    `json:"status" gorm:"default:'confirmed'"`
	IsAllDay        bool      `json:"is_all_day"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type EventFeedback struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	EventID   uuid.UUID `json:"event_id" gorm:"type:uuid;index"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Rating    string    `json:"rating"` // circle / cross / triangle
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

type UserPreference struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID         uuid.UUID `json:"user_id" gorm:"type:uuid;index"`
	Category       string    `json:"category"`
	ParticipantKey string    `json:"participant_key"` // 'self' or participant name
	Preferences    []byte    `json:"preferences" gorm:"type:jsonb;default:'{}'"`
	Confidence     float64   `json:"confidence"`
	UpdatedAt      time.Time `json:"updated_at"`
}

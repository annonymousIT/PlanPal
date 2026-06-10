package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	gcalendar "google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

type FreeSlot struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

type Participant struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func getCalendarOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Endpoint:     google.Endpoint,
	}
}

func getOAuthTokenFromConn(conn CalendarConnection) (*oauth2.Token, error) {
	accessToken, err := Decrypt(conn.AccessTokenEnc)
	if err != nil {
		return nil, err
	}
	refreshToken, err := Decrypt(conn.RefreshTokenEnc)
	if err != nil {
		return nil, err
	}
	return &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Expiry:       conn.Expiry,
	}, nil
}

func getCalendarService(token *oauth2.Token) (*gcalendar.Service, error) {
	config := getCalendarOAuthConfig()
	tokenSource := config.TokenSource(context.Background(), token)
	return gcalendar.NewService(context.Background(), option.WithTokenSource(tokenSource))
}

func SyncCalendarEvents(userID uuid.UUID, connID uuid.UUID, token *oauth2.Token) {
	svc, err := getCalendarService(token)
	if err != nil {
		log.Printf("calendar service error: %v", err)
		return
	}

	var conn CalendarConnection
	if err := DB.First(&conn, "id = ?", connID).Error; err != nil {
		return
	}

	call := svc.Events.List("primary").
		TimeMin(time.Now().AddDate(0, -1, 0).Format(time.RFC3339)).
		TimeMax(time.Now().AddDate(0, 3, 0).Format(time.RFC3339)).
		SingleEvents(true).
		OrderBy("startTime")

	if conn.LastSyncToken != "" {
		call = svc.Events.List("primary").SyncToken(conn.LastSyncToken)
	}

	events, err := call.Do()
	if err != nil {
		log.Printf("calendar list error: %v", err)
		return
	}

	for _, item := range events.Items {
		upsertCalendarEvent(userID, connID, item)
	}

	if events.NextSyncToken != "" {
		DB.Model(&conn).Update("last_sync_token", events.NextSyncToken)
	}
	log.Printf("Calendar sync complete for user %s: %d events", userID, len(events.Items))
}

func upsertCalendarEvent(userID uuid.UUID, connID uuid.UUID, item *gcalendar.Event) {
	startAt, endAt := parseEventTimes(item)
	isAllDay := item.Start.DateTime == ""

	var existing ScheduleEvent
	result := DB.Where("external_event_id = ? AND user_id = ?", item.Id, userID).First(&existing)

	if item.Status == "cancelled" {
		if result.Error == nil {
			DB.Delete(&existing)
		}
		return
	}

	participantsJSON := buildParticipantsJSON(item.Attendees)

	if result.Error != nil {
		event := ScheduleEvent{
			ID:              uuid.New(),
			ExternalEventID: item.Id,
			UserID:          userID,
			ConnectionID:    connID,
			Title:           item.Summary,
			Description:     item.Description,
			StartAt:         startAt,
			EndAt:           endAt,
			Location:        item.Location,
			Participants:    participantsJSON,
			Status:          "confirmed",
			IsAllDay:        isAllDay,
		}
		DB.Create(&event)
	} else {
		DB.Model(&existing).Updates(map[string]interface{}{
			"title":        item.Summary,
			"description":  item.Description,
			"start_at":     startAt,
			"end_at":       endAt,
			"location":     item.Location,
			"participants": participantsJSON,
			"is_all_day":   isAllDay,
		})
	}
}

func parseEventTimes(item *gcalendar.Event) (time.Time, time.Time) {
	var startAt, endAt time.Time
	if item.Start.DateTime != "" {
		startAt, _ = time.Parse(time.RFC3339, item.Start.DateTime)
		endAt, _ = time.Parse(time.RFC3339, item.End.DateTime)
	} else {
		// Parse date-only events anchored to JST midnight so the calendar date
		// is correct for Japanese users regardless of server timezone.
		startAt, _ = time.ParseInLocation("2006-01-02", item.Start.Date, jst)
		endAt, _ = time.ParseInLocation("2006-01-02", item.End.Date, jst)
	}
	return startAt, endAt
}

func buildParticipantsJSON(attendees []*gcalendar.EventAttendee) []byte {
	ps := []Participant{} // non-nil so JSON encodes as [] not null
	for _, a := range attendees {
		name := a.DisplayName
		if name == "" {
			name = a.Email
		}
		ps = append(ps, Participant{Name: name, Email: a.Email})
	}
	data, _ := json.Marshal(ps)
	return data
}

func GetFreeSlots(userID uuid.UUID) []FreeSlot {
	var conn CalendarConnection
	if err := DB.Where("user_id = ? AND provider = ?", userID, "google").First(&conn).Error; err != nil {
		return nil
	}
	token, err := getOAuthTokenFromConn(conn)
	if err != nil {
		return nil
	}
	svc, err := getCalendarService(token)
	if err != nil {
		return nil
	}

	now := time.Now().In(jst) // use JST so slot hours are Japan-local
	twoWeeksLater := now.AddDate(0, 0, 14)

	freeBusyReq := &gcalendar.FreeBusyRequest{
		TimeMin: now.Format(time.RFC3339),
		TimeMax: twoWeeksLater.Format(time.RFC3339),
		Items:   []*gcalendar.FreeBusyRequestItem{{Id: "primary"}},
	}
	fbResult, err := svc.Freebusy.Query(freeBusyReq).Do()
	if err != nil {
		return nil
	}

	busy := fbResult.Calendars["primary"].Busy

	var slots []FreeSlot
	for d := 0; d < 14 && len(slots) < 9; d++ {
		date := now.AddDate(0, 0, d)
		candidates := []FreeSlot{
			{Start: setHour(date, 10, 0), End: setHour(date, 12, 0)},
			{Start: setHour(date, 14, 0), End: setHour(date, 17, 0)},
			{Start: setHour(date, 19, 0), End: setHour(date, 22, 0)},
		}
		for _, slot := range candidates {
			if !overlapsWithBusy(slot, busy) {
				slots = append(slots, slot)
			}
		}
	}
	return slots
}

func setHour(t time.Time, hour, min int) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), hour, min, 0, 0, jst)
}

func overlapsWithBusy(slot FreeSlot, busy []*gcalendar.TimePeriod) bool {
	for _, b := range busy {
		bStart, _ := time.Parse(time.RFC3339, b.Start)
		bEnd, _ := time.Parse(time.RFC3339, b.End)
		if slot.Start.Before(bEnd) && slot.End.After(bStart) {
			return true
		}
	}
	return false
}

func CreateCalendarEvent(conn CalendarConnection, event ScheduleEvent) (string, error) {
	token, err := getOAuthTokenFromConn(conn)
	if err != nil {
		return "", err
	}
	svc, err := getCalendarService(token)
	if err != nil {
		return "", err
	}

	gcalEvent := &gcalendar.Event{
		Summary:     event.Title,
		Description: event.Description,
		Location:    event.Location,
		Start:       &gcalendar.EventDateTime{DateTime: event.StartAt.Format(time.RFC3339)},
		End:         &gcalendar.EventDateTime{DateTime: event.EndAt.Format(time.RFC3339)},
	}
	if event.IsAllDay {
		gcalEvent.Start = &gcalendar.EventDateTime{Date: event.StartAt.Format("2006-01-02")}
		gcalEvent.End = &gcalendar.EventDateTime{Date: event.EndAt.Format("2006-01-02")}
	}

	created, err := svc.Events.Insert("primary", gcalEvent).Do()
	if err != nil {
		return "", err
	}
	return created.Id, nil
}

func UpdateCalendarEvent(conn CalendarConnection, event ScheduleEvent) error {
	token, err := getOAuthTokenFromConn(conn)
	if err != nil {
		return err
	}
	svc, err := getCalendarService(token)
	if err != nil {
		return err
	}

	gcalEvent := &gcalendar.Event{
		Summary:     event.Title,
		Description: event.Description,
		Location:    event.Location,
		Start:       &gcalendar.EventDateTime{DateTime: event.StartAt.Format(time.RFC3339)},
		End:         &gcalendar.EventDateTime{DateTime: event.EndAt.Format(time.RFC3339)},
	}
	if event.IsAllDay {
		gcalEvent.Start = &gcalendar.EventDateTime{Date: event.StartAt.In(jst).Format("2006-01-02")}
		gcalEvent.End = &gcalendar.EventDateTime{Date: event.EndAt.In(jst).Format("2006-01-02")}
	}

	_, err = svc.Events.Update("primary", event.ExternalEventID, gcalEvent).Do()
	return err
}

func DeleteCalendarEvent(conn CalendarConnection, externalID string) {
	token, err := getOAuthTokenFromConn(conn)
	if err != nil {
		return
	}
	svc, err := getCalendarService(token)
	if err != nil {
		return
	}
	svc.Events.Delete("primary", externalID).Do()
}

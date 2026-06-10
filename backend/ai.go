package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

var jst = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		return time.FixedZone("JST", 9*3600)
	}
	return loc
}()

// DetectSpecificDatetime parses Japanese date/time expressions like "5月20日19時"
func DetectSpecificDatetime(query string, now time.Time) (time.Time, bool) {
	re := regexp.MustCompile(`(\d{1,2})月(\d{1,2})日[^\d]*(?:(\d{1,2})時)?`)
	m := re.FindStringSubmatch(query)
	if len(m) == 0 {
		return time.Time{}, false
	}
	month := parseIntStr(m[1])
	day := parseIntStr(m[2])
	hour := 10
	if m[3] != "" {
		hour = parseIntStr(m[3])
	}
	if month < 1 || month > 12 {
		return time.Time{}, false
	}
	year := now.Year()
	daysInMonth := time.Date(year, time.Month(month+1), 0, 0, 0, 0, 0, jst).Day()
	if day < 1 || day > daysInMonth {
		return time.Time{}, false
	}
	t := time.Date(year, time.Month(month), day, hour, 0, 0, 0, jst)
	if t.Before(now) {
		t = time.Date(year+1, time.Month(month), day, hour, 0, 0, 0, jst)
	}
	return t, true
}

func parseIntStr(s string) int {
	n := 0
	for _, c := range s {
		if c >= '0' && c <= '9' {
			n = n*10 + int(c-'0')
		}
	}
	return n
}

// BuildDirectProposal creates a single proposal from a specific-datetime query
func BuildDirectProposal(query string, startAt time.Time) Proposal {
	title := extractTitleFromQuery(query)
	duration := estimateDuration(query)
	return Proposal{
		Title:     title,
		StartAt:   startAt,
		EndAt:     startAt.Add(duration),
		Reasoning: "ご指定の日時で登録します",
	}
}

func extractTitleFromQuery(query string) string {
	reDate := regexp.MustCompile(`\d{1,2}月\d{1,2}日`)
	reTime := regexp.MustCompile(`\d{1,2}時\d{0,2}分?`)
	title := reDate.ReplaceAllString(query, "")
	title = reTime.ReplaceAllString(title, "")
	reParticles := regexp.MustCompile(`[にでをはが。、！!？?]+`)
	title = reParticles.ReplaceAllString(title, " ")
	title = strings.TrimSpace(strings.Join(strings.Fields(title), " "))
	if title == "" {
		return query
	}
	return title
}

func estimateDuration(query string) time.Duration {
	keywords := map[string]time.Duration{
		"ディナー":   2 * time.Hour,
		"夕食":     2 * time.Hour,
		"夜ご飯":    2 * time.Hour,
		"ランチ":    90 * time.Minute,
		"昼食":     90 * time.Minute,
		"昼ご飯":    90 * time.Minute,
		"朝食":     45 * time.Minute,
		"映画":     150 * time.Minute,
		"会議":     60 * time.Minute,
		"ミーティング": 60 * time.Minute,
		"打ち合わせ":  60 * time.Minute,
	}
	for kw, dur := range keywords {
		if strings.Contains(query, kw) {
			return dur
		}
	}
	return time.Hour
}

type Proposal struct {
	Title     string    `json:"title"`
	StartAt   time.Time `json:"start_at"`
	EndAt     time.Time `json:"end_at"`
	Location  string    `json:"location,omitempty"`
	Reasoning string    `json:"reasoning"`
}

// callGemini calls Gemini REST API v1 directly (avoids SDK v1beta limitations)
func callGemini(prompt string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY not set")
	}

	// Try models in order of preference (v1beta — gemini-2.0-flash and newer models live here)
	models := []string{"gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"}
	for _, model := range models {
		url := fmt.Sprintf(
			"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
			model, apiKey,
		)

		reqBody := map[string]interface{}{
			"contents": []map[string]interface{}{
				{"parts": []map[string]interface{}{{"text": prompt}}},
			},
			"generationConfig": map[string]interface{}{
				"temperature":     0.7,
				"maxOutputTokens": 8192,
				"thinkingConfig": map[string]interface{}{
					"thinkingBudget": 0,
				},
			},
		}

		bodyBytes, err := json.Marshal(reqBody)
		if err != nil {
			return "", err
		}

		resp, err := http.Post(url, "application/json", bytes.NewReader(bodyBytes))
		if err != nil {
			log.Printf("[Gemini] HTTP error with model %s: %v", model, err)
			continue
		}
		defer resp.Body.Close()

		raw, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Printf("[Gemini] read error with model %s: %v", model, err)
			continue
		}

		if resp.StatusCode == http.StatusTooManyRequests {
			log.Printf("[Gemini] quota exceeded (429): %.300s", string(raw))
			return "", fmt.Errorf("quota exceeded: try again in a moment")
		}
		if resp.StatusCode != http.StatusOK {
			log.Printf("[Gemini] model %s returned %d: %.300s", model, resp.StatusCode, string(raw))
			continue
		}

		var result struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}
		if err := json.Unmarshal(raw, &result); err != nil {
			log.Printf("[Gemini] parse error with model %s: %v", model, err)
			continue
		}
		if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
			log.Printf("[Gemini] empty response from model %s", model)
			continue
		}

		log.Printf("[Gemini] success with model %s", model)
		return result.Candidates[0].Content.Parts[0].Text, nil
	}

	return "", fmt.Errorf("all Gemini models failed")
}

func GenerateProposals(userID uuid.UUID, query string, freeSlots []FreeSlot) ([]Proposal, error) {
	var feedbacks []EventFeedback
	DB.Where("user_id = ?", userID).
		Order("created_at desc").
		Limit(20).
		Find(&feedbacks)

	var events []ScheduleEvent
	if len(feedbacks) > 0 {
		eventIDs := make([]uuid.UUID, len(feedbacks))
		for i, f := range feedbacks {
			eventIDs[i] = f.EventID
		}
		DB.Where("id IN ?", eventIDs).Find(&events)
	}

	contextStr := buildFeedbackContext(feedbacks, events)
	slotsStr := formatFreeSlots(freeSlots)
	now := time.Now()

	prompt := fmt.Sprintf(`あなたはユーザーの好みを学習するAIカレンダーアシスタントです。
現在時刻: %s（日本標準時）

【ユーザーの過去の予定と評価】
%s

【空き時間スロット（今後2週間）】
%s

【ユーザーのリクエスト】
"%s"

上記を踏まえ、ユーザーに合った具体的な予定候補を3つ提案してください。
以下のJSON配列のみを返してください（前後に説明文は不要）:
[
  {
    "title": "予定タイトル",
    "start_at": "2026-05-15T19:00:00+09:00",
    "end_at": "2026-05-15T21:00:00+09:00",
    "location": "場所（省略可）",
    "reasoning": "なぜこの予定を提案するか（過去の評価に基づいた個人化された理由を日本語で）"
  }
]`,
		now.Format("2006年01月02日 15:04"),
		contextStr,
		slotsStr,
		query,
	)

	rawText, err := callGemini(prompt)
	if err != nil {
		return nil, err
	}

	// Strip markdown code fences if present (handles trailing newlines robustly)
	rawText = strings.TrimSpace(rawText)
	if strings.HasPrefix(rawText, "```") {
		if idx := strings.Index(rawText, "\n"); idx >= 0 {
			rawText = rawText[idx+1:]
		}
		rawText = strings.TrimSpace(rawText)
		if strings.HasSuffix(rawText, "```") {
			rawText = strings.TrimSpace(rawText[:len(rawText)-3])
		}
	}

	log.Printf("[Gemini] raw response: %.600s", rawText)
	var proposals []Proposal
	if err := json.Unmarshal([]byte(rawText), &proposals); err != nil {
		log.Printf("[Gemini] JSON parse error: %v\nraw: %s", err, rawText)
		return nil, fmt.Errorf("failed to parse AI response: %v", err)
	}

	return proposals, nil
}

type participantEntry struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func buildFeedbackContext(feedbacks []EventFeedback, events []ScheduleEvent) string {
	if len(feedbacks) == 0 {
		return "まだ評価データがありません（初回利用）。"
	}

	eventMap := make(map[uuid.UUID]ScheduleEvent)
	for _, e := range events {
		eventMap[e.ID] = e
	}

	ratingLabel := map[string]string{
		"circle":   "良かった",
		"cross":    "合わなかった",
		"triangle": "どちらでもない",
	}

	var sb strings.Builder
	for _, f := range feedbacks {
		e, ok := eventMap[f.EventID]
		if !ok {
			continue
		}
		label := ratingLabel[f.Rating]
		cat := e.Category
		if cat == "" {
			cat = "未分類"
		}

		// Include participant names
		participantStr := ""
		if len(e.Participants) > 0 {
			var ps []participantEntry
			if err := json.Unmarshal(e.Participants, &ps); err == nil && len(ps) > 0 {
				names := make([]string, 0, len(ps))
				for _, p := range ps {
					names = append(names, p.Name)
				}
				participantStr = fmt.Sprintf("・同行者: %s", strings.Join(names, ", "))
			}
		}

		// Include comment
		commentStr := ""
		if f.Comment != "" {
			commentStr = fmt.Sprintf("・メモ:「%s」", f.Comment)
		}

		sb.WriteString(fmt.Sprintf("- カテゴリ: %s（%s）: %s%s%s\n",
			cat, e.StartAt.Format("01/02"), label, participantStr, commentStr))
	}
	return sb.String()
}

func formatFreeSlots(slots []FreeSlot) string {
	if len(slots) == 0 {
		return "空き時間情報なし（Googleカレンダー未連携）"
	}
	var sb strings.Builder
	for _, s := range slots {
		sb.WriteString(fmt.Sprintf("- %s ～ %s\n",
			s.Start.Format("01/02(月) 15:04"),
			s.End.Format("15:04"),
		))
	}
	return sb.String()
}

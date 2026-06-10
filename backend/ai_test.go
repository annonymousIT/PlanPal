package main

import (
	"testing"
	"time"
)

// TestDetectSpecificDatetime covers the regex-based fast path that avoids LLM calls.
// This logic is the cost/latency optimization described in issue #4 — getting it
// wrong means either silently dropping valid user input or routing trivial queries
// through Gemini and paying for them.
func TestDetectSpecificDatetime(t *testing.T) {
	// Fixed "now" so tests don't depend on the wall clock.
	now := time.Date(2026, 5, 1, 12, 0, 0, 0, jst)

	cases := []struct {
		name     string
		query    string
		wantOK   bool
		wantYear int
		wantMon  int
		wantDay  int
		wantHour int
	}{
		{"basic date+time", "5月20日19時に飲み会", true, 2026, 5, 20, 19},
		{"date only, default 10:00", "6月1日にランチ", true, 2026, 6, 1, 10},
		{"past date rolls to next year", "1月10日に新年会", true, 2027, 1, 10, 10},
		{"no date → fallback to AI", "来週どこかでランチ", false, 0, 0, 0, 0},
		{"invalid month", "13月5日", false, 0, 0, 0, 0},
		{"invalid day", "2月30日", false, 0, 0, 0, 0},
		{"zero-padded works", "05月20日19時", true, 2026, 5, 20, 19},
		{"trailing junk OK", "5月20日19時 だらだら", true, 2026, 5, 20, 19},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, ok := DetectSpecificDatetime(c.query, now)
			if ok != c.wantOK {
				t.Fatalf("ok=%v, want %v (query=%q)", ok, c.wantOK, c.query)
			}
			if !ok {
				return
			}
			if got.Year() != c.wantYear || int(got.Month()) != c.wantMon || got.Day() != c.wantDay || got.Hour() != c.wantHour {
				t.Errorf("got %v, want %d-%02d-%02d %02d:00",
					got.Format("2006-01-02 15:04"), c.wantYear, c.wantMon, c.wantDay, c.wantHour)
			}
			if got.Location() != jst {
				t.Errorf("expected JST location, got %v", got.Location())
			}
		})
	}
}

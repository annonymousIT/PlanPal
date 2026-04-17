package main

import "time"

type Task struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Duration  int       `json:"duration"` // in minutes
	Deadline  time.Time `json:"deadline"`
	Priority  int       `json:"priority"` // 1: High, 2: Medium, 3: Low
	CreatedAt time.Time `json:"created_at"`
}

type Event struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	IsFixed   bool      `json:"is_fixed"`
}

type PlanRequest struct {
	Tasks  []Task  `json:"tasks"`
	Events []Event `json:"events"`
}

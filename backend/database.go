package main

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	dsn := os.Getenv("DATABASE_URL")

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("DB接続失敗:", err)
	}

	err = DB.AutoMigrate(
		&User{},
		&AuthIdentity{},
		&CalendarConnection{},
		&ScheduleEvent{},
		&EventFeedback{},
		&UserPreference{},
	)
	if err != nil {
		log.Fatal("マイグレーション失敗:", err)
	}

	log.Println("DB migration complete")
}

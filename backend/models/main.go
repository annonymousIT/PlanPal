package main

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgresql://postgres:REDACTED_USE_ENV_VAR@shortline.proxy.rlwy.net:52617/railway"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("DB接続失敗: ", err)
	}

	fmt.Println("Database connection successful!")

	err = db.AutoMigrate(&User{}, &ScheduleEvent{}, &EventFeedback{})
	if err != nil {
		log.Fatal("マイグレーション失敗: ", err)
	}

	fmt.Println("Database migration successful!")
}

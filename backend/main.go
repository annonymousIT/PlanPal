package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin" // Ginをインポート
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
		log.Fatal("DB接続失敗:", err)
	}

	// マイグレーション
	db.AutoMigrate(&User{}, &ScheduleEvent{}, &EventFeedback{})
	fmt.Println("Database migration successful!")

	// 以下サーバー起動設定

	r := gin.Default()

	// 疎通確認用のテストエンドポイント
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "PlanEase API is running!",
		})
	})

	fmt.Println("Server starting on :8080...")

	// サーバーをポート8080で起動。これでプログラムが終了しなくなります。
	err = r.Run(":8080")
	if err != nil {
		log.Fatal("サーバー起動失敗:", err)
	}
}

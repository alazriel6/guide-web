package config

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/alazriel6/vue-go-postgres/backend/internal/models"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type AppConfig struct {
	Port      string
	DBHost    string
	DBPort    string
	DBUser    string
	DBPass    string
	DBName    string
	DBSSLMode string
}

func LoadConfig() *AppConfig {
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	return &AppConfig{
		Port:      getEnv("PORT", "8080"),
		DBHost:    getEnv("DB_HOST", "127.0.0.1"),
		DBPort:    getEnv("DB_PORT", "5432"),
		DBUser:    getEnv("DB_USER", "prd_studio_user"),
		DBPass:    getEnv("DB_PASSWORD", "Pulsar200ns"),
		DBName:    getEnv("DB_NAME", "prd_studio"),
		DBSSLMode: getEnv("DB_SSLMODE", "disable"),
	}
}

func (c *AppConfig) DSN() string {
	if rawURL := os.Getenv("DATABASE_URL"); rawURL != "" {
		return rawURL
	}
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		c.DBHost, c.DBUser, c.DBPass, c.DBName, c.DBPort, c.DBSSLMode,
	)
}

func (c *AppConfig) AdminDSN(adminDB string) string {
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		c.DBHost, c.DBUser, c.DBPass, adminDB, c.DBPort, c.DBSSLMode,
	)
}

func ConnectDatabase(cfg *AppConfig) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})

	// If database does not exist, try auto-creating it
	if err != nil && (strings.Contains(err.Error(), "does not exist") || strings.Contains(err.Error(), "3D000")) {
		log.Printf("[INFO] Database '%s' not found. Attempting to create it...", cfg.DBName)
		adminDB, adminErr := gorm.Open(postgres.Open(cfg.AdminDSN("postgres")), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Silent),
		})
		if adminErr == nil {
			rawSQL, _ := adminDB.DB()
			if rawSQL != nil {
				_, _ = rawSQL.Exec(fmt.Sprintf("CREATE DATABASE \"%s\"", cfg.DBName))
				rawSQL.Close()
				log.Printf("[SUCCESS] Database '%s' created successfully.", cfg.DBName)
			}
			// Reconnect to newly created database
			db, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
				Logger: logger.Default.LogMode(logger.Warn),
			})
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL (user=%s host=%s:%s db=%s): %w", cfg.DBUser, cfg.DBHost, cfg.DBPort, cfg.DBName, err)
	}

	if err := db.AutoMigrate(&models.PrdDocument{}, &models.PromptTemplate{}); err != nil {
		return nil, fmt.Errorf("failed to run AutoMigrate: %w", err)
	}

	if err := SeedDatabase(db); err != nil {
		log.Printf("[WARN] database seeder encountered an issue: %v", err)
	}

	return db, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

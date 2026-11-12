package main

import (
	"log"

	"github.com/alazriel6/vue-go-postgres/backend/internal/config"
	"github.com/alazriel6/vue-go-postgres/backend/internal/handlers"
)

func main() {
	cfg := config.LoadConfig()

	db, err := config.ConnectDatabase(cfg)
	if err != nil {
		log.Fatalf("[FATAL] Database initialization failed: %v", err)
	}

	router := handlers.SetupRouter(db)
	addr := ":" + cfg.Port
	log.Printf("[SERVER] PRD & Technical Prompt Studio Backend listening on http://localhost%s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("[FATAL] Failed to start Gin server: %v", err)
	}
}

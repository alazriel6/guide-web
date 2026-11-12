package handlers

import (
	"net/http"

	"github.com/alazriel6/vue-go-postgres/backend/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()
	r.Use(CORSMiddleware())

	prdHandler := NewPrdHandler(db)
	promptHandler := NewPromptHandler(db)
	aiService := services.NewAIService()
	aiHandler := NewAIHandler(aiService)

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"service": "PRD & Technical Prompt Studio API",
			})
		})

		// PRD CRUD Endpoints
		v1.GET("/prds", prdHandler.ListPrds)
		v1.GET("/prds/:id", prdHandler.GetPrd)
		v1.POST("/prds", prdHandler.CreatePrd)
		v1.PUT("/prds/:id", prdHandler.UpdatePrd)
		v1.DELETE("/prds/:id", prdHandler.DeletePrd)

		// Technical Prompt CRUD Endpoints
		v1.GET("/prompts", promptHandler.ListPrompts)
		v1.GET("/prompts/:id", promptHandler.GetPrompt)
		v1.POST("/prompts", promptHandler.CreatePrompt)
		v1.PUT("/prompts/:id", promptHandler.UpdatePrompt)
		v1.DELETE("/prompts/:id", promptHandler.DeletePrompt)

		// Unified Hybrid AI Proxy Endpoint
		v1.POST("/ai/generate", aiHandler.Generate)
		v1.POST("/ai/models", aiHandler.ListModels)
		v1.GET("/ai/models", aiHandler.ListModels)
	}

	return r
}

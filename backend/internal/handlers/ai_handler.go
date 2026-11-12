package handlers

import (
	"net/http"
	"strings"

	"github.com/alazriel6/vue-go-postgres/backend/internal/models"
	"github.com/alazriel6/vue-go-postgres/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	aiService *services.AIService
}

func NewAIHandler(aiService *services.AIService) *AIHandler {
	return &AIHandler{aiService: aiService}
}

func (h *AIHandler) Generate(c *gin.Context) {
	var req models.AIGenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid AI generation payload",
			"details": err.Error(),
		})
		return
	}

	// Support API key forwarded via X-API-Key or Authorization Bearer header if omitted from body
	if strings.TrimSpace(req.APIKey) == "" {
		if headerKey := strings.TrimSpace(c.GetHeader("X-API-Key")); headerKey != "" {
			req.APIKey = headerKey
		} else if authHeader := strings.TrimSpace(c.GetHeader("Authorization")); strings.HasPrefix(authHeader, "Bearer ") {
			req.APIKey = strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		}
	}

	resp, err := h.aiService.Generate(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"error":   "AI generation failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *AIHandler) ListModels(c *gin.Context) {
	var req models.AIModelsRequest
	if c.Request.Method == http.MethodPost && c.Request.Body != nil {
		_ = c.ShouldBindJSON(&req)
	}
	if req.Provider == "" {
		req.Provider = c.Query("provider")
	}
	if req.BaseURL == "" {
		req.BaseURL = c.Query("base_url")
	}
	if req.APIKey == "" {
		if headerKey := strings.TrimSpace(c.GetHeader("X-API-Key")); headerKey != "" {
			req.APIKey = headerKey
		} else if authHeader := strings.TrimSpace(c.GetHeader("Authorization")); strings.HasPrefix(authHeader, "Bearer ") {
			req.APIKey = strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		}
	}

	resp, err := h.aiService.ListModels(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"error":   "Failed to list models from provider",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

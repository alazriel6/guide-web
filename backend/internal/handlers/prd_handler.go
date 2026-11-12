package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/alazriel6/vue-go-postgres/backend/internal/config"
	"github.com/alazriel6/vue-go-postgres/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PrdHandler struct {
	db *gorm.DB
}

func NewPrdHandler(db *gorm.DB) *PrdHandler {
	return &PrdHandler{db: db}
}

func (h *PrdHandler) ListPrds(c *gin.Context) {
	query := h.db.Model(&models.PrdDocument{})

	if category := strings.TrimSpace(c.Query("category")); category != "" && !strings.EqualFold(category, "ALL") {
		query = query.Where("category = ?", category)
	}

	if isPresetStr := strings.TrimSpace(c.Query("is_preset")); isPresetStr != "" {
		if isPreset, err := strconv.ParseBool(isPresetStr); err == nil {
			query = query.Where("is_preset = ?", isPreset)
		}
	}

	if search := strings.TrimSpace(c.Query("search")); search != "" {
		pattern := "%" + search + "%"
		query = query.Where(
			"title ILIKE ? OR overview ILIKE ? OR category ILIKE ? OR tech_stack ILIKE ?",
			pattern, pattern, pattern, pattern,
		)
	}

	var prds []models.PrdDocument
	if err := query.Order("is_preset DESC, updated_at DESC").Find(&prds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch PRD documents", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, prds)
}

func (h *PrdHandler) GetPrd(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid PRD ID"})
		return
	}

	var prd models.PrdDocument
	if err := h.db.First(&prd, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "PRD document not found"})
		return
	}

	c.JSON(http.StatusOK, prd)
}

func (h *PrdHandler) CreatePrd(c *gin.Context) {
	var input models.PrdDocument
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid PRD payload", "details": err.Error()})
		return
	}

	input.ID = 0
	input.Title = strings.TrimSpace(input.Title)
	if input.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}
	if strings.TrimSpace(input.Category) == "" {
		input.Category = "SaaS Web App"
	}
	if strings.TrimSpace(input.CompiledMarkdown) == "" {
		input.CompiledMarkdown = config.CompilePrdMarkdown(&input)
	}

	if err := h.db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save PRD document", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func (h *PrdHandler) UpdatePrd(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid PRD ID"})
		return
	}

	var existing models.PrdDocument
	if err := h.db.First(&existing, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "PRD document not found"})
		return
	}

	var input models.PrdDocument
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update payload", "details": err.Error()})
		return
	}

	if strings.TrimSpace(input.Title) != "" {
		existing.Title = strings.TrimSpace(input.Title)
	}
	if strings.TrimSpace(input.Category) != "" {
		existing.Category = strings.TrimSpace(input.Category)
	}
	existing.IsPreset = input.IsPreset
	existing.Overview = input.Overview
	existing.TargetUsers = input.TargetUsers
	existing.TechStack = input.TechStack
	existing.CoreFeatures = input.CoreFeatures
	existing.ArchitectureSpecs = input.ArchitectureSpecs
	existing.EdgeCases = input.EdgeCases

	if strings.TrimSpace(input.CompiledMarkdown) != "" {
		existing.CompiledMarkdown = input.CompiledMarkdown
	} else {
		existing.CompiledMarkdown = config.CompilePrdMarkdown(&existing)
	}

	if err := h.db.Save(&existing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update PRD document", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existing)
}

func (h *PrdHandler) DeletePrd(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid PRD ID"})
		return
	}

	res := h.db.Delete(&models.PrdDocument{}, id)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete PRD document", "details": res.Error.Error()})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "PRD document not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "PRD document deleted successfully", "id": id})
}

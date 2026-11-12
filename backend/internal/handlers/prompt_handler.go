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

type PromptHandler struct {
	db *gorm.DB
}

func NewPromptHandler(db *gorm.DB) *PromptHandler {
	return &PromptHandler{db: db}
}

func (h *PromptHandler) ListPrompts(c *gin.Context) {
	query := h.db.Model(&models.PromptTemplate{})

	if roleCat := strings.TrimSpace(c.Query("role_category")); roleCat != "" && !strings.EqualFold(roleCat, "ALL") {
		query = query.Where("role_category = ?", roleCat)
	}

	if stack := strings.TrimSpace(c.Query("stack")); stack != "" {
		query = query.Where("tech_stack_tags ILIKE ? OR technical_constraints ILIKE ?", "%"+stack+"%", "%"+stack+"%")
	}

	if isPresetStr := strings.TrimSpace(c.Query("is_preset")); isPresetStr != "" {
		if isPreset, err := strconv.ParseBool(isPresetStr); err == nil {
			query = query.Where("is_preset = ?", isPreset)
		}
	}

	if search := strings.TrimSpace(c.Query("search")); search != "" {
		pattern := "%" + search + "%"
		query = query.Where(
			"title ILIKE ? OR system_role ILIKE ? OR tech_stack_tags ILIKE ? OR role_category ILIKE ?",
			pattern, pattern, pattern, pattern,
		)
	}

	var prompts []models.PromptTemplate
	if err := query.Order("is_preset DESC, updated_at DESC").Find(&prompts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch prompt templates", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, prompts)
}

func (h *PromptHandler) GetPrompt(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Prompt ID"})
		return
	}

	var prompt models.PromptTemplate
	if err := h.db.First(&prompt, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Prompt template not found"})
		return
	}

	c.JSON(http.StatusOK, prompt)
}

func (h *PromptHandler) CreatePrompt(c *gin.Context) {
	var input models.PromptTemplate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid prompt payload", "details": err.Error()})
		return
	}

	input.ID = 0
	input.Title = strings.TrimSpace(input.Title)
	if input.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}
	if strings.TrimSpace(input.RoleCategory) == "" {
		input.RoleCategory = "Fullstack"
	}
	if input.TechStackTags == nil {
		input.TechStackTags = models.StringSlice{}
	}
	if strings.TrimSpace(input.CompiledPrompt) == "" {
		input.CompiledPrompt = config.CompileTechnicalPrompt(&input)
	}

	if err := h.db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save prompt template", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}

func (h *PromptHandler) UpdatePrompt(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Prompt ID"})
		return
	}

	var existing models.PromptTemplate
	if err := h.db.First(&existing, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Prompt template not found"})
		return
	}

	var input models.PromptTemplate
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update payload", "details": err.Error()})
		return
	}

	if strings.TrimSpace(input.Title) != "" {
		existing.Title = strings.TrimSpace(input.Title)
	}
	if strings.TrimSpace(input.RoleCategory) != "" {
		existing.RoleCategory = strings.TrimSpace(input.RoleCategory)
	}
	existing.TechStackTags = input.TechStackTags
	existing.IsPreset = input.IsPreset
	existing.SystemRole = input.SystemRole
	existing.TechnicalConstraints = input.TechnicalConstraints
	existing.ArchitectureRules = input.ArchitectureRules
	existing.PointByPointInstructions = input.PointByPointInstructions
	existing.EdgeCasesToHandle = input.EdgeCasesToHandle
	existing.OutputFormat = input.OutputFormat
	existing.SourcePrdID = input.SourcePrdID

	if strings.TrimSpace(input.CompiledPrompt) != "" {
		existing.CompiledPrompt = input.CompiledPrompt
	} else {
		existing.CompiledPrompt = config.CompileTechnicalPrompt(&existing)
	}

	if err := h.db.Save(&existing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update prompt template", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existing)
}

func (h *PromptHandler) DeletePrompt(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Prompt ID"})
		return
	}

	res := h.db.Delete(&models.PromptTemplate{}, id)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete prompt template", "details": res.Error.Error()})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Prompt template not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Prompt template deleted successfully", "id": id})
}

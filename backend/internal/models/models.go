package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// StringSlice is a custom type that stores a slice of strings as JSON text in PostgreSQL
// and supports unmarshaling from either a JSON string array or a comma-separated string.
type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	b, err := json.Marshal([]string(s))
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = []string{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("failed to scan StringSlice from %T", value)
	}

	trimmed := strings.TrimSpace(string(bytes))
	if trimmed == "" {
		*s = []string{}
		return nil
	}
	if strings.HasPrefix(trimmed, "[") {
		var arr []string
		if err := json.Unmarshal(bytes, &arr); err != nil {
			return err
		}
		*s = arr
		return nil
	}
	parts := strings.Split(trimmed, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		clean := strings.TrimSpace(p)
		if clean != "" {
			result = append(result, clean)
		}
	}
	*s = result
	return nil
}

func (s *StringSlice) UnmarshalJSON(data []byte) error {
	var arr []string
	if err := json.Unmarshal(data, &arr); err == nil {
		*s = arr
		return nil
	}
	var str string
	if err := json.Unmarshal(data, &str); err == nil {
		return s.Scan(str)
	}
	*s = []string{}
	return nil
}

// PrdDocument represents a Product Requirements Document stored in PostgreSQL.
type PrdDocument struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	Title             string    `json:"title" gorm:"type:varchar(255);not null"`
	Category          string    `json:"category" gorm:"type:varchar(100);index;not null"`
	IsPreset          bool      `json:"is_preset" gorm:"default:false;index"`
	Overview          string    `json:"overview" gorm:"type:text"`
	TargetUsers       string    `json:"target_users" gorm:"type:text"`
	TechStack         string    `json:"tech_stack" gorm:"type:text"`
	CoreFeatures      string    `json:"core_features" gorm:"type:text"`
	ArchitectureSpecs string    `json:"architecture_specs" gorm:"type:text"`
	EdgeCases         string    `json:"edge_cases" gorm:"type:text"`
	CompiledMarkdown  string    `json:"compiled_markdown" gorm:"type:text"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// PromptTemplate represents a Stack-Aware Technical Prompt preset or custom prompt.
type PromptTemplate struct {
	ID                       uint        `json:"id" gorm:"primaryKey"`
	Title                    string      `json:"title" gorm:"type:varchar(255);not null"`
	RoleCategory             string      `json:"role_category" gorm:"type:varchar(100);index;not null"`
	TechStackTags            StringSlice `json:"tech_stack_tags" gorm:"type:text"`
	IsPreset                 bool        `json:"is_preset" gorm:"default:false;index"`
	SystemRole               string      `json:"system_role" gorm:"type:text"`
	TechnicalConstraints     string      `json:"technical_constraints" gorm:"type:text"`
	ArchitectureRules        string      `json:"architecture_rules" gorm:"type:text"`
	PointByPointInstructions string      `json:"point_by_point_instructions" gorm:"type:text"`
	EdgeCasesToHandle        string      `json:"edge_cases_to_handle" gorm:"type:text"`
	OutputFormat             string      `json:"output_format" gorm:"type:text"`
	CompiledPrompt           string      `json:"compiled_prompt" gorm:"type:text"`
	SourcePrdID              *uint       `json:"source_prd_id,omitempty"`
	CreatedAt                time.Time   `json:"created_at"`
	UpdatedAt                time.Time   `json:"updated_at"`
}

// AIGenerateRequest represents the unified payload for /api/v1/ai/generate.
type AIGenerateRequest struct {
	Provider     string `json:"provider" binding:"required"` // ollama, lmstudio, gemini, openai, anthropic
	Model        string `json:"model" binding:"required"`
	APIKey       string `json:"api_key"`
	BaseURL      string `json:"base_url"`
	SystemPrompt string `json:"system_prompt"`
	UserPrompt   string `json:"user_prompt" binding:"required"`
	MaxTokens    int    `json:"max_tokens,omitempty"`
}

// AIGenerateResponse represents the unified response from /api/v1/ai/generate.
type AIGenerateResponse struct {
	Content  string `json:"content"`
	Provider string `json:"provider"`
	Model    string `json:"model"`
}

// AIModelsRequest represents payload for discovering models from a local or remote provider.
type AIModelsRequest struct {
	Provider string `json:"provider"`
	BaseURL  string `json:"base_url"`
	APIKey   string `json:"api_key"`
}

// AIModelsResponse represents the list of discovered model identifiers.
type AIModelsResponse struct {
	Models   []string `json:"models"`
	Provider string   `json:"provider"`
	BaseURL  string   `json:"base_url"`
}

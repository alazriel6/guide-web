package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/alazriel6/vue-go-postgres/backend/internal/models"
)

type AIService struct {
	httpClient *http.Client
}

func NewAIService() *AIService {
	return &AIService{
		httpClient: &http.Client{
			Timeout: 10 * time.Minute,
		},
	}
}

func (s *AIService) Generate(ctx context.Context, req models.AIGenerateRequest) (*models.AIGenerateResponse, error) {
	provider := strings.ToLower(strings.TrimSpace(req.Provider))
	if req.SystemPrompt == "" {
		req.SystemPrompt = "You are a Principal Full-Stack Software Architect and Technical Prompt Engineer. Produce crisp, structured, production-grade technical specifications and prompts."
	}

	var content string
	var err error

	switch provider {
	case "ollama":
		if req.Model == "" {
			req.Model = "qwen2.5-coder:7b"
		}
		content, err = s.callOllama(ctx, req)
	case "lmstudio":
		if req.BaseURL == "" {
			req.BaseURL = "http://localhost:1234/v1/chat/completions"
		}
		if req.Model == "" {
			req.Model = "qwen2.5-coder-7b-instruct"
		}
		content, err = s.callOpenAICompatible(ctx, req, false)
	case "openai", "chatgpt":
		if req.BaseURL == "" {
			req.BaseURL = "https://api.openai.com/v1/chat/completions"
		}
		if req.Model == "" {
			req.Model = "gpt-4o"
		}
		content, err = s.callOpenAICompatible(ctx, req, true)
	case "deepseek":
		if req.BaseURL == "" {
			req.BaseURL = "https://api.deepseek.com/chat/completions"
		}
		if req.Model == "" {
			req.Model = "deepseek-chat"
		}
		content, err = s.callOpenAICompatible(ctx, req, true)
	case "anthropic", "claude":
		if req.Model == "" {
			req.Model = "claude-3-5-sonnet-latest"
		}
		content, err = s.callAnthropic(ctx, req)
	case "gemini", "google":
		if req.Model == "" {
			req.Model = "gemini-2.5-flash"
		}
		content, err = s.callGemini(ctx, req)
	case "custom", "custom_local", "other", "compatible", "openai_compatible":
		if req.BaseURL == "" {
			return nil, errors.New("custom endpoint base_url is required")
		}
		content, err = s.callOpenAICompatible(ctx, req, false)
	default:
		if req.BaseURL != "" {
			content, err = s.callOpenAICompatible(ctx, req, false)
		} else {
			return nil, fmt.Errorf("unsupported AI provider: %s (supported: ollama, lmstudio, openai, claude, gemini, deepseek, custom)", req.Provider)
		}
	}

	if err != nil {
		return nil, err
	}

	return &models.AIGenerateResponse{
		Content:  strings.TrimSpace(content),
		Provider: provider,
		Model:    req.Model,
	}, nil
}

func (s *AIService) callOllama(ctx context.Context, req models.AIGenerateRequest) (string, error) {
	endpoint := strings.TrimSpace(req.BaseURL)
	if endpoint == "" {
		endpoint = "http://localhost:11434/api/generate"
	} else if !strings.Contains(endpoint, "/api/") && !strings.Contains(endpoint, "/v1/") {
		endpoint = strings.TrimRight(endpoint, "/") + "/api/generate"
	}

	// If user configured an OpenAI-compatible path on Ollama
	if strings.Contains(endpoint, "/v1/chat/completions") {
		req.BaseURL = endpoint
		return s.callOpenAICompatible(ctx, req, false)
	}

	maxTokens := req.MaxTokens
	if maxTokens <= 0 {
		maxTokens = 2048
	}

	payload := map[string]interface{}{
		"model":  req.Model,
		"system": req.SystemPrompt,
		"prompt": req.UserPrompt,
		"stream": false,
		"options": map[string]interface{}{
			"num_predict": maxTokens,
			"temperature": 0.4,
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to reach local Ollama at %s: %w", endpoint, err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("Ollama error (%d): %s", resp.StatusCode, string(respBytes))
	}

	var result struct {
		Response string `json:"response"`
		Message  struct {
			Content string `json:"content"`
		} `json:"message"`
	}
	if err := json.Unmarshal(respBytes, &result); err != nil {
		return "", fmt.Errorf("failed to decode Ollama response: %w", err)
	}
	if result.Response != "" {
		return result.Response, nil
	}
	return result.Message.Content, nil
}

func normalizeOpenAIEndpoint(baseURL string) string {
	endpoint := strings.TrimSpace(baseURL)
	if endpoint == "" {
		return "http://localhost:1234/v1/chat/completions"
	}
	endpoint = strings.TrimRight(endpoint, "/")
	if strings.HasSuffix(endpoint, "/chat/completions") {
		return endpoint
	}
	if strings.HasSuffix(endpoint, "/v1") {
		return endpoint + "/chat/completions"
	}
	return endpoint + "/v1/chat/completions"
}

func normalizeOpenAIModelsEndpoint(baseURL string) string {
	endpoint := strings.TrimSpace(baseURL)
	if endpoint == "" {
		return "http://localhost:1234/v1/models"
	}
	endpoint = strings.TrimRight(endpoint, "/")
	if strings.HasSuffix(endpoint, "/chat/completions") {
		endpoint = strings.TrimSuffix(endpoint, "/chat/completions")
	}
	if strings.HasSuffix(endpoint, "/models") {
		return endpoint
	}
	if strings.HasSuffix(endpoint, "/v1") {
		return endpoint + "/models"
	}
	return endpoint + "/v1/models"
}

func (s *AIService) ListModels(ctx context.Context, req models.AIModelsRequest) (*models.AIModelsResponse, error) {
	provider := strings.ToLower(strings.TrimSpace(req.Provider))
	if provider == "" {
		provider = "lmstudio"
	}

	client := &http.Client{Timeout: 10 * time.Second}

	if provider == "ollama" {
		endpoint := strings.TrimSpace(req.BaseURL)
		if endpoint == "" {
			endpoint = "http://localhost:11434/api/tags"
		} else {
			endpoint = strings.TrimRight(endpoint, "/")
			if strings.HasSuffix(endpoint, "/api/generate") {
				endpoint = strings.TrimSuffix(endpoint, "/api/generate") + "/api/tags"
			} else if !strings.HasSuffix(endpoint, "/api/tags") {
				endpoint = endpoint + "/api/tags"
			}
		}

		httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
		if err != nil {
			return nil, err
		}

		resp, err := client.Do(httpReq)
		if err != nil {
			return nil, fmt.Errorf("failed to reach Ollama at %s: %w", endpoint, err)
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 400 {
			body, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("ollama returned status %d: %s", resp.StatusCode, string(body))
		}

		var ollamaResp struct {
			Models []struct {
				Name string `json:"name"`
			} `json:"models"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
			return nil, fmt.Errorf("failed to decode Ollama models: %w", err)
		}

		names := make([]string, 0, len(ollamaResp.Models))
		for _, m := range ollamaResp.Models {
			if strings.TrimSpace(m.Name) != "" {
				names = append(names, strings.TrimSpace(m.Name))
			}
		}

		return &models.AIModelsResponse{
			Models:   names,
			Provider: provider,
			BaseURL:  endpoint,
		}, nil
	}

	// OpenAI-compatible (LM Studio, Local Custom, OpenAI, DeepSeek, etc.)
	endpoint := normalizeOpenAIModelsEndpoint(req.BaseURL)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.APIKey) != "" {
		httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(req.APIKey))
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to reach endpoint %s: %w", endpoint, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("provider returned status %d: %s", resp.StatusCode, string(body))
	}

	var openAIResp struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return nil, fmt.Errorf("failed to parse models response: %w", err)
	}

	ids := make([]string, 0, len(openAIResp.Data))
	for _, m := range openAIResp.Data {
		if strings.TrimSpace(m.ID) != "" {
			ids = append(ids, strings.TrimSpace(m.ID))
		}
	}

	return &models.AIModelsResponse{
		Models:   ids,
		Provider: provider,
		BaseURL:  endpoint,
	}, nil
}

func (s *AIService) callOpenAICompatible(ctx context.Context, req models.AIGenerateRequest, requireKey bool) (string, error) {
	if requireKey && strings.TrimSpace(req.APIKey) == "" {
		return "", errors.New("API key is required for OpenAI provider")
	}

	endpoint := normalizeOpenAIEndpoint(req.BaseURL)

	maxTokens := req.MaxTokens
	if maxTokens <= 0 {
		maxTokens = 2048
	}

	payload := map[string]interface{}{
		"model": req.Model,
		"messages": []map[string]string{
			{"role": "system", "content": req.SystemPrompt},
			{"role": "user", "content": req.UserPrompt},
		},
		"temperature": 0.4,
		"max_tokens":  maxTokens,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	if strings.TrimSpace(req.APIKey) != "" {
		httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(req.APIKey))
	}

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to reach endpoint %s: %w", endpoint, err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	// Probe for error payload from provider (LM Studio, OpenAI, etc. return JSON errors)
	var errProbe struct {
		Error interface{} `json:"error"`
	}
	if err := json.Unmarshal(respBytes, &errProbe); err == nil && errProbe.Error != nil {
		switch v := errProbe.Error.(type) {
		case string:
			if strings.TrimSpace(v) != "" {
				return "", fmt.Errorf("provider error: %s", v)
			}
		case map[string]interface{}:
			if msg, ok := v["message"].(string); ok && strings.TrimSpace(msg) != "" {
				return "", fmt.Errorf("provider error: %s", msg)
			}
			return "", fmt.Errorf("provider error: %v", v)
		}
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("provider returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content          string `json:"content"`
				ReasoningContent string `json:"reasoning_content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBytes, &result); err != nil {
		return "", fmt.Errorf("failed to parse completion response: %w", err)
	}
	if len(result.Choices) == 0 {
		return "", errors.New("provider returned zero completion choices. Make sure the specified model is loaded in LM Studio")
	}
	if strings.TrimSpace(result.Choices[0].Message.Content) != "" {
		return result.Choices[0].Message.Content, nil
	}
	if strings.TrimSpace(result.Choices[0].Message.ReasoningContent) != "" {
		return result.Choices[0].Message.ReasoningContent, nil
	}
	return "", errors.New("provider returned empty message content")
}

func (s *AIService) callAnthropic(ctx context.Context, req models.AIGenerateRequest) (string, error) {
	if strings.TrimSpace(req.APIKey) == "" {
		return "", errors.New("API key is required for Anthropic Claude")
	}

	endpoint := strings.TrimSpace(req.BaseURL)
	if endpoint == "" {
		endpoint = "https://api.anthropic.com/v1/messages"
	}

	maxTokens := req.MaxTokens
	if maxTokens <= 0 {
		maxTokens = 4096
	}

	payload := map[string]interface{}{
		"model":      req.Model,
		"max_tokens": maxTokens,
		"system":     req.SystemPrompt,
		"messages": []map[string]string{
			{"role": "user", "content": req.UserPrompt},
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", strings.TrimSpace(req.APIKey))
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to reach Anthropic API: %w", err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("Anthropic API error (%d): %s", resp.StatusCode, string(respBytes))
	}

	var result struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(respBytes, &result); err != nil {
		return "", fmt.Errorf("failed to parse Anthropic response: %w", err)
	}
	if len(result.Content) == 0 {
		return "", errors.New("Anthropic returned empty content array")
	}
	return result.Content[0].Text, nil
}

func (s *AIService) callGemini(ctx context.Context, req models.AIGenerateRequest) (string, error) {
	apiKey := strings.TrimSpace(req.APIKey)
	if apiKey == "" {
		return "", errors.New("API key is required for Google Gemini")
	}

	modelName := strings.TrimSpace(req.Model)
	if modelName == "" {
		modelName = "gemini-2.5-flash"
	}
	modelName = strings.TrimPrefix(modelName, "models/")

	base := strings.TrimSpace(req.BaseURL)
	if base == "" {
		base = "https://generativelanguage.googleapis.com/v1beta"
	}
	endpoint := fmt.Sprintf("%s/models/%s:generateContent?key=%s", strings.TrimRight(base, "/"), modelName, apiKey)

	maxTokens := req.MaxTokens
	if maxTokens <= 0 {
		maxTokens = 4096
	}

	payload := map[string]interface{}{
		"systemInstruction": map[string]interface{}{
			"parts": []map[string]string{
				{"text": req.SystemPrompt},
			},
		},
		"contents": []map[string]interface{}{
			{
				"role": "user",
				"parts": []map[string]string{
					{"text": req.UserPrompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"maxOutputTokens": maxTokens,
			"temperature":     0.4,
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to reach Gemini API: %w", err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("Gemini API error (%d): %s", resp.StatusCode, string(respBytes))
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(respBytes, &result); err != nil {
		return "", fmt.Errorf("failed to parse Gemini response: %w", err)
	}
	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("Gemini returned empty candidates")
	}
	return result.Candidates[0].Content.Parts[0].Text, nil
}

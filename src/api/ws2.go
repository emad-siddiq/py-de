package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/websocket"
)

func WebSocketChatGPT(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error while upgrading connection:", err)
		return
	}
	defer ws.Close()
	//TODO: Take this text and make sure it goes to ChatGPT
	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}

		// Call ChatGPT API
		response, err := callChatGPTAPI(string(message))
		if err != nil {
			log.Println("API call error:", err)
			response = "Error calling ChatGPT API"
		}

		// Send response back to client
		err = ws.WriteMessage(websocket.TextMessage, []byte(response))
		if err != nil {
			log.Println("write:", err)
			break
		}
	}

}

// ChatGPTRequest represents the request payload to the ChatGPT API.
type ChatGPTRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

// Message represents a message in the conversation.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatGPTResponse represents the response payload from the ChatGPT API.
type ChatGPTResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

// callChatGPTAPI sends a request to the ChatGPT API and returns the response.
func callChatGPTAPI(prompt string) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "", errors.New("API key is not set")
	}

	apiUrl := "https://api.openai.com/v1/chat/completions"

	requestBody, err := json.Marshal(ChatGPTRequest{
		Model: "gpt-4", // or "gpt-3.5-turbo"
		Messages: []Message{
			{Role: "system", Content: "You are a helpful assistant."},
			{Role: "user", Content: prompt},
		},
	})
	if err != nil {
		return "", err
	}

	// Create a new HTTP request with a context that has a timeout.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "POST", apiUrl, bytes.NewBuffer(requestBody))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{
		Timeout: 10 * time.Second, // Set a timeout for the HTTP client
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, body)
	}

	var chatGPTResponse ChatGPTResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatGPTResponse); err != nil {
		return "", err
	}

	if len(chatGPTResponse.Choices) == 0 {
		return "", errors.New("empty response from ChatGPT")
	}

	return chatGPTResponse.Choices[0].Message.Content, nil
}

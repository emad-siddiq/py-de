package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/websocket"
)

func WebSocketChatGPT(w http.ResponseWriter, r *http.Request) {
	log.Printf("Attempting to upgrade connection to WebSocket for ChatGPT: %s", r.RemoteAddr)
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket for ChatGPT: %v", err)
		http.Error(w, "Could not upgrade to WebSocket", http.StatusInternalServerError)
		return
	}
	// defer func() {
	// 	log.Printf("Closing WebSocket connection for ChatGPT: %s", ws.RemoteAddr())
	// 	ws.Close()
	// }()

	log.Printf("WebSocket connection for ChatGPT established with %s", ws.RemoteAddr())

	ws.SetPingHandler(func(appData string) error {
		log.Printf("Received ping from ChatGPT client: %s", ws.RemoteAddr())
		return ws.WriteControl(websocket.PongMessage, []byte(appData), time.Now().Add(time.Second))
	})

	ws.SetPongHandler(func(appData string) error {
		log.Printf("Received pong from ChatGPT client: %s", ws.RemoteAddr())
		return nil
	})

	ws.SetCloseHandler(func(code int, text string) error {
		log.Printf("WebSocket connection for ChatGPT closed by %s with code %d: %s", ws.RemoteAddr(), code, text)
		return nil
	})

	// Start a goroutine for sending periodic pings
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for {
			<-ticker.C
			if err := ws.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(time.Second)); err != nil {
				log.Printf("Error sending ping to %s: %v", ws.RemoteAddr(), err)
				return
			}
		}
	}()

	for {
		messageType, message, err := ws.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ChatGPT WebSocket read error for %s: %v", ws.RemoteAddr(), err)
			} else {
				log.Printf("ChatGPT WebSocket closed for %s: %v", ws.RemoteAddr(), err)
			}
			break
		}

		log.Printf("Received message type %d from ChatGPT client %s: %s", messageType, ws.RemoteAddr(), string(message))

		response, err := callChatGPTAPI(string(message))
		if err != nil {
			log.Printf("Error calling ChatGPT API for %s: %v", ws.RemoteAddr(), err)
			response = fmt.Sprintf("Sorry, the ChatGPT API is currently unavailable. Error: %v", err)
		}

		log.Printf("Sending response to ChatGPT client %s: %s", ws.RemoteAddr(), response)
		if err := ws.WriteMessage(websocket.TextMessage, []byte(response)); err != nil {
			log.Printf("Error writing to ChatGPT WebSocket for %s: %v", ws.RemoteAddr(), err)
			break
		}
	}
}

func callChatGPTAPI(prompt string) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "ChatGPT API key is not set. Please configure the API key to use this feature.", nil
	}

	log.Printf("Sending message to ChatGPT: %s", prompt)

	apiUrl := "https://api.openai.com/v1/chat/completions"

	requestBody, err := json.Marshal(ChatGPTRequest{
		Model: "gpt-3.5-turbo",
		Messages: []Message{
			{Role: "system", Content: "You are a helpful assistant."},
			{Role: "user", Content: prompt},
		},
	})
	if err != nil {
		return "", fmt.Errorf("error preparing request: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "POST", apiUrl, bytes.NewBuffer(requestBody))
	if err != nil {
		return "", fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error making request to ChatGPT API: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response body: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, body)
	}

	var chatGPTResponse ChatGPTResponse
	if err := json.Unmarshal(body, &chatGPTResponse); err != nil {
		return "", fmt.Errorf("error decoding response: %v", err)
	}

	if len(chatGPTResponse.Choices) == 0 {
		return "", fmt.Errorf("empty response from ChatGPT")
	}

	response := chatGPTResponse.Choices[0].Message.Content
	log.Printf("Received response from ChatGPT: %s", response)

	return response, nil
}

type ChatGPTRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatGPTResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

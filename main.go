package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

type CommandResponse struct {
	Command string `json:"command"`
}

func main() {
	description := flag.String("d", "", "Description of the command to generate")
	execute := flag.Bool("e", false, "Execute the command")

	flag.Parse()

	if *description == "" {
		fmt.Println("Please provide a description for the bash command using -d flag.")
		os.Exit(1)
	}

	bashCommand, err := generateBashCommand(*description)

	if err != nil {
		fmt.Printf("Error generating bash command: %s\n", err)
		os.Exit(1)
	}

	if *execute {
		executeBashCommand(bashCommand)
	} else {
		fmt.Println(bashCommand)
	}

}

func executeBashCommand(bashCommand string) {
	parts := strings.Fields(bashCommand)
	cmd := parts[0]
	args := parts[1:]
	out, err := exec.Command(cmd, args...).CombinedOutput()

	if err != nil {
		fmt.Printf("Error executing command: %s\n%s", err, out)
		return
	}

	fmt.Printf("%s", out)

}

func generateBashCommand(description string) (string, error) {
	openAIAPIKey := os.Getenv("OPENAI_API_KEY")
	client := openai.NewClient(openAIAPIKey)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a smart bot that can generate bash commands from a description provided by user.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "description='Remove all files starting with Screen in the current directory',previousError=''",
				},
				{
					Role:    openai.ChatMessageRoleAssistant,
					Content: "rm -rf Screen*",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "description='show the content for file named test.txt',previousError=''",
				},
				{
					Role:    openai.ChatMessageRoleAssistant,
					Content: "cat test.txt",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: fmt.Sprint("description=", description),
				},
			},
		},
	)

	if err != nil {
		fmt.Printf("ChatCompletion error: %v\n", err)
		return "", err
	}

	return resp.Choices[0].Message.Content, nil
}

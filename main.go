package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"runtime"

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

type ShellInfo struct {
	Executable   string
	FriendlyName string
}

func getShellInfo() ShellInfo {
	switch runtime.GOOS {
	case "windows":
		return ShellInfo{"powershell", "Windows PowerShell"}
	default:
		shell := os.Getenv("SHELL")
		switch shell {
		case "/bin/bash":
			return ShellInfo{"bash", "Bash"}
		case "/bin/zsh":
			return ShellInfo{"zsh", "Zsh"}
		case "/bin/fish":
			return ShellInfo{"fish", "Fish"}
		default:
			return ShellInfo{"sh", "Unix shell"} // default to sh if SHELL is not set
		}
	}
}

func executeBashCommand(commandStr string) {
	shellInfo := getShellInfo()

	var cmd *exec.Cmd
	if shellInfo.Executable == "powershell" {
		cmd = exec.Command(shellInfo.Executable, "-Command", commandStr)
	} else {
		cmd = exec.Command(shellInfo.Executable, "-c", commandStr)
	}

	out, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Error executing command: %s\n", err)
		fmt.Printf("Command output: %s\n", string(out))
		return
	}

	fmt.Printf("Command output: %s\n", string(out))
}

func generateBashCommand(description string) (string, error) {
	shellInfo := getShellInfo()
	osName := runtime.GOOS
	openAIAPIKey := os.Getenv("OPENAI_API_KEY")
	client := openai.NewClient(openAIAPIKey)
	systemMessage := fmt.Sprintf("You are a smart bot that can generate %s commands on %s from a description provided by user.", shellInfo.FriendlyName, osName)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: systemMessage,
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

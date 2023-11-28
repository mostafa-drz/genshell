package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	openai "github.com/sashabaranov/go-openai"
	"github.com/urfave/cli/v2"
)

type Config struct {
	OpenAIAPIToken string `json:"openai_api_token"`
	Model          string `json:"model"`
}

type ShellInfo struct {
	Executable   string
	FriendlyName string
}

const configDirectoryName = ".genshell"
const configFileName = "genshell_config.json"

func main() {
	app := &cli.App{
		Name:  "genshell",
		Usage: "A CLI tool to generate shell commands using OpenAI's ChatGPT",
		Commands: []*cli.Command{
			{
				Name:   "config",
				Usage:  "Configure OpenAI API token and model",
				Action: handleConfigCommand,
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:  "api-token",
						Usage: "Your OpenAI API token",
					},
					&cli.StringFlag{
						Name:  "model",
						Usage: "The OpenAI model to use",
					},
				},
			},
		},
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name:    "execute",
				Aliases: []string{"e"},
				Usage:   "Execute the generated command",
			},
		},
		ArgsUsage: "[command description]",
		Action:    handleExecuteCommand,
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatal(err)
	}

}

func handleConfigCommand(c *cli.Context) error {
	apiToken := c.String("api-token")
	model := c.String("model")

	if apiToken == "" {
		log.Fatalf("You must provide an OpenAI API token")
	}

	cfg := Config{
		OpenAIAPIToken: apiToken,
		Model:          model,
	}

	err := saveConfig(cfg)
	if err != nil {
		log.Fatalf("Error saving configuration: %s\n", err)
	}

	fmt.Println("Configuration saved successfully.")
	return nil
}

// SaveConfig saves the configuration to a file.
func saveConfig(cfg Config) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	configFilePath := getConfigFilePath()
	return os.WriteFile(configFilePath, data, 0600)
}

// LoadConfig loads the configuration from a file.
func loadConfig() (Config, error) {
	var cfg Config
	configFilePath := getConfigFilePath()
	data, err := os.ReadFile(configFilePath)
	if err != nil {
		return cfg, err
	}
	err = json.Unmarshal(data, &cfg)
	return cfg, err
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

func handleExecuteCommand(c *cli.Context) error {
	description := c.Args().First()
	if description == "" {
		log.Fatalf("expected a description for the command")
	}

	bashCommand, err := generateBashCommand(description)
	if err != nil {
		log.Fatalf("Error generating bash command: %s\n", err)
	}

	fmt.Println(bashCommand)

	if c.Bool("execute") {
		executeBashCommand(bashCommand)
	}

	return nil
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
		fmt.Print(string(out))
		return
	}

	fmt.Print(string(out))
}

func generateBashCommand(description string) (string, error) {
	cfg, err := loadConfig()
	if err != nil {
		fmt.Printf("Error loading configuration: %s\n", err)
		return "", err
	}
	shellInfo := getShellInfo()
	osName := runtime.GOOS
	openAIAPIKey := cfg.OpenAIAPIToken
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
					Content: "description='Remove all files starting with Screen in the current directory'",
				},
				{
					Role:    openai.ChatMessageRoleAssistant,
					Content: "rm -rf Screen*",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "description='show the content for file named test.txt'",
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

func getConfigFilePath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatalf("Error finding home directory: %v", err)
	}

	configDir := filepath.Join(homeDir, configDirectoryName)
	if err := os.MkdirAll(configDir, 0700); err != nil {
		log.Fatalf("Error creating config directory: %v", err)
	}

	return filepath.Join(configDir, configFileName)
}

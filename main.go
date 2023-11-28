package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	openai "github.com/sashabaranov/go-openai"
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
const githubRepositoryURL = "https://github.com/mostafa-drz/genshell"

func main() {

	help := flag.Bool("help", false, "Display help information")
	execute := flag.Bool("e", false, "Execute the command")
	flag.Parse()

	// Subcommands
	configCmd := flag.NewFlagSet("config", flag.ExitOnError)
	apiToken := configCmd.String("api-token", "", "Your OpenAI API token")
	model := configCmd.String("model", "gpt-3.5-turbo", "The OpenAI model to use")

	if *help {
		displayHelp()
		os.Exit(0)
	}

	// Check which subcommand is invoked.
	if len(os.Args) < 2 {
		log.Fatalf("expected 'config' subcommand or option '-e' '-h'")
	}

	switch os.Args[1] {
	case "config":
		handleConfigSubcommand(configCmd, apiToken, model)
	default:
		// The default case now assumes the remaining arguments are the description
		description := strings.Join(flag.Args(), " ")
		if description == "" {
			log.Fatalf("expected a description for the command")
		}

		bashCommand, err := generateBashCommand(description)
		if err != nil {
			log.Fatalf("Error generating bash command: %s\n", err)
		}

		fmt.Println(bashCommand)

		if *execute {
			executeBashCommand(bashCommand)
		}
	}

}

func handleConfigSubcommand(configCmd *flag.FlagSet, apiToken *string, model *string) {
	configCmd.Parse(os.Args[2:])
	fmt.Printf("apiToken: %s\n", *apiToken)

	if *apiToken == "" {
		log.Fatalf("You must provide an OpenAI API token")
	}

	modelValue := "gpt-3.5-turbo"

	if *model != "" {
		modelValue = *model
	}

	cfg := Config{
		OpenAIAPIToken: *apiToken,
		Model:          modelValue,
	}
	err := saveConfig(cfg)
	if err != nil {
		log.Fatalf("Error saving configuration: %s\n", err)
	}
	fmt.Println("Configuration saved successfully.")
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

// displayHelp prints the help information
func displayHelp() {
	fmt.Println("genshell - A CLI tool to generate shell commands using OpenAI's ChatGPT")
	fmt.Println("\nUsage:")
	fmt.Println("  genshell [options] \"command description\"")
	fmt.Println("\nOptions:")
	fmt.Println("  -e, --execute      Execute the generated command")
	fmt.Println("  -h, --help         Display help information")
	fmt.Println("  config             Configure OpenAI API token and model")
	fmt.Println("\nExamples:")
	fmt.Println("  genshell \"list all files in the current directory\"")
	fmt.Println("  genshell -e \"create a new directory named 'test'\"")
	fmt.Println("  genshell config --api-token \"your_api_token\" --model \"gpt-3.5-turbo\"")
	fmt.Printf("\nFor more information, visit %s\n", githubRepositoryURL)
}

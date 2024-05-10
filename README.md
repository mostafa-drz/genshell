# Genshell

Genshell is a CLI tool that generates shell commands from natural language descriptions using AI models (Google's Gemini and OpenAI's ChatGPT).

## Features

- Generate shell commands using natural language descriptions.
- Support for multiple AI providers (Gemini and ChatGPT).
- Configurable profiles to switch between different API keys and models.
- Supports various shell environments (Bash, Zsh, Fish, PowerShell).

## Installation

```sh
npm install -g genshell
```

## Configuration

You can configure multiple profiles and switch between them.

### Add a Profile

```sh
genshell config add --profile-name <profileName> --api-key <apiKey> --model <model> --provider <provider>
```

### Update a Profile

```sh
genshell config update --profile-name <profileName> --api-key <apiKey> --model <model> --provider <provider>
```

### List Profiles

```sh
genshell config list
```

### Show active Profile

```sh
genshell config active
```

### activate a different Profile

```sh
genshell config activate <profileName>
```

### Remove Profile

```sh
genshell config remove --profile-name <profileName>
```

## Usage

To generate a shell command:

```sh
genshell "description of the command"
```

To generate and execute the command:

```sh
genshell "description of the command" --execute
```

## Examples

```sh
genshell "list all files in the current directory"
# Output: ls -al

genshell "create a new directory named 'my-dir'"
# Output: mkdir my-dir
```

## Profile Details

### Providers

- `chatgpt`: Use OpenAI's ChatGPT for generating shell commands.
- `gemini`: Use Google's Gemini for generating shell commands.

### Models

#### For ChatGPT

Check [here](https://platform.openai.com/docs/guides/text-generation) for a list of supported models by OpenAI API.

#### For Gemini

Check [here](https://ai.google.dev/gemini-api/docs/models/gemini) for a list of supported models by Gemini API.

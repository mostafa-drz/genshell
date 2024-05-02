# Genshell

Genshell is a command-line interface (CLI) tool that leverages Google's Gemini API to generate shell commands from natural language descriptions. This tool simplifies the task of generating shell-specific commands by interpreting user inputs and converting them into executable commands.

## Requirements

Genshell requires Node.js to run. Ensure that Node.js is installed on your system before installing and using Genshell. You can download and install Node.js from [nodejs.org](https://nodejs.org/).

## Installation

Install Genshell globally using npm:

```bash
npm install -g genshell
```

This will allow you to use the genshell command anywhere on your system.

## Configuration

Before using Genshell, you need to configure it with your Gemini API key and the model you intend to use. This is done through the config command:

```bash
genshell config --api-key YOUR_API_KEY --model gemini-pro
```

The default model is gemini-pro, but you can specify other models supported by the Gemini API.

## Usage

```bash
genshell "List all files in the current directory"
// ls -al
```

```bash
genshell "List all my Google cloud projects"
// gcloud projects list
```

If you want to execute the generated command directly, you can append the --execute flag:

```bash
genshell -e "Print the current date"
```

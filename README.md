# genshell

`genshell` is a command-line interface (CLI) tool that utilizes OpenAI's ChatGPT to generate shell commands based on your operating systems from natural language descriptions. This tool aims to bridge the gap between human language and shell commands, making it easier for users to perform tasks without needing to remember specific command syntax.

## Disclaimer

Before using `genshell`, please note the following:

- `genshell` generates shell commands based on the descriptions provided by the user, utilizing OpenAI's ChatGPT model.
- Users should exercise caution and review each command thoroughly before execution to ensure it aligns with their intended actions.
- The responsibility for any effects from executing the generated commands lies solely with the user.
- Users should be mindful of the information sent to ChatGPT, as it may contain sensitive data. Ensure no confidential or personal information is included in the descriptions.

## API Reference

`genshell` requires an OpenAI API key to interact with the ChatGPT model. Users must provide their API key through the configuration command after installation.

## Installation

To install `genshell` on your local machine, follow these steps:

1. Ensure you have Go installed on your system. You can download it from [the official Go website](https://golang.org/dl/).

2. Clone the `genshell` repository:

    ```sh
    git clone https://github.com/yourusername/genshell.git
    ```

3. Change into the `genshell` directory:

    ```sh
    cd genshell
    ```

4. Build the executable:

    ```sh
    go build -o genshell
    ```

5. Optionally, add the `genshell` executable to your PATH to run it from anywhere.

## Configuration

Set your OpenAI API key with the following command:

```sh
./genshell config --api-token "your_openai_api_key_here"
```

You can also specify the model you wish to use with genshell:

```sh
./genshell config --model "model_name_here"
```

## Usage

Generate a command with genshell by providing a description:

```sh
./genshell "describe your command here"
```

To execute the generated command directly, include the -e flag:

```sh
./genshell -e "describe your command here"
```

## Examples

Below are some examples of how you can use genshell to generate and execute shell commands:

```sh
./genshell -e "show disk usage in human-readable format"
```

```sh
./genshell "move all .jpg files to the 'images' directory"
```

```sh
./genshell -e "zip the contents of 'documents' folder into 'archive.zip'"
```

```sh
./genshell "list all running processes"
```

## Contributing

If you're interested in contributing to genshell, please fork the repository and submit a pull request with your changes. Bug reports and feature requests are also welcome as issues in the repository.

## License

genshell is released under the MIT License.

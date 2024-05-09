import { Command } from 'commander';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import path from 'path';
import os from 'os';
import { ShellInfo, Config } from './types';
import * as gemini from './gemini';

const configDirectoryName = '.genshell';
const configFileName = 'genshell_config.json';
const defaultModel = 'gemini-pro';

const app = new Command();

app
  .name('genshell')
  .description("A CLI tool to generate shell commands using Gemini's AI model.")
  .option('-e, --execute', 'Execute the generated command');

app
  .command('config')
  .description('Configure Gemini API key and model')
  .requiredOption('--api-key <apiKey>', 'Your Gemini API key')
  .requiredOption('--model <model>', 'The Gemini model to use', defaultModel)
  .action(async (opts) => {
    const cfg: Config = {
      apiKey: opts.apiKey,
      model: opts.model,
    };
    await saveConfig(cfg);
    console.log('Configuration saved successfully.');
  });

app.arguments('<commandDescription>').action(async (commandDescription) => {
  if (!commandDescription) {
    console.error('Expected a description for the command.');
    process.exit(1);
  }
  const command = await generateBashCommand(commandDescription);
  console.log(command);

  if (app.opts().execute) {
    executeBashCommand(command);
  }
});

app.parse(process.argv);

async function saveConfig(cfg: Config): Promise<void> {
  const data = JSON.stringify(cfg, null, 2);
  const configFilePath = getConfigFilePath();
  await fs.writeFile(configFilePath, data, { mode: 0o600 });
}

async function loadConfig(): Promise<Config> {
  const configFilePath = getConfigFilePath();
  const data = await fs.readFile(configFilePath, 'utf-8');
  return JSON.parse(data) as Config;
}

function getConfigFilePath(): string {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, configDirectoryName);
  fs.mkdir(configDir, { recursive: true, mode: 0o700 });
  return path.join(configDir, configFileName);
}

function getShellInfo(): ShellInfo {
  switch (os.platform()) {
    case 'win32':
      return { executable: 'powershell', friendlyName: 'Windows PowerShell' };
    default:
      const shell = process.env.SHELL;
      switch (shell) {
        case '/bin/bash':
          return { executable: 'bash', friendlyName: 'Bash' };
        case '/bin/zsh':
          return { executable: 'zsh', friendlyName: 'Zsh' };
        case '/bin/fish':
          return { executable: 'fish', friendlyName: 'Fish' };
        default:
          return { executable: 'sh', friendlyName: 'Unix shell' }; // default to sh if SHELL is not set
      }
  }
}

async function generateBashCommand(description: string): Promise<string> {
  const cfg = await loadConfig();
  const shellInfo = getShellInfo();
  const osName = os.platform();
  const text = await gemini.generateBashCommand({
    apiKey: cfg.apiKey,
    shellInfo,
    osName,
    description,
    model: cfg.model,
  });
  if (typeof text !== 'string') {
    return 'No command generated.';
  }
  return text;
}

function executeBashCommand(commandStr: string): void {
  const shellInfo = getShellInfo();
  exec(`${shellInfo.executable} -c '${commandStr}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
}

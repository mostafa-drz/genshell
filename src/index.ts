import { Command } from 'commander';
import { exec } from 'child_process';
import os from 'os';
import { ShellInfo, ConfigProfile, Provider } from './types';
import * as gemini from './gemini';
import * as chatgpt from './chatgpt';
import {
  getCurrentProfile,
  listProfiles,
  setCurrentProfile,
  addProfile,
  removeProfile,
  updateProfile,
} from './configs';

const app = new Command();

app
  .name('genshell')
  .description("A CLI tool to generate shell commands using Gemini's AI model.")
  .option('-e, --execute', 'Execute the generated command');

const config = app.command('config').description('Manage configuration profiles');

// Add subcommand
config
  .command('add')
  .description('Add a new profile')
  .requiredOption('--profile-name <profileName>', 'Profile name')
  .requiredOption('--api-key <apiKey>', 'API key')
  .requiredOption('--model <model>', 'Model to use')
  .requiredOption('--provider <provider>', 'Provider (chatgpt or gemini)')
  .action(async (opts) => {
    const newProfile: ConfigProfile = {
      name: opts.profileName,
      apiKey: opts.apiKey,
      model: opts.model,
      provider: opts.provider as Provider,
    };
    await addProfile(opts.profileName, newProfile);
    console.log(`Added new profile: ${opts.profileName}`);
  });

// Update subcommand
config
  .command('update')
  .description('Update an existing profile')
  .requiredOption('--profile-name <profileName>', 'Profile name')
  .option('--api-key <apiKey>', 'API key')
  .option('--model <model>', 'Model to use')
  .option('--provider <provider>', 'Provider (chatgpt or gemini)')
  .action(async (opts) => {
    const existingProfile = await getCurrentProfile();
    if (!existingProfile) {
      console.error(`Profile ${opts.profileName} does not exist.`);
      process.exit(1);
    }
    const updatedProfile: ConfigProfile = {
      name: opts.profileName,
      apiKey: opts.apiKey || existingProfile.apiKey,
      model: opts.model || existingProfile.model,
      provider: opts.provider ? (opts.provider as Provider) : existingProfile.provider,
    };
    await updateProfile(opts.profileName, updatedProfile);
    console.log(`Updated profile: ${opts.profileName}`);
  });

// List subcommand
config
  .command('list')
  .description('List all profiles')
  .action(async () => {
    const profiles = await listProfiles();
    console.log('Available profiles:', profiles);
  });

// Current subcommand
config
  .command('current')
  .description('Show current profile')
  .action(async () => {
    const currentProfile = await getCurrentProfile();
    if (currentProfile) {
      console.log('Current profile:', currentProfile);
    } else {
      console.log('No current profile set.');
    }
  });

// Switch subcommand
config
  .command('switch')
  .description('Switch to a different profile')
  .requiredOption('--profile-name <profileName>', 'Profile name to switch to')
  .action(async (opts) => {
    await setCurrentProfile(opts.profileName);
    console.log(`Switched to profile: ${opts.profileName}`);
  });

// Remove subcommand
config
  .command('remove')
  .description('Remove a profile')
  .requiredOption('--profile-name <profileName>', 'Profile name to remove')
  .action(async (opts) => {
    await removeProfile(opts.profileName);
    console.log(`Removed profile: ${opts.profileName}`);
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
  const currentConfig = await getCurrentProfile();
  const shellInfo = getShellInfo();
  const osName = os.platform();
  if (!currentConfig) {
    console.error('Please configure your API key and model first.');
    process.exit(1);
  }

  let command;
  switch (currentConfig.provider) {
    case 'gemini':
      command = await gemini.generateCommand({
        description,
        shellInfo,
        osName,
        apiKey: currentConfig.apiKey,
        model: currentConfig.model,
      });
      break;
    case 'chatgpt':
      command = await chatgpt.generateCommand({
        description,
        shellInfo,
        osName,
        apiKey: currentConfig.apiKey,
        model: currentConfig.model,
      });
    default:
      throw new Error('Invalid provider.');
  }

  if (typeof command !== 'string') {
    return 'No command generated.';
  }
  return command;
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

import { Command } from 'commander';

import { ConfigProfile, Provider } from './types';
import { addProfile, getCurrentProfile, setCurrentProfile, removeProfile, listProfiles } from './configs';
import { generateShellCommand, executeShellCommand } from './shell';
import { DEFAULT_MODEL_BY_PROVIDER } from './utils';

const app = new Command();

app
  .name('genshell')
  .description("A CLI tool to generate shell commands using LLM's API.")
  .option('-e, --execute', 'Execute the generated command, if not set, only the command will be printed.');

const config = app.command('config').description('Manage configuration profiles');

// Add subcommand
config
  .command('add')
  .description('Add a new profile')
  .requiredOption('--api-key <apiKey>', 'API key')
  .option('--provider <provider>', 'Provider (chatgpt or gemini), default is gemini', Provider.gemini)
  .option('--profile-name <profileName>', 'Profile name', 'default')
  .option('--model <model>', 'Model to use', undefined)
  .action(async (opts) => {
    const newProfile: ConfigProfile = {
      name: opts.profileName,
      apiKey: opts.apiKey,
      model: opts?.model ?? opts.provider ? DEFAULT_MODEL_BY_PROVIDER?.[opts.provider] : undefined,
      provider: opts.provider as Provider,
    };
    await addProfile(opts.profileName, newProfile);
    console.log(`Added new profile: ${opts.profileName}`);
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
  .command('active')
  .description('Show active profile')
  .action(async () => {
    const currentProfile = await getCurrentProfile();
    if (currentProfile) {
      console.log('Active profile:', currentProfile);
    } else {
      console.log('No current profile set.');
    }
  });

// Switch subcommand
config
  .command('activate')
  .description('Switch to a different profile')
  .argument('<profileName>', 'Profile name to switch to')
  .action(async (profileName) => {
    await setCurrentProfile(profileName);
    console.log(`Switched to profile: ${profileName}`);
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
  const command = await generateShellCommand(commandDescription);
  console.log(command);

  if (app.opts().execute) {
    executeShellCommand(command);
  }
});

export default app;

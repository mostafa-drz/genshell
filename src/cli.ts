import { Command } from 'commander';

import { ConfigProfile, Provider } from './types';
import {
  addProfile,
  getCurrentProfile,
  updateProfile,
  setCurrentProfile,
  removeProfile,
  listProfiles,
} from './configs';
import { generateBashCommand, executeBashCommand } from './shell';

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

export default app;

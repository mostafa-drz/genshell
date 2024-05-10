import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';

import { Config, ConfigProfile } from './types';

const configDirectoryName = '.genshell';
const configFileName = 'genshell_config.json';

function getConfigFilePath(): string {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, configDirectoryName);
  fs.mkdir(configDir, { recursive: true, mode: 0o700 });
  return path.join(configDir, configFileName);
}

export async function saveConfigs(cfg: Config): Promise<void> {
  const data = JSON.stringify(cfg, null, 2);
  const configFilePath = getConfigFilePath();
  await fs.writeFile(configFilePath, data, { mode: 0o600 });
}

export async function getConfigs(): Promise<Config> {
  const configFilePath = getConfigFilePath();
  let data;
  try {
    data = await fs.readFile(configFilePath, 'utf-8');
  } catch (e) {
    // File doesn't exist, create a new one
    data = '{}';
  }
  return JSON.parse(data) as Config;
}

export async function addProfile(profileName: string, newProfile: ConfigProfile): Promise<void> {
  const cfg = await getConfigs();
  const isFirstProfile = Object.keys(cfg).length === 0;
  cfg[profileName] = { ...newProfile };
  if (isFirstProfile) {
    cfg.currentProfile = profileName;
  }
  await saveConfigs(cfg);
}

export async function removeProfile(profileName: string): Promise<void> {
  const cfg = await getConfigs();
  delete cfg[profileName];
  await saveConfigs(cfg);
}

export async function listProfiles(): Promise<string[]> {
  const cfg = await getConfigs();
  return Object.keys(cfg);
}

export async function updateProfile(profileName: string, newProfile: ConfigProfile): Promise<void> {
  const cfg = await getConfigs();
  cfg[profileName] = { ...newProfile };
  await saveConfigs(cfg);
}

export async function setCurrentProfile(profileName: string): Promise<void> {
  const cfg = await getConfigs();
  cfg.currentProfile = profileName;
  await saveConfigs(cfg);
}

export async function getCurrentProfile(): Promise<ConfigProfile | null> {
  const cfg = await getConfigs();
  const currentProfileName = cfg.currentProfile ?? null;
  if (!currentProfileName) {
    return null;
  }
  return cfg[currentProfileName] ?? null;
}

export enum Provider {
  chatgpt = 'chatgpt',
  gemini = 'gemini',
}

export interface ShellInfo {
  executable: string;
  friendlyName: string;
}

export type OsName = NodeJS.Platform;

export type GenerateCommand = (params: {
  apiKey: string;
  shellInfo: ShellInfo;
  osName: OsName;
  description: string;
  model?: string;
}) => Promise<string | null>;

export interface ConfigProfile {
  name: string;
  apiKey: string;
  model: string;
  provider: Provider;
}

export type Config = {
  [profileName: string]: ConfigProfile;
} & {
  currentProfile: string;
};

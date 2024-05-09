export type Config = {
  apiKey: string;
  model: string;
};

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

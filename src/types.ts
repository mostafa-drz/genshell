export type Config = {
  apiKey: string;
  model: string;
};

export interface ShellInfo {
  executable: string;
  friendlyName: string;
}

export type OsName = NodeJS.Platform;

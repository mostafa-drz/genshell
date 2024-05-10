import os from 'os';
import { OsName, ShellInfo } from './types';

export function getOsName(): OsName {
  return os.platform();
}

export function getShellInfo(): ShellInfo {
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

export const DEFAULT_MODEL_BY_PROVIDER = {
  gemini: 'gemini-pro',
  chatgpt: 'gpt-3.5-turbo',
};

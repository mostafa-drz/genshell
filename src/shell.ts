import { exec } from 'child_process';
import os from 'os';
import { getShellInfo } from './utils';
import * as gemini from './gemini';
import * as chatgpt from './chatgpt';
import { getCurrentProfile } from './configs';

export async function generateBashCommand(description: string): Promise<string> {
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

export function executeBashCommand(commandStr: string): void {
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

import OpenAI from 'openai';
import { ShellInfo, OsName } from './types';
import { createPrompt } from './prompt';

const DEFAULT_MODEL = 'gpt-3.5-turbo';

export const generateCommand = async ({
  apiKey,
  shellInfo,
  osName,
  description,
  model = DEFAULT_MODEL,
}: {
  apiKey: string;
  shellInfo: ShellInfo;
  osName: OsName;
  description: string;
  model?: string;
}) => {
  const openai = new OpenAI({
    apiKey,
  });
  const prompt = createPrompt({ shellInfo, osName, description });
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: prompt }],
    model,
  });

  const response = chatCompletion.choices[0];
  const text = response.message.content;
  return text;
};

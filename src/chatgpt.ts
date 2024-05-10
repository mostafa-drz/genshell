import OpenAI from 'openai';
import { GenerateCommand } from './types';
import { createPrompt } from './prompt';
import { GENERATION_CONFIG } from './utils';

const DEFAULT_MODEL = 'gpt-3.5-turbo';

export const generateCommand: GenerateCommand = async ({
  apiKey,
  shellInfo,
  osName,
  description,
  model = DEFAULT_MODEL,
}) => {
  const openai = new OpenAI({
    apiKey,
  });
  const prompt = createPrompt({ shellInfo, osName, description });
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: prompt }],
    model,
    temperature: GENERATION_CONFIG.temperature,
    max_tokens: GENERATION_CONFIG.maxToken,
    top_p: GENERATION_CONFIG.topP,
  });

  const response = chatCompletion.choices[0];
  const text = response.message.content;
  return text;
};

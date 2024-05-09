import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateCommand } from './types';
import { createPrompt } from './prompt';

const DEFAULT_MODEL = 'gemini-pro';

export const generateCommand: GenerateCommand = async ({
  apiKey,
  shellInfo,
  osName,
  description,
  model = DEFAULT_MODEL,
}) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: model ?? DEFAULT_MODEL });
  const prompt = createPrompt({ shellInfo, osName, description });
  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
};

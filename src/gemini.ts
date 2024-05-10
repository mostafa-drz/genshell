import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { GenerateCommand } from './types';
import { createPrompt } from './prompt';
import { GENERATION_CONFIG } from './utils';

const DEFAULT_MODEL = 'gemini-pro';

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

export const generateCommand: GenerateCommand = async ({
  apiKey,
  shellInfo,
  osName,
  description,
  model = DEFAULT_MODEL,
}) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model ?? DEFAULT_MODEL,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      maxOutputTokens: GENERATION_CONFIG.maxToken,
      temperature: GENERATION_CONFIG.temperature,
      topP: GENERATION_CONFIG.topP,
    },
  });
  const prompt = createPrompt({ shellInfo, osName, description });
  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
};

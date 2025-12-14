import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, ModelType } from '../types.ts';

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY not found in environment variables");
      throw new Error("API_KEY is missing");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

export const streamChatResponse = async (
  history: Message[],
  newMessage: string,
  modelName: ModelType,
  onChunk: (text: string) => void,
  abortSignal?: AbortSignal
): Promise<string> => {
  try {
    const ai = getGenAI();
    
    // Convert generic Message format to Gemini chat format
    // We only take the last few messages to maintain context without overloading tokens
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const chat = ai.chats.create({
      model: modelName,
      history: recentHistory,
      config: {
        systemInstruction: "You are Askk AI, a helpful, intelligent assistant integrated with various tools. Be concise, professional, and friendly.",
      },
    });

    const result = await chat.sendMessageStream({ message: newMessage });
    
    let fullText = '';
    for await (const chunk of result) {
      if (abortSignal?.aborted) {
        break;
      }
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;

  } catch (error) {
    console.error("Error streaming chat response:", error);
    throw error;
  }
};
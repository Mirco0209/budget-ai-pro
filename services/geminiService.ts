import { GoogleGenAI } from "@google/genai";
import { storageService } from "./storageService";

declare const process: any;

// In a real production app, this key should be proxied via a backend.
// Since we are mocking the frontend, we assume the environment variable is injected.
// If testing locally without env, you might need to insert a key here temporarily (NOT RECOMMENDED for commit).
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateFinancialAdvice = async (userQuery: string, chatHistory: string): Promise<string> => {
  const summary = storageService.getFinancialSummary();
  const settings = storageService.getSettings();

  const contextPrompt = `
    You are an expert financial advisor named "Budget AI". You are precise, slightly strict but helpful.
    
    USER CONTEXT:
    - Name: ${settings.username}
    - Currency: ${settings.currency}
    - Current Month Income: ${summary.totalIncome}
    - Current Month Expenses: ${summary.totalExpense}
    - Current Month Refunds: ${summary.totalRefund}
    - Net Balance: ${summary.balance}
    - Expense Breakdown: ${JSON.stringify(summary.categoryBreakdown)}

    INSTRUCTIONS:
    - Analyze the user's financial situation based on the data above.
    - Provide actionable, specific advice.
    - If expenses > income, be critical and suggest specific cuts based on the breakdown.
    - Keep answers concise (under 200 words) unless asked for a detailed plan.
    - Use Markdown for formatting.
    
    USER QUERY: "${userQuery}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `Previous conversation context:\n${chatHistory}` }] },
        { role: 'user', parts: [{ text: contextPrompt }] }
      ],
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I cannot access my financial brain right now. Please check your API Key configuration.";
  }
};

export const analyzeReceipt = async (base64Image: string): Promise<any> => {
  try {
    // Remove header if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `
      Analyze this receipt image. Extract the following information in JSON format:
      - totalAmount: The total sum paid (number only).
      - date: The date of purchase in YYYY-MM-DD format. If not found, use today.
      - merchant: The name of the store/merchant.
      - category: Suggest one category from this list: ['Food/Dining', 'Shopping', 'Transportation', 'Entertainment', 'Health', 'Housing/Bills', 'Other'].
      
      Return ONLY the JSON string, no markdown code blocks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            }
          ]
        }
      ]
    });

    const text = response.text || "{}";
    // Clean up markdown if Gemini adds it despite instructions
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Receipt Analysis Error:", error);
    throw new Error("Failed to analyze receipt");
  }
};
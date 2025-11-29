import { GoogleGenAI } from "@google/genai";
import { Atendente } from '../types';

export const generateTeamReport = async (atendentes: Atendente[]): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  const activeAgents = atendentes.filter(a => a.status).map(a => a.nome).join(', ');
  const inactiveAgents = atendentes.filter(a => !a.status).map(a => a.nome).join(', ');
  const total = atendentes.length;
  const activeCount = atendentes.filter(a => a.status).length;

  const prompt = `
    Analyze the following support team status data:
    Total Agents: ${total}
    Active Agents (${activeCount}): ${activeAgents || 'None'}
    Inactive Agents (${total - activeCount}): ${inactiveAgents || 'None'}

    Please provide a concise, professional executive summary (max 3 sentences) of the current team availability. 
    Highlight if the staffing level is critical (below 50%) or healthy. 
    Use a helpful and professional tone.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate AI report.");
  }
};

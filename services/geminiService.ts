import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getTacticalAdvice = async (
  query: string,
  players: Player[]
): Promise<string> => {
  if (!apiKey) {
    return "Erro: Chave de API não configurada. Por favor, verifique as suas configurações.";
  }

  const teamContext = players.map(p => 
    `${p.name} (#${p.number}) [Golos: ${p.goals}, Assistências: ${p.assists}]`
  ).join('\n');

  const prompt = `
    És um treinador experiente de Futsal (nível profissional).
    Aqui está o plantel da minha equipa:
    ${teamContext}

    O utilizador pergunta: "${query}"

    Por favor, fornece uma resposta tática, prática e curta (máximo 3 parágrafos).
    Responde sempre em Português de Portugal (pt-PT).
    Foca-te em movimentações, sistemas (4-0, 3-1, 2-2) ou bolas paradas se aplicável.
    Usa formatação Markdown simples.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não consegui gerar uma resposta tática no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, ocorreu um erro ao consultar o treinador tático.";
  }
};
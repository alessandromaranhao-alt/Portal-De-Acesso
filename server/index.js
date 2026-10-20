import http from 'http';
import { GoogleGenAI, Type } from '@google/genai';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// Load .env / .env.local manually if present
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        val = val.trim().replace(/^['"](.*)['"]$/, '$1');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

const getAIClient = () => {
  if (!API_KEY) {
    console.warn("[AML Server] Warning: GEMINI_API_KEY not found in environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Helper to parse JSON body
  const parseBody = () => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });

  const sendJson = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/health') {
    return sendJson(200, { status: 'ok', hasApiKey: !!API_KEY });
  }

  if (req.method === 'POST') {
    const ai = getAIClient();
    if (!ai) {
      return sendJson(503, { error: 'Gemini API Key não configurada no servidor backend.' });
    }

    try {
      const body = await parseBody();

      // 1. Analyze Document OCR
      if (url.pathname === '/api/ai/analyze-document') {
        const { base64Image } = body;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
              { text: "Analise este documento de identificação brasileiro (RG, CNH, CPF). Extraia o Nome Completo (name), Número do Documento (documentNumber) e Data de Nascimento (birthDate). Retorne apenas JSON." }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                documentNumber: { type: Type.STRING },
                birthDate: { type: Type.STRING }
              }
            }
          }
        });
        return sendJson(200, { result: response.text || "{}" });
      }

      // 2. Analyze Face
      if (url.pathname === '/api/ai/analyze-face') {
        const { base64Image } = body;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
              { text: "Analise este rosto para cadastro em sistema de segurança. Confirme se é um rosto humano claro, estime a faixa etária e descreva características distintivas para correspondência. Responda em Português do Brasil. Seja breve." }
            ]
          }
        });
        return sendJson(200, { result: response.text || "Falha na análise facial." });
      }

      // 3. System Diagnostics
      if (url.pathname === '/api/ai/diagnostics') {
        const { logs } = body;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analise os seguintes logs do sistema de segurança para identificar possíveis vulnerabilidades ou bugs. Sugira uma correção técnica.
Logs: ${(logs || []).join('\n')}`
        });
        return sendJson(200, { result: response.text || "Diagnóstico concluído sem anomalias críticas." });
      }

      // 4. Sales Pitch
      if (url.pathname === '/api/ai/sales-pitch') {
        const { topic } = body;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Crie um parágrafo de vendas curto e persuasivo para o sistema "Portaria Pro" focando em: ${topic}. Destaque IA e segurança. Responda em Português do Brasil.`
        });
        return sendJson(200, { result: response.text || "" });
      }

    } catch (err) {
      console.error("[AML Server Error]:", err);
      return sendJson(500, { error: err.message || 'Erro interno no processamento da IA' });
    }
  }

  sendJson(404, { error: 'Rota não encontrada' });
});

server.listen(PORT, () => {
  console.log(`[AML Security Server] Rodando com sucesso na porta ${PORT}`);
});

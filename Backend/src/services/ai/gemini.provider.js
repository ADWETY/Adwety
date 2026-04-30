const env = require('../../config/env');

function stripCodeFence(text = '') {
  return text.replace(/^```json\s*/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
}

module.exports = async function callGemini({ fileBuffer, mimeType, prompt }) {
  if (!env.geminiApiKey) throw new Error('Missing GEMINI_API_KEY');
  const response = await fetch(`${env.geminiBaseUrl}/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: fileBuffer.toString('base64') } }] }],
    }),
    signal: AbortSignal.timeout(env.aiTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '{}';
  return JSON.parse(stripCodeFence(text));
};

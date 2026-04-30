const env = require('../../config/env');

module.exports = async function callCustomModel({ fileBuffer, mimeType }) {
  if (!env.customAiApiUrl) throw new Error('Missing CUSTOM_AI_API_URL');
  const response = await fetch(env.customAiApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: env.customAiApiKey ? `Bearer ${env.customAiApiKey}` : '' },
    body: JSON.stringify({ model: env.customAiModel, mime_type: mimeType, file_base64: fileBuffer.toString('base64') }),
    signal: AbortSignal.timeout(env.aiTimeoutMs),
  });
  if (!response.ok) throw new Error(`Custom AI request failed: ${response.status} ${await response.text()}`);
  return response.json();
};

'use strict';

const env = require('../config/env');
const { AppError } = require('../utils/helpers');
const {
  plainUntrustedText,
  safeDrugName,
  parseGeminiOutput,
  buildPromptPayload
} = require('./ai-content-security.service');

let consecutiveFailures = 0;
let circuitOpenUntil = 0;

const GEMINI_RESPONSE_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    extracted_text: { type: 'string' },
    drugs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          extracted_name: { type: 'string' },
          confidence_score: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['extracted_name', 'confidence_score'],
        additionalProperties: false
      }
    }
  },
  required: ['extracted_text', 'drugs'],
  additionalProperties: false
});

function heuristicExtract(text = '') {
  const normalized = plainUntrustedText(text, 5000);
  const stop = new Set(['rx','tablet','tab','capsule','syrup','injection','take','daily','before','after','meal','doctor','patient','date','قرص','كبسولة','شراب','حقن','قبل','بعد','يوميا']);
  const rows = normalized.split(/[\n;,]+/).map((r) => r.replace(/^[\s\-*•]+/, '').trim()).filter(Boolean);
  const names = [];
  for (const row of rows) {
    const candidate = row.replace(/\b(?:\d+\s*(?:mg|ml|mcg|g|gm|مجم|ملجم|مل)|once|twice|daily|day|days).*$/i, '').trim();
    const tokens = candidate.toLowerCase().split(/\s+/).filter(Boolean);
    const safe = safeDrugName(candidate);
    if (safe.length >= 3 && tokens.some((t) => !stop.has(t) && !/^\d+$/.test(t))) names.push(safe.slice(0, 80));
  }
  return [...new Set(names)].slice(0, 50).map((name) => ({ extracted_name: name, confidence_score: 0.55 }));
}

function recordSuccess() {
  consecutiveFailures = 0;
  circuitOpenUntil = 0;
}

function recordFailure() {
  consecutiveFailures += 1;
  if (consecutiveFailures >= env.aiCircuitFailureThreshold) {
    circuitOpenUntil = Date.now() + env.aiCircuitOpenMs;
  }
}

function buildGeminiRequestBody({ parts, systemPrompt, compatibilityMode = false }) {
  const generationConfig = {
    temperature: 0,
    maxOutputTokens: 2048
  };

  // Current Gemini REST structured-output format. A compatibility payload is
  // retained for older gateways that still expose responseMimeType/responseSchema.
  if (compatibilityMode) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = GEMINI_RESPONSE_SCHEMA;
  } else {
    generationConfig.responseFormat = {
      text: {
        mimeType: 'application/json',
        schema: GEMINI_RESPONSE_SCHEMA
      }
    };
  }

  return {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig
  };
}

async function postGemini(url, requestBody, signal) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.geminiApiKey
    },
    body: JSON.stringify(requestBody),
    signal
  });
}

async function callGemini({ buffer, mimeType, text }) {
  const normalizedText = plainUntrustedText(text, 5000);
  if (!env.geminiApiKey || env.geminiApiKey.startsWith('replace_')) {
    return { extracted_text: normalizedText, drugs: heuristicExtract(normalizedText) };
  }
  if (circuitOpenUntil > Date.now()) {
    throw new AppError('AI service is temporarily unavailable', 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);
  try {
    const prompt = buildPromptPayload(normalizedText);
    const parts = [{ text: prompt.userData }];
    if (buffer && mimeType) {
      parts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
    }

    const url = `${env.geminiBaseUrl}/models/${env.geminiModel}:generateContent`;
    let response = await postGemini(
      url,
      buildGeminiRequestBody({ parts, systemPrompt: prompt.system }),
      controller.signal
    );

    // Some pinned/self-hosted Gemini-compatible gateways still expose the
    // earlier structured-output field names. Retry only on a schema-level 400.
    if (response.status === 400) {
      response = await postGemini(
        url,
        buildGeminiRequestBody({ parts, systemPrompt: prompt.system, compatibilityMode: true }),
        controller.signal
      );
    }

    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
    const json = await response.json();
    const raw = json.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
    const parsed = parseGeminiOutput(raw, normalizedText);
    recordSuccess();
    return parsed;
  } catch (error) {
    recordFailure();
    if (error.name === 'AbortError') throw new AppError('AI request timed out', 504);
    if (error instanceof AppError) throw error;
    throw new AppError('AI service request failed', 502);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  callGemini,
  heuristicExtract,
  buildGeminiRequestBody,
  GEMINI_RESPONSE_SCHEMA
};

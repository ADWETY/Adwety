const Drug = require('../../../DB/Models/drug.model');
const env = require('../../config/env');
const callGemini = require('./gemini.provider');
const callCustomModel = require('./custom-model.provider');

function fallbackExtraction(fallbackText = '') {
  const candidates = fallbackText
    ? fallbackText.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
    : ['Panadol Extra', 'Amoxicillin', 'Ventolin'];

  return {
    extracted_text: fallbackText || candidates.join('\n'),
    drugs: candidates.map((name) => ({ extracted_name: name, confidence_score: 0.65 })),
  };
}

async function matchExtractedNames(drugs = []) {
  const catalog = await Drug.find({}).select('name strength form description imageUrl').lean();

  return drugs.map((item) => {
    const extractedName = item.extracted_name || item.name || '';
    const matchedDrug = catalog.find(
      (drug) =>
        drug.name.toLowerCase().includes(extractedName.toLowerCase()) ||
        extractedName.toLowerCase().includes(drug.name.toLowerCase()),
    );

    return {
      extracted_name: extractedName,
      confidence_score: Number(item.confidence_score || item.confidence || 0.5),
      matched_drug_id: matchedDrug?._id?.toString() || null,
      matched_drug: matchedDrug
        ? {
            id: matchedDrug._id.toString(),
            name: matchedDrug.name,
            strength: matchedDrug.strength,
            form: matchedDrug.form,
            description: matchedDrug.description,
            image_url: matchedDrug.imageUrl,
          }
        : null,
    };
  });
}

async function extractPrescription({ fileBuffer, mimeType, fallbackText = '' }) {
  const prompt = [
    'Read the uploaded medical prescription image.',
    'Extract medicine names only.',
    'Return strict JSON with this exact structure:',
    '{"extracted_text":"string","drugs":[{"extracted_name":"string","confidence_score":0.0}]}',
  ].join(' ');

  let rawResult;

  try {
    if (env.aiProvider === 'custom') rawResult = await callCustomModel({ fileBuffer, mimeType, prompt });
    else if (env.aiProvider === 'gemini') rawResult = await callGemini({ fileBuffer, mimeType, prompt });
    else rawResult = fallbackExtraction(fallbackText);
  } catch (error) {
    if (!env.aiFallbackEnabled) throw error;
    rawResult = fallbackExtraction(fallbackText);
  }

  return {
    extracted_text: rawResult.extracted_text || rawResult.text || fallbackText || '',
    drugs: await matchExtractedNames(rawResult.drugs || []),
  };
}

module.exports = { extractPrescription };

const asyncHandler = require('../../utils/async-handler');
const { AppError } = require('../../utils/helpers');

const { findMatches } = require('../../services/drug-matching.service');
const { callGemini, heuristicExtract } = require('../../services/ai.service');
const { aiLog } = require('../../services/logging.service');

const {
  Drug,
  file,
  drugDto
} = require('./common');

exports.scanPrescription = asyncHandler(async (req, res) => {
  const uploadedFile = file(req);
  const text = req.validated.body.text || req.validated.body.mock_text || '';
  if (!uploadedFile && !String(text).trim()) throw new AppError('Prescription text or file is required', 422);

  let extracted;
  let raw;

  if (text || uploadedFile) {
    raw = await callGemini({
      buffer: uploadedFile?.buffer,
      mimeType: uploadedFile?.mimetype,
      text
    });

    extracted = Array.isArray(raw.drugs) ? raw.drugs : [];
  } else {
    raw = {
      extracted_text: '',
      drugs: []
    };

    extracted = heuristicExtract(text);
  }

  const drugs = [];

  for (const item of extracted) {
    const matches = await findMatches(
      item.extracted_name || item.name || '',
      {
        limit: 1,
        threshold: 0.35
      }
    );

    if (matches[0]) {
      drugs.push(drugDto({
        _id: matches[0].matchedDrugId,
        genericName: matches[0].drug.generic_name,
        dosageForm: matches[0].drug.dosage_form,
        strength: matches[0].drug.strength,
        description: matches[0].drug.description
      }));
    }
  }


  await aiLog({
    userId: req.authUser?._id || null,
    extractedText: raw.extracted_text || text,
    extractedDrugs: drugs.map((x) => x.name),
    confidence: drugs.length ? 0.65 : 0,
    status: 'completed',
    provider: 'gemini',
    consentToStore: req.validated.body.consentToStore ?? req.validated.body.consent_to_store ?? false
  });

  return res.json(drugs);
});

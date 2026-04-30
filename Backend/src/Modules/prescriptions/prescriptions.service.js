const Prescription = require('../../../DB/Models/prescription.model');
const PrescriptionExtractedDrug = require('../../../DB/Models/prescriptionextracteddrug.model');
const { saveBuffer } = require('../../services/storage.service');
const { extractPrescription } = require('../../services/ai/ai.service');
const { AppError } = require('../../utils/error-handling');
const { validateUploadedFileContent } = require('../../middleware/upload');

async function scanPrescription({ file, userId, mockText }) {
  if (!userId) throw new AppError('Unauthorized', 401);
  if (!file && !mockText) throw new AppError('Prescription image/PDF or mock_text is required', 422);
  if (file?.buffer) validateUploadedFileContent(file);

  const imageUrl = file?.buffer ? saveBuffer(file.buffer, file.originalname) : null;
  const prescription = await Prescription.create({
    userId,
    imageUrl,
    status: 'processing',
    extractedText: mockText || '',
  });

  let result;
  try {
    result = await extractPrescription({
      fileBuffer: file?.buffer || Buffer.from(mockText || ''),
      mimeType: file?.mimetype || 'text/plain',
      fallbackText: mockText || '',
    });
  } catch (error) {
    prescription.status = 'failed';
    prescription.extractedText = mockText || '';
    await prescription.save();
    throw error;
  }

  prescription.extractedText = result.extracted_text || '';
  prescription.status = 'completed';
  await prescription.save();

  await PrescriptionExtractedDrug.deleteMany({ prescriptionId: prescription._id });

  const savedExtractedDrugs = [];
  for (const item of result.drugs || []) {
    const created = await PrescriptionExtractedDrug.create({
      prescriptionId: prescription._id,
      drugId: item.matched_drug_id || null,
      extractedName: item.extracted_name,
      confidenceScore: item.confidence_score,
    });

    savedExtractedDrugs.push({
      id: created._id.toString(),
      extracted_name: item.extracted_name,
      confidence_score: item.confidence_score,
      match_score: item.match_score || 0,
      matched_drug: item.matched_drug,
    });
  }

  return {
    prescription_id: prescription._id.toString(),
    image_url: imageUrl,
    extracted_text: prescription.extractedText,
    extracted_drugs: savedExtractedDrugs,
    drugs: savedExtractedDrugs.filter((item) => item.matched_drug).map((item) => item.matched_drug),
  };
}

module.exports = { scanPrescription };

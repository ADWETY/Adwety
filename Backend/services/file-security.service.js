const net = require('net');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const env = require('../config/env');
const { AppError } = require('../utils/helpers');

function detectType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff,0xd8,0xff]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return 'image/png';
  if (buffer.subarray(0,4).toString('ascii')==='RIFF' && buffer.subarray(8,12).toString('ascii')==='WEBP') return 'image/webp';
  if (buffer.subarray(0,5).toString('ascii')==='%PDF-') return 'application/pdf';
  return null;
}

async function clamScan(buffer) {
  return new Promise((resolve,reject)=>{
    const socket=net.createConnection({host:env.clamavHost,port:env.clamavPort});
    const chunks=[]; let done=false;
    const finish=(err,value)=>{if(done)return;done=true;socket.destroy();err?reject(err):resolve(value);};
    socket.setTimeout(env.clamavTimeoutMs,()=>finish(new Error('ClamAV timeout')));
    socket.on('error',e=>finish(e)); socket.on('data',d=>chunks.push(d));
    socket.on('end',()=>{const r=Buffer.concat(chunks).toString('utf8');if(/FOUND/i.test(r))return finish(new AppError('Malware detected in uploaded file',422));if(!/OK/i.test(r))return finish(new Error(`Unexpected ClamAV response: ${r.slice(0,200)}`));return finish(null,true);});
    socket.on('connect',()=>{socket.write(Buffer.from('zINSTREAM\0'));for(let i=0;i<buffer.length;i+=65536){const part=buffer.subarray(i,i+65536);const len=Buffer.alloc(4);len.writeUInt32BE(part.length);socket.write(len);socket.write(part);}socket.write(Buffer.alloc(4));socket.end();});
  });
}

async function validatePdf(buffer) {
  if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') throw new AppError('Invalid PDF structure', 415);
  const tail = buffer.subarray(Math.max(0, buffer.length - 4096)).toString('latin1');
  if (!tail.includes('%%EOF')) throw new AppError('Incomplete PDF file', 415);

  // Block active content before parsing. PDF prescriptions must be passive documents only.
  const text = buffer.toString('latin1');
  if (/\/Encrypt\b/.test(text)) throw new AppError('Encrypted PDFs are not accepted', 415);
  if (/\/EmbeddedFile\b|\/Filespec\b|\/JavaScript\b|\/JS\b|\/Launch\b|\/RichMedia\b|\/OpenAction\b|\/AA\b/.test(text)) {
    throw new AppError('Active or embedded PDF content is not accepted', 415);
  }

  try {
    const document = await PDFDocument.load(buffer, {
      ignoreEncryption: false,
      throwOnInvalidObject: true,
      updateMetadata: false
    });
    if (document.isEncrypted) throw new AppError('Encrypted PDFs are not accepted', 415);
    const pages = document.getPageCount();
    if (!pages || pages > env.maxPdfPages) throw new AppError(`PDF must contain between 1 and ${env.maxPdfPages} pages`, 422);
    return { buffer, mimeType: 'application/pdf', pages };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or unsafe PDF structure', 415);
  }
}

async function normalizeImage(buffer,mimeType){
  try {
    let image=sharp(buffer,{limitInputPixels:env.maxImagePixels,failOn:'error'});const meta=await image.metadata();
    if(!meta.width||!meta.height||meta.width*meta.height>env.maxImagePixels)throw new AppError('Image dimensions are too large',422);
    image=image.rotate();let output,outType;
    if(mimeType==='image/png'){output=await image.png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();outType='image/png';}
    else if(mimeType==='image/webp'){output=await image.webp({quality:88,effort:5}).toBuffer();outType='image/webp';}
    else {output=await image.jpeg({quality:90,mozjpeg:true}).toBuffer();outType='image/jpeg';}
    return {buffer:output,mimeType:outType,width:meta.width,height:meta.height};
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or unsafe image content', 415);
  }
}

async function inspectAndNormalize(file){
  const detected=detectType(file.buffer);if(!detected)throw new AppError('Unsupported or forged upload content',415);
  let malwareScanned = false;
  try{await clamScan(file.buffer);malwareScanned=true;}catch(error){if(error instanceof AppError)throw error;if(env.clamavRequired)throw new AppError('Malware scanning service unavailable',503);}
  const result=detected==='application/pdf'?await validatePdf(file.buffer):await normalizeImage(file.buffer,detected);
  file.buffer=result.buffer;file.mimetype=result.mimeType;file.detectedMimeType=result.mimeType;file.securityMetadata={width:result.width||null,height:result.height||null,pages:result.pages||null,malwareScanned};file.originalname='upload';
  return file;
}
module.exports={detectType,inspectAndNormalize};

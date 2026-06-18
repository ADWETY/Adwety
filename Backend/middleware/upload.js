const multer = require('multer');
const env = require('../config/env');
const { AppError } = require('../utils/helpers');
const { inspectAndNormalize } = require('../services/file-security.service');

const base=multer({storage:multer.memoryStorage(),limits:{files:1,fileSize:env.maxFileSizeMb*1024*1024,fields:20,parts:25}});
function mapMulterError(error) {
  if (!error) return null;
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return new AppError(`File exceeds ${env.maxFileSizeMb} MB`, 413);
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') return new AppError('Only one prescription file is allowed', 422);
    return new AppError('Invalid multipart upload', 422);
  }
  return error;
}
function wrapMulter(factory) { return (req,res,next)=>factory(req,res,(error)=>next(mapMulterError(error))); }
function secure(req,_res,next){(async()=>{const files=req.file?[req.file]:(Array.isArray(req.files)?req.files:[]);for(const f of files)await inspectAndNormalize(f);next();})().catch(next);}
module.exports={
  any(){return [wrapMulter(base.any()),secure];},
  single(name){return [wrapMulter(base.single(name)),secure];}
};

const crypto = require('crypto');
const { AppError } = require('../utils/helpers');
const { sanitizeTarget } = require('../utils/sanitize');
const env = require('../config/env');
const { increment } = require('../services/redis.service');

function sanitizeRequest(req,_res,next){sanitizeTarget(req.body);sanitizeTarget(req.query);sanitizeTarget(req.params);next();}
function corsOptions(){return{origin(origin,cb){if(!origin&&env.allowNoOriginRequests)return cb(null,true);if(origin&&env.corsOrigins.includes(origin))return cb(null,true);return cb(new AppError('CORS blocked: origin is not allowed',403));},credentials:true};}
function rateLimit({windowMs=60000,max=120,keyGenerator=null,prefix='general',delayAfter=null,delayMs=0,maxDelayMs=2000}={}){
 return async(req,res,next)=>{try{const raw=keyGenerator?keyGenerator(req):`${req.ip}:${req.method}:${req.path}`;const digest=crypto.createHash('sha256').update(String(raw||'unknown')).digest('hex');const key=`${env.rateLimitPrefix}:${prefix}:${digest}`;const row=await increment(key,windowMs);const remaining=Math.max(0,max-row.count);const reset=Math.ceil((Date.now()+row.ttlMs)/1000);res.setHeader('X-RateLimit-Limit',String(max));res.setHeader('X-RateLimit-Remaining',String(remaining));res.setHeader('X-RateLimit-Reset',String(reset));if(delayAfter!==null&&row.count>delayAfter&&delayMs>0)await new Promise(r=>setTimeout(r,Math.min(maxDelayMs,delayMs*(row.count-delayAfter))));if(row.count>max){res.setHeader('Retry-After',String(Math.max(1,Math.ceil(row.ttlMs/1000))));return next(new AppError('Too many requests',429));}return next();}catch(e){if(env.redisRequired)return next(new AppError('Security rate-limit service unavailable',503));return next();}};
}
module.exports={sanitizeRequest,corsOptions,rateLimit};

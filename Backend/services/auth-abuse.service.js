const crypto = require('crypto');
const env = require('../config/env');
const redis = require('./redis.service');

function id(value) { return crypto.createHash('sha256').update(String(value||'').toLowerCase()).digest('hex'); }
function keys(email, ip) { return { pair:`adwety:auth:fail:${id(email)}:${id(ip)}`, account:`adwety:auth:acct:${id(email)}`, lock:`adwety:auth:lock:${id(email)}:${id(ip)}` }; }
async function lockRemaining(email,ip){const v=await redis.get(keys(email,ip).lock); return v?Number(v):0;}
async function recordFailure(email,ip){
  const k=keys(email,ip); const pair=await redis.increment(k.pair,30*60*1000); const acct=await redis.increment(k.account,30*60*1000);
  const count=Math.max(pair.count,acct.count);
  if(count>=5){const seconds=Math.min(1800,60*Math.pow(2,Math.min(5,count-5))); await redis.set(k.lock,String(seconds),seconds*1000);}
  const delayMs=Math.min(2500,200*Math.pow(2,Math.min(4,count-1))); await new Promise(r=>setTimeout(r,delayMs));
  return {count,lockSeconds:await lockRemaining(email,ip)};
}
async function clearFailures(email,ip){const k=keys(email,ip); await redis.del(k.pair,k.account,k.lock);}
module.exports={lockRemaining,recordFailure,clearFailures};

const env = require('../config/env');
let client = null;
let connecting = null;
let memory = new Map();

async function getClient() {
  if (client?.isReady) return client;
  if (connecting) return connecting;
  if (!env.redisUrl && !env.redisPassword) {
    if (env.redisRequired) throw new Error('Redis is required but REDIS_URL/REDIS_PASSWORD is not configured');
    return null;
  }
  connecting = (async () => {
    const { createClient } = require('redis');
    const url = env.redisUrl || `redis://:${encodeURIComponent(env.redisPassword)}@redis:6379`;
    const c = createClient({ url, socket: { reconnectStrategy: (retries) => Math.min(1000 * retries, 10000) } });
    c.on('error', (e) => console.error('Redis error:', e.message));
    await c.connect();
    client = c;
    return c;
  })();
  try { return await connecting; }
  finally { connecting = null; }
}

async function increment(key, windowMs) {
  const c = await getClient();
  if (c) {
    const result = await c.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('PTTL',KEYS[1])}", { keys: [key], arguments: [String(windowMs)] });
    return { count: Number(result[0]), ttlMs: Number(result[1]) };
  }
  const now = Date.now();
  let row = memory.get(key);
  if (!row || row.expiresAt <= now) row = { count: 0, expiresAt: now + windowMs };
  row.count += 1; memory.set(key, row);
  if (memory.size > 10000) for (const [k,v] of memory) if (v.expiresAt <= now) memory.delete(k);
  return { count: row.count, ttlMs: Math.max(1, row.expiresAt - now) };
}
async function get(key) { const c=await getClient(); if(c) return c.get(key); const r=memory.get(key); return r&&r.expiresAt>Date.now()?r.value:null; }
async function set(key,value,ttlMs) { const c=await getClient(); if(c) return c.set(key,String(value),{PX:ttlMs}); memory.set(key,{value:String(value),expiresAt:Date.now()+ttlMs}); return 'OK'; }
async function del(...keys) { const c=await getClient(); if(c) return c.del(keys); keys.forEach(k=>memory.delete(k)); return keys.length; }
async function closeRedis() { if(client?.isOpen) await client.quit(); client=null; }
module.exports={getClient,increment,get,set,del,closeRedis};

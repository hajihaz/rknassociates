const { database } = require('../website-lib/interior-backend');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROUTES = new Set(['/','/home','/about','/services','/projects','/contact','/interior']);
const TYPES = new Set(['visit','view','tap','active_time']);
const visits = new Map(); // Soft local burst limit; DB grants remain insert-only.

module.exports = async function analytics(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST') return res.status(405).end('Method not allowed');
 const origin=req.headers.origin||'';
 const host=req.headers.host||'';
 try {
   if(!origin || new URL(origin).host!==host) return res.status(403).end('Forbidden origin');
 } catch {return res.status(403).end('Forbidden origin')}
 const body=req.body||{};
 if(typeof body!=='object' || !body || JSON.stringify(body).length>1500) return res.status(400).end('Invalid input');
 const {visitorId,sessionId,kind,path,target,durationSeconds}=body;
 if(!UUID.test(visitorId||'') || !UUID.test(sessionId||'') || !TYPES.has(kind) || !ROUTES.has(path) ||
   (target!=null && (typeof target!=='string'||target.length>70||!/^[a-zA-Z0-9_:/-]+$/.test(target))) ||
   (kind!=='tap' && target!=null) ||
   (durationSeconds!=null && (!Number.isInteger(durationSeconds) || durationSeconds<0 || durationSeconds>180)) ||
   (kind!=='active_time' && durationSeconds!=null)) return res.status(400).end('Invalid event');
 const ip=(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0];
 const crypto=require('node:crypto');
 const key=crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0,18);
 const now=Date.now(),state=visits.get(key);
 if(state && now-state.start<60000){if(state.count>=60)return res.status(429).end('Rate limit');state.count++;}
 else visits.set(key,{start:now,count:1});
 if(visits.size>4000)visits.clear();
 try {
   await database().query(
     `INSERT INTO public.rkn_visitor_events(visitor_id,session_id,kind,path,target,duration_seconds)
      VALUES($1,$2,$3,$4,$5,$6)`,
     [visitorId,sessionId,kind,path,kind==='tap'?target||null:null,kind==='active_time'?durationSeconds??null:null]
   );
   return res.status(204).end();
 } catch(error){
   console.error('RKN analytics unavailable',error.code||'service_error');
   return res.status(503).end('Analytics unavailable');
 }
};

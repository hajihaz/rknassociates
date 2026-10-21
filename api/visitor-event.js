const { database } = require('../website-lib/interior-backend');

const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE=new Set(['home','about','services','projects','contact','interior']);
const KIND=new Set(['visit','view','tap','active_time']);
const KEY=/^[a-zA-Z0-9_:/-]{1,64}$/;

module.exports=async function visitorEvent(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
 const host=String(req.headers['x-forwarded-host']||req.headers.host||'');
 const origin=String(req.headers.origin||'');
 // Same-origin only; never accept cross-site browser requests.
 if(!host||origin!=='https://'+host && origin!=='http://localhost:3000')
  return res.status(403).end();
 if(Number(req.headers['content-length']||0)>1024)return res.status(413).end();
 const o=req.body;
 if(!o||typeof o!=='object'||Array.isArray(o)||JSON.stringify(o).length>1024)
  return res.status(400).end();
 if(o.consent!==true||typeof o.visitorId!=='string'||!ID.test(o.visitorId)
    ||typeof o.sessionId!=='string'||!ID.test(o.sessionId)
    ||typeof o.kind!=='string'||!KIND.has(o.kind)
    ||typeof o.path!=='string'||!PAGE.has(o.path)
    ||(o.target!=null&&(typeof o.target!=='string'||!KEY.test(o.target)))
    ||(o.durationSeconds!=null&&(!Number.isInteger(o.durationSeconds)||o.durationSeconds<0||o.durationSeconds>180))
    ||(o.kind!=='tap'&&o.target!=null)
    ||(o.kind!=='active_time'&&o.durationSeconds!=null))
  return res.status(400).end();
 try{
  const result=await database().query(
    'select public.rkn_record_visit($1::uuid,$2::uuid,$3::text,$4::text,$5::text,$6::integer) as ok',
    [o.visitorId,o.sessionId,o.kind,o.path,o.target||null,o.durationSeconds??null]);
  if(!result.rows[0]?.ok)return res.status(429).end();
  return res.status(204).end();
 }catch(error){
  console.error('[visitor-analytics] unavailable',error.code||'database_error');
  return res.status(503).end();
 }
};

const {database}=require('../website-lib/interior-backend');
const {createHash}=require('node:crypto');
const allowed=new Set(['home','about','services','projects','contact','interior']);
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 const db=database();
 try{
  if(req.method==='GET'){
   const page=String(req.query.page||'interior');
   if(!allowed.has(page))return res.status(400).json({error:'Unknown page'});
   const enabled=(await db.query('select enabled from public.rkn_shop_pages where page_slug=$1',[page])).rows[0]?.enabled||false;
   const rows=(await db.query("select id,title,slug,description,sku,price_paise,compare_paise,category,stock,cover_media_id,gallery,pages,featured from public.rkn_shop_products where status='published' order by featured desc,updated_at desc limit 1000")).rows;
   return res.status(200).json({enabled,page,products:rows});
  }
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const origin=req.headers.origin||'';
  const host=req.headers.host||'';
  if(origin!==('https://'+host)&&!(host.startsWith('localhost:')&&origin==='http://'+host))return res.status(403).json({error:'Invalid request origin'});
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return res.status(415).json({error:'JSON required'});
  const salt=process.env.RKN_ORDER_RATE_SALT;
  if(!salt||salt.length<32)return res.status(503).json({error:'Ordering is temporarily unavailable; please call RKN'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  const bytes=Buffer.byteLength(JSON.stringify(body||{}));if(bytes>12000)return res.status(413).json({error:'Order too large'});
  const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  const fingerprint=createHash('sha256').update(salt+':'+ip).digest('hex');
  const result=await db.query('select public.rkn_shop_place_order($1::jsonb,$2) order_no',[JSON.stringify(body),fingerprint]);
  return res.status(201).json({orderNo:result.rows[0].order_no,message:'Request received. Our team will contact you to confirm.'});
 }catch(e){
  const invalid=e.code==='22023'||e.code==='22P02'||e.code==='22003'||e.code==='23505';
  if(!invalid)console.error('RKN commerce request failed',e.code||'error');
  return res.status(invalid?400:503).json({error:invalid?'Please check your order details, quantity and availability. If this keeps happening, contact RKN.':'The order service is unavailable. Please try again later.'});
 }
};

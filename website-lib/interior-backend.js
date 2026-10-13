const { Pool } = require('pg');
const { get } = require('@vercel/blob');
let pool;
function database() {
 if(!process.env.RKN_PUBLIC_DATABASE_URL)throw new Error('content_unconfigured');
 if(!pool){pool=new Pool({connectionString:process.env.RKN_PUBLIC_DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:4000,statement_timeout:4000});if(process.env.VERCEL)require('@vercel/functions').attachDatabasePool(pool);}
 return pool;
}
function createBackend(query,readBlob) {
 async function published(){const result=await query('select snapshot from public.interior_publication where id=1');if(!result.rows[0]?.snapshot)throw new Error('content_missing');return result.rows[0].snapshot;}
 async function image(id,variant){
  if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return null;
  const media=(await published()).media?.[id],path=media?.[variant==='thumb'?'thumb_path':'path'];
  if(path!==id+'/'+(variant==='thumb'?'thumb':'full')+'.webp')return null;
  const file=await readBlob(path,{access:'private',useCache:false});
  if(!file||file.statusCode!==200)return null;
  return Buffer.from(await new Response(file.stream).arrayBuffer());
 }
 return{published,image};
}
module.exports={...createBackend(sql=>database().query(sql),get),createBackend};

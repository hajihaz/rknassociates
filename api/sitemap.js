const {database}=require('../website-lib/interior-backend');
const slugs=['home','about','services','interior','projects','contact'];
// Use the reachable canonical origin until registrar DNS/TLS is restored.
const host='https://rknassociates.vercel.app';
const sanitizeDate=v=>{const date=v&&new Date(v);return date&&!Number.isNaN(date.getTime())?date.toISOString().slice(0,10):null;};
module.exports=async function(req,res){
 res.setHeader('Content-Type','application/xml; charset=utf-8');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
 let dates={};
 try{
  const query=await database().query("select page_slug,published_at from public.rkn_site_publication where page_slug in ('home','about','services','projects','contact')");
  dates=Object.fromEntries(query.rows.map(row=>[row.page_slug,sanitizeDate(row.published_at)]));
  const interior=(await database().query('select published_at from public.interior_publication where id=1')).rows[0];
  if(interior)dates.interior=sanitizeDate(interior.published_at);
 }catch(e){console.error('RKN sitemap publication metadata unavailable',e.code||'service_error');}
 const nodes=slugs.map(slug=>{
  const date=dates[slug];
  return '<url><loc>'+host+'/'+slug+'</loc>'+(date?'<lastmod>'+date+'</lastmod>':'')+'</url>';
 });
 res.status(200).end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+nodes.join('')+'</urlset>');
};

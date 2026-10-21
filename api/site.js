function withAnalytics(html){return html.replace(/<\/body>/i,'<script src="/assets/visitor-analytics.js" defer></script></body>');}
const fs=require('node:fs');
const path=require('node:path');
const {database}=require('../website-lib/interior-backend');
const {renderSite}=require('../website-lib/site-renderer.cjs');
const manifest=require('../website-lib/site-manifest.json');
const allowed=new Set(['home','about','services','projects','contact','interior']);
module.exports=async function(request,response){
 const slug=String(request.query.page||'home');if(!allowed.has(slug)){response.status(404).end('Page not found');return;}
 response.setHeader('Cache-Control','no-store');response.setHeader('Content-Type','text/html; charset=utf-8');response.setHeader('X-Content-Type-Options','nosniff');
 const template=fs.readFileSync(path.join(process.cwd(),'website-lib/templates',slug+'.html'),'utf8');
 try{
  const rows=(await database().query('select page_slug,snapshot from public.rkn_site_publication where page_slug in ($1,$2)',[slug,'global'])).rows;
  const page=rows.find(r=>r.page_slug===slug)||{page_slug:slug},global=rows.find(r=>r.page_slug==='global')?.snapshot;
  response.status(200).end(withAnalytics(renderSite(template,page,global,manifest)));
 }catch(e){console.error('RKN page publication unavailable',e.code||'service_error');response.status(200).end(withAnalytics(renderSite(template,{page_slug:slug},null,manifest)));}
};

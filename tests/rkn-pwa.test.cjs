'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {renderSite}=require('../website-lib/site-renderer.cjs');
const names=['home','about','services','projects','contact','interior'];

test('all six public pages declare one installable manifest, iOS standalone mode and proper icon',()=>{
 for(const slug of names){
  const template=fs.readFileSync(path.join(__dirname,'../website-lib/templates',slug+'.html'),'utf8');
  const html=renderSite(template,{page_slug:slug},null,{});
  assert.equal((html.match(/rel="manifest"/g)||[]).length,1,slug);
  assert.match(html,/apple-mobile-web-app-capable" content="yes"/);
  assert.match(html,/apple-touch-icon" sizes="180x180"/);
  assert.equal((html.match(/src="\/assets\/rkn-pwa.js"/g)||[]).length,1);
  const preview=renderSite(template,{page_slug:slug},null,{}, {preview:true,adminOrigin:'https://admin.example',publicOrigin:'https://public.example'});
  assert.doesNotMatch(preview,/rkn-pwa.js/);
 }
});
test('manifest declares standalone same-origin navigation, valid icons and aligned theme',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../manifest.webmanifest'),'utf8'));
 assert.equal(m.display,'standalone');assert.equal(m.scope,'/');assert.equal(m.start_url,'/home');
 assert.equal(m.name,'RKN Associates');
 for(const i of m.icons){assert.ok(fs.statSync(path.join(__dirname,'..',i.src)).size>1000);}
 assert.ok(m.icons.some(i=>i.sizes==='192x192'));
 assert.ok(m.icons.some(i=>i.sizes==='512x512'));
});
test('service worker caches only public offline fallback and never intercepts API/checkout requests',async()=>{
 const worker=fs.readFileSync(path.join(__dirname,'../service-worker.js'),'utf8');
 const handlers={};const cached=[];const responses=[];
 const store={add:async url=>{cached.push(url)},match:async()=>new Response('Offline fallback')};
 const ctx={self:{location:{origin:'https://rknassociates.vercel.app'},addEventListener:(event,fn)=>handlers[event]=fn,skipWaiting:()=>Promise.resolve(),clients:{claim:()=>Promise.resolve()}},
 caches:{open:async()=>store,keys:async()=>[],delete:async()=>{}},URL,Promise,fetch:async()=>new Response('Online'),Response};
 vm.runInNewContext(worker,ctx);
 let install;handlers.install({waitUntil:p=>install=p});await install;
 assert.deepEqual(cached,['/offline.html']);
 const request=(url,mode='navigate',method='GET')=>({url,mode,method});
 handlers.fetch({request:request('https://rknassociates.vercel.app/api/shop'),respondWith:r=>responses.push(r)});
 handlers.fetch({request:request('https://rknassociates.vercel.app/api/visitor-event'),respondWith:r=>responses.push(r)});
 handlers.fetch({request:request('https://rknassociates.vercel.app/interior','cors'),respondWith:r=>responses.push(r)});
 handlers.fetch({request:request('https://outside.example/interior'),respondWith:r=>responses.push(r)});
 assert.equal(responses.length,0);
 handlers.fetch({request:request('https://rknassociates.vercel.app/interior'),respondWith:r=>responses.push(r)});
 assert.equal(responses.length,1);
});
test('offline document explains internet requirement for orders',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../offline.html'),'utf8');
 assert.match(html,/Orders and forms require an internet connection/);
 assert.match(html,/Try again/);
});
test('PWA assets have correct Vercel MIME and refresh headers',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../vercel.json'),'utf8'));
 assert.ok(config.routes.some(r=>r.src.includes('service-worker')&&r.headers?.['Cache-Control']==='no-cache'));
 assert.ok(config.routes.some(r=>r.src.includes('manifest')&&r.headers?.['Content-Type']==='application/manifest+json'));
});
test('interior collection has a screen-reader accessible heading even before client-side CMS loads',()=>{
 const template=fs.readFileSync(path.join(__dirname,'../website-lib/templates/interior.html'),'utf8');
 const html=renderSite(template,{page_slug:'interior'},null,{});
 assert.match(html,/<h1 class="rkn-screen-reader-only">RKN Associates Interior Collection<\/h1>/);
});

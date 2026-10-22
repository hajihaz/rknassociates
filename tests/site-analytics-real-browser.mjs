/** Local-only, opt-in RKN analytics browser smoke: no production traffic or DB. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const mod=process.env.PLAYWRIGHT_MODULE||'playwright';
const {chromium,webkit}=await import(mod);
const origin=process.env.RKN_TEST_ORIGIN||'http://127.0.0.1:49388';
const routes=['/','/services.html','/projects.html'];
// Serve the actual Vercel page renderer, not raw HTML. Static servers omit its
// analytics script injection and would give a false negative.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {renderSite}=require('../website-lib/site-renderer.cjs');
const routeToFile={'/':'index.html','/services.html':'services.html','/projects.html':'projects.html'};
const mime={'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  const pathname=new URL(req.url,origin).pathname;
  const page=routeToFile[pathname];
  if(page){
   const slug=page==='index.html'?'home':page.replace('.html','');
   const rendered=renderSite(readFileSync(resolve(root,page),'utf8'),{page_slug:slug},null,{});
   res.writeHead(200,{'content-type':'text/html; charset=utf-8'});return res.end(rendered);
  }
  if(!pathname.startsWith('/assets/')){res.writeHead(404);return res.end();}
  const file=resolve(root,'.'+pathname);
  if(!file.startsWith(resolve(root,'assets')+'/')){res.writeHead(403);return res.end();}
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  return res.end(readFileSync(file));
 }catch{res.writeHead(404);return res.end()}
});
await new Promise((ok,fail)=>server.once('error',fail).listen(new URL(origin).port,'127.0.0.1',ok));
let count=0;
try {
for(const [label,browserType,mobile] of [['Chromium desktop',chromium,false],['WebKit mobile',webkit,true]]){
 const browser=await browserType.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1360,height:900},isMobile:mobile,hasTouch:mobile});
  const events=[];
  await context.route('**/*',async route=>{
   const request=route.request();
   if(request.url()===origin+'/api/visitor-event'){
    events.push(request.postDataJSON());
    return route.fulfill({status:204,body:''});
   }
   if(request.url().startsWith(origin+'/'))return route.continue();
   return route.abort(); // no third-party calls during local QA
  });
  const home=await context.newPage();
  await home.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:16000});
  await home.locator('#rkn-analytics-choice').waitFor({timeout:10000});
  assert.equal(events.length,0,`${label}: events before consent`);
  await home.getByRole('button',{name:'Allow analytics'}).click();
  await home.waitForFunction(()=>localStorage.getItem('rkn-analytics-consent-v1')==='yes');
  await home.waitForTimeout(100);
  assert.deepEqual(events.map(e=>e.kind),['visit','view'],`${label}: first visit must have exactly one view`);
  for(const route of routes.slice(1)){
   const page=home;
   await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:16000});
   await page.waitForTimeout(100);
   assert.equal(events.filter(e=>e.kind==='visit').length,1,`${label}: repeat page cannot create another visit`);
   assert.equal(events.filter(e=>e.kind==='view').length,routes.indexOf(route)+1);
   count++;
  }
  const page=home;
  await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:16000});
  await page.locator('#rkn-analytics-manage').waitFor();
  await page.locator('#rkn-analytics-manage').click();
  await page.getByRole('button',{name:'No thanks'}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('rkn-analytics-consent-v1')),'no');
  assert.equal(await page.evaluate(()=>localStorage.getItem('rkn-analytics-visitor-v1')),null);
  const previous=events.length;
  await page.reload({waitUntil:'domcontentloaded',timeout:16000});
  await page.waitForTimeout(100);
  assert.equal(events.length,previous,`${label}: no collection after consent withdrawal`);
  count++;
  console.log('PASS',label,'navigation, visits, views and persistent withdrawal');
  await context.close();
  const contextDnt=await browser.newContext({viewport:{width:390,height:700}});
  await contextDnt.addInitScript(()=>Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'}));
  await contextDnt.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  const dnt=await contextDnt.newPage();await dnt.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:16000});
  assert.equal(await dnt.locator('#rkn-analytics-choice').count(),0);
  assert.equal(await dnt.locator('#rkn-analytics-manage').count(),0);
  count++;console.log('PASS',label,'do not track');await contextDnt.close();
 }finally{await browser.close()}
}
console.log('TOTAL VERIFIED RKN LOCAL BROWSER CASES',count);
}finally{await new Promise(ok=>server.close(ok));}

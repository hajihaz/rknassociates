const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {renderSite}=require('../website-lib/site-renderer.cjs');
const fixture=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('actual Vercel public renderer injects one defer analytics script per public page only',()=>{
 for(const [filename,slug] of [['index.html','home'],['services.html','services'],['projects.html','projects']]){
  const html=renderSite(fixture(filename),{page_slug:slug},null,{});
  const matches=html.match(/<script src="\/assets\/customer-analytics\.js" defer><\/script>/g)||[];
  assert.equal(matches.length,1,slug);
  assert.match(html,/<\/body>/);
 }
});
test('authenticated CMS preview does not inject browser tracking script',()=>{
 const html=renderSite(fixture('index.html'),{page_slug:'home'},null,{},
  {preview:true,publicOrigin:'https://public.rkn.test',adminOrigin:'https://admin.rkn.test'});
 assert.doesNotMatch(html,/src="\/assets\/customer-analytics\.js"/);
});

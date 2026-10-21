const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../api/visitor-event.js'),'utf8');
const valid={consent:true,visitorId:'44444444-4444-4444-8444-444444444444',sessionId:'55555555-5555-4555-8555-555555555555',kind:'tap',path:'home',target:'link:interior'};
function handler(){
 let reads=0;const module={exports:{}};
 vm.runInNewContext(source,{module,exports:module.exports,require:()=>({database:()=>({query:async()=>{reads++;return {rows:[{ok:true}]}}})}),console});
 return {call:module.exports,reads:()=>reads};
}
const res=()=>({statusCode:200,setHeader(){},status(n){this.statusCode=n;return this},end(){return this}});
const req=body=>({method:'POST',headers:{host:'rkn.test',origin:'https://rkn.test'},body});
test('server accepts only coarse fixed tap categories and rejects private-looking labels before DB access',async()=>{
 const h=handler();
 for(const target of ['9876543210','private-token','link:private-token','a@example.invalid','/Users/private/project']){
  const r=res();await h.call(req({...valid,target}),r);assert.equal(r.statusCode,400);
 }
 assert.equal(h.reads(),0);
 const r=res();await h.call(req(valid),r);assert.equal(r.statusCode,204);assert.equal(h.reads(),1);
});
test('consent, origin and sensitive-route gates reject before DB access',async()=>{
 const h=handler();
 for(const request of [req({...valid,consent:false}),req({...valid,path:'payment'}),{...req(valid),headers:{host:'rkn.test',origin:'https://other.invalid'}}]){
  const r=res();await h.call(request,r);assert.ok([400,403].includes(r.statusCode));
 }
 assert.equal(h.reads(),0);
});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const load=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('HVD architectural pointer replaces gold-ring tracker in public assets',()=>{
 const css=load('assets/shared.css'), js=load('assets/shared.js'), svg=load('assets/hvd-cursor.svg');
 assert.match(css,/cursor:\s*url\('\.\/hvd-cursor\.svg'\) 2 2, auto/);
 assert.match(css,/@media \(hover: hover\) and \(pointer: fine\) and \(forced-colors: none\)/);
 assert.doesNotMatch(css,/rkn-cursor-(ring|dot)|cursor-enabled|cursor:\s*none\s*!important/);
 assert.doesNotMatch(js,/initCursor|rkn-cursor-(ring|dot)|cursor-enabled/);
 assert.match(js,/initSpotlight\(\);/);
 assert.match(js,/initTilt\(\);/);
 assert.match(svg,/<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.match(svg,/stroke="#F3D381"/);
});

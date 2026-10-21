/* RKN first-party analytics — public website only, explicit opt-in. */
(function(){
 'use strict';
 if(window.RKN_SITE_DATA?.preview || document.documentElement.hasAttribute('data-admin-preview'))return;
 var allow=new Set(['home','about','services','projects','contact','interior']);
 function page(){
  var p=(location.pathname||'/').replace(/^\//,'').replace(/\.html$/,'');
  if(!p||p==='index')p='home';
  return allow.has(p)?p:null;
 }
 var current=page();if(!current)return;
 var targets=new Set(['button','link','external-link','link:home','link:about','link:services','link:projects','link:contact','link:interior']);
 var KEY='rkn-analytics-consent-v1',V='rkn-analytics-visitor-v1',S='rkn-analytics-session-v1';
 var dnt=navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true;
 var choice=null;
 var started=false;
 try{choice=dnt?'no':localStorage.getItem(KEY);}catch(_){choice='no';}
 if(choice!=='yes'&&choice!=='no')choice=null;
 function choose(next){
  choice=next;
  try{localStorage.setItem(KEY,next);
   if(next==='no'){localStorage.removeItem(V);sessionStorage.removeItem(S);}
  }catch(_){}
  var box=document.getElementById('rkn-analytics-choice');
  if(box)box.remove();
  ensureManage();
  if(next==='yes'){
   // A previous opt-out may have stopped an active page's listeners.
   // Reload instead of installing duplicate event listeners.
   if(started)location.reload();else start();
  }
 }
 function ensureManage(){
  if(dnt||document.getElementById('rkn-analytics-manage'))return;
  var control=document.createElement('button');
  control.id='rkn-analytics-manage';control.type='button';
  control.textContent='Privacy settings';
  control.setAttribute('aria-label','Change optional website analytics consent');
  control.style.cssText='position:fixed;bottom:10px;right:10px;z-index:2147482999;background:#fff;color:#1d2430;border:1px solid #aaa;border-radius:12px;padding:6px 10px;font:12px system-ui,sans-serif;cursor:pointer';
  control.addEventListener('click',prompt);
  document.body.appendChild(control);
 }
 function prompt(){
  if(document.getElementById('rkn-analytics-choice'))return;
  var box=document.createElement('aside');box.id='rkn-analytics-choice';
  box.setAttribute('role','dialog');box.setAttribute('aria-label','Optional visitor analytics');
  box.style.cssText='position:fixed;bottom:14px;left:14px;right:14px;z-index:2147483000;max-width:450px;margin:auto;background:#fff;color:#1d2430;padding:16px;border:1px solid #b0b0b0;border-radius:14px;box-shadow:0 9px 38px #0003;font:13px/1.55 system-ui,sans-serif';
  var title=document.createElement('strong');title.textContent='Help us improve RKN Associates';box.appendChild(title);
  var description=document.createElement('p');description.style.margin='8px 0';
  description.textContent='Optional visits, navigation taps and time spent. No form contents or contact details. You can change your choice here at any time; declining stops future collection.';
  box.appendChild(description);
  function button(text,value){
   var b=document.createElement('button');b.type='button';b.textContent=text;
   b.style.cssText='padding:8px 13px;border:1px solid #888;border-radius:8px;margin-right:8px;background:'+(value==='yes'?'#1d2430':'#fff')+';color:'+(value==='yes'?'white':'#1d2430')+';cursor:pointer';
   b.addEventListener('click',function(){choose(value)});return b;
  }
  box.appendChild(button('Allow analytics','yes'));box.appendChild(button('No thanks','no'));
  document.body.appendChild(box);
 }
 function start(){
  if(started||choice!=='yes')return;
  var visitor,session,created=false;
  try{
   visitor=localStorage.getItem(V);
   if(!visitor){visitor=crypto.randomUUID();localStorage.setItem(V,visitor);}
   var saved=null,now=Date.now();
   try{saved=JSON.parse(sessionStorage.getItem(S)||'null')}catch(_){}
   if(!saved||!saved.id||now-saved.last>30*60*1000||now<saved.last){
    saved={id:crypto.randomUUID(),last:now,counted:false};
   }
   created=!saved.counted;
   saved.counted=true;saved.last=now;sessionStorage.setItem(S,JSON.stringify(saved));
   session=saved.id;
  }catch(_){return;}
  started=true;
  function send(kind,target,seconds){
   if(choice!=='yes')return;
   var body=JSON.stringify({consent:true,visitorId:visitor,sessionId:session,kind:kind,path:current,
      target:target||null,durationSeconds:seconds==null?null:seconds});
   fetch('/api/visitor-event',{method:'POST',headers:{'Content-Type':'application/json'},
      body:body,keepalive:true,credentials:'same-origin'}).catch(function(){});
  }
  if(created)send('visit');
  send('view');
  var lastTap=0;
  document.addEventListener('click',function(e){
   if(!(e.target instanceof Element))return;
   var el=e.target.closest('a,button,[data-analytics]');
   if(!el||el.closest('form')||el.closest('#rkn-analytics-manage,#rkn-analytics-choice')||Date.now()-lastTap<400)return;
   lastTap=Date.now();
   var label=el.getAttribute('data-analytics')||'';
   if(!targets.has(label))label='';
   if(!label&&el.tagName==='A'){
    try{var u=new URL(el.href);label=u.origin===location.origin?
      'link:'+((u.pathname||'/').replace(/^\//,'').replace(/\.html$/,'')||'home'):'external-link';}catch(_){label='link';}
   }
   label=label||'button';
   if(!targets.has(label))label=el.tagName==='A'?'link':'button';
   if(label)send('tap',label);
  },true);
  var since=document.visibilityState==='visible'?Date.now():0;
  function activity(){
   if(!since)return;
   var elapsed=Math.floor((Date.now()-since)/1000);
   since=document.visibilityState==='visible'?Date.now():0;
   if(elapsed>0)send('active_time',null,Math.min(180,elapsed));
  }
  document.addEventListener('visibilitychange',function(){
   activity();if(document.visibilityState==='visible')since=Date.now();
  });
  setInterval(activity,60000);
  window.addEventListener('pagehide',activity);
 }
 function initialize(){
  if(dnt)return;
  ensureManage();
  if(choice==='yes')start();
  else if(choice===null)prompt();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();

/* RKN visitor analytics: explicit opt-in, no private content, queries or keystrokes. */
(function () {
  'use strict';
  const CHOICE = 'rkn-analytics-consent-v1', VISITOR = 'rkn-visitor-v1', SESSION = 'rkn-session-v1';
  const ALLOWED = new Set(['/','/home','/about','/services','/projects','/contact','/interior']);
  const path = (location.pathname || '').replace(/\.html$/,'').replace(/\/$/,'') || '/';
  if (!ALLOWED.has(path)) return;
  const blocked = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  let choice = 'no';
  try { choice = blocked ? 'no' : localStorage.getItem(CHOICE); } catch { return; }
  const clear = () => { try { localStorage.removeItem(VISITOR); sessionStorage.removeItem(SESSION); } catch {} };
  const consent = value => { try { localStorage.setItem(CHOICE,value); } catch { return; } choice=value; if(value==='yes')start(); else clear(); };
  function prompt() {
    const dialog=document.createElement('aside');
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-label','Optional website analytics');
    dialog.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;max-width:460px;margin:auto;z-index:99999;background:white;color:#161616;border:1px solid #ccc;border-radius:12px;box-shadow:0 8px 32px #0003;padding:16px;font:14px/1.5 sans-serif';
    const title=document.createElement('strong');title.textContent='Help improve RKN Associates';
    const desc=document.createElement('p');desc.textContent='Allow anonymous visits, pages viewed, buttons tapped and active time to be counted? We never record names, messages, form entries or payment details.';
    const allow=document.createElement('button');allow.type='button';allow.textContent='Allow analytics';
    const no=document.createElement('button');no.type='button';no.textContent='No thanks';
    for(const b of [allow,no])b.style.cssText='font:inherit;padding:8px 14px;border-radius:8px;margin-right:8px;cursor:pointer;border:1px solid #666;color:#111;background:#f6f6f6';
    allow.style.background='#161616';allow.style.color='white';
    allow.addEventListener('click',()=>{dialog.remove();consent('yes')});
    no.addEventListener('click',()=>{dialog.remove();consent('no')});
    dialog.append(title,desc,allow,no);document.body.append(dialog);
  }
  function start() {
    if(start.started)return;
    start.started=true;
    let vid, sid;
    try {
      vid=localStorage.getItem(VISITOR) || crypto.randomUUID();
      localStorage.setItem(VISITOR,vid);
      const now=Date.now();
      let state;try{state=JSON.parse(sessionStorage.getItem(SESSION)||'null');}catch{}
      if(!state || !state.id || now-state.last>1800000 || state.last>now)state={id:crypto.randomUUID(),last:now,seen:false};
      const fresh=!state.seen;state.seen=true;state.last=now;sid=state.id;
      sessionStorage.setItem(SESSION,JSON.stringify(state));
      if(fresh)send('visit');
    } catch { return; }
    function send(kind,target,duration_seconds) {
      if(!vid || !sid || choice!=='yes')return;
      const payload={visitorId:vid,sessionId:sid,kind,path,target:target||null,durationSeconds:duration_seconds||null};
      try {
        fetch('/api/analytics',{method:'POST',credentials:'same-origin',keepalive:true,
          headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
      } catch {}
    }
    send('view');
    let lastClick=0;
    document.addEventListener('click',event=>{
      if(!(event.target instanceof Element))return;
      const element=event.target.closest('a,button,[data-analytics]');
      if(!element || element.closest('form') || Date.now()-lastClick<400)return;
      lastClick=Date.now();
      let target=element.getAttribute('data-analytics')||'';
      if(!target && element instanceof HTMLAnchorElement){
        try{const url=new URL(element.href);
          target=url.origin===location.origin?'link:'+url.pathname.replace(/\.html$/,''):'external-link';
        }catch{target='link'}
      }
      target=(target||'button').replace(/[^a-zA-Z0-9_:/-]/g,'_').slice(0,70);
      send('tap',target);
    },true);
    let since=document.visibilityState==='visible'?Date.now():0;
    function flush(){
      if(!since)return;
      const seconds=Math.floor((Date.now()-since)/1000);
      since=document.visibilityState==='visible'?Date.now():0;
      if(seconds>0)send('active_time',null,Math.min(180,seconds));
    }
    document.addEventListener('visibilitychange',()=>{flush();if(document.visibilityState==='visible')since=Date.now()});
    window.addEventListener('pagehide',flush);
    setInterval(flush,60000);
  }
  if(choice==='yes')start();else if(!blocked && choice!=='no'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prompt,{once:true});else prompt();}
})();

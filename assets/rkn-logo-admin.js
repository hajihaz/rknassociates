(function(){
 'use strict';
 // Hidden convenience shortcut only: the admin itself always requires real authentication.
 const admin='https://rkn-interior-admin.vercel.app/login';
 document.querySelectorAll('.nav-logo,.footer-logo-img,.pre-logo').forEach(node=>{
  let clicks=0,timeout=null;
  node.addEventListener('click',event=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   if(event.detail===0)return; // preserve normal keyboard navigation
   clicks++;
   const link=node.closest('a');
   if(link)event.preventDefault();
   if(timeout)clearTimeout(timeout);
   if(clicks>=3){clicks=0;location.assign(admin);return;}
   timeout=setTimeout(()=>{clicks=0;if(link)location.assign(link.href);},520);
  });
 });
})();

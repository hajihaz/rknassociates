/* Standalone public install, not active in private CMS previews. */
(function(){
 'use strict';
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 window.addEventListener('load',function(){
  navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(function(){
   // PWA installation is optional; never block public pages or checkout.
  });
 },{once:true});
})();

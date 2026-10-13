(function(){
 'use strict';
 var node=document.getElementById('rkn-site-data');if(!node)return;
 var data;try{data=JSON.parse(node.textContent);}catch{return;}
 window.RKN_SITE_DATA=data;
 var escape=function(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
 for(var field of data.fields||[]){
  var value=data.values[field.id];if(value===undefined||!field.project)continue;
  var id=field.project.id,property=field.project.property;
  if(property==='image'){
   if(value.indexOf('media:')===0)value=(data.preview?data.adminOrigin+'/api/media/':data.publicOrigin+'/api/interior-media?id=')+value.slice(6);
   if(value.indexOf('rkn:')===0){var existing=(window.RKN_IMG||{})[value.slice(4)];if(existing)window.RKN_IMG[id]=existing;}
   else if(window.RKN_IMG)window.RKN_IMG[id]={web:value,thumb:value,bw:value};
  }else if(window.RKN_META&&window.RKN_META[id])window.RKN_META[id][property]=escape(value);
 }
})();
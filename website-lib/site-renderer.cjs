const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderSite(template,page,global,manifest,{preview=false,adminOrigin='',publicOrigin='',globalPublicMedia=false}={}){
 const doc=manifest[page?.page_slug||'home']||{},fields=[...(doc.fields||[]),...(manifest.global?.fields||[])];
 const values={...(global?.values||{}),...(page?.snapshot?.values||page?.draft?.values||{})};
 const changed={};for(const f of fields)if(values[f.id]!==undefined&&values[f.id]!==f.value)changed[f.id]=values[f.id];
 const image=(v,id='')=>v.startsWith('media:')?(preview&&!(globalPublicMedia&&id.startsWith('global-'))?adminOrigin+'/api/media/':publicOrigin+'/api/interior-media?id=')+v.slice(6):v.startsWith('rkn:')?null:v;
 let html=template;
 if(preview)html=html.replace(/<head[^>]*>/,m=>m+'<base href="'+escapeHtml(publicOrigin+'/')+'">').replace('</head>','<style>#preloader{display:none!important}body{overflow:auto!important}.reveal{opacity:1!important;transform:none!important}*{animation-delay:0s!important;animation-duration:.001s!important;transition-duration:.001s!important}</style></head>').replace('src="assets/site-content.js"','src="'+adminOrigin+'/site-content.js"').replace('src="assets/shared.js"','src="'+adminOrigin+'/site-shared.js"');
 html=html.replace(/(<!--rkn-text:([^>]+)-->)[\s\S]*?(<!--\/rkn-text:[^>]+-->)/g,(all,start,id,end)=>changed[id]===undefined?all:start+escapeHtml(changed[id])+end);
 html=html.replace(/(<title[^>]+data-rkn-title="([^"]+)"[^>]*>)[\s\S]*?(<\/title>)/g,(all,start,id,end)=>changed[id]===undefined?all:start+escapeHtml(changed[id])+end);
 html=html.replace(/(<([a-z][\w:-]*)\b[^>]*data-rkn-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/gi,(all,start,tag,id,inner,end)=>{
  const key=id+'-en',field=fields.find(f=>f.id===key);if(changed[key]===undefined)return all;
  return start+(field?.type==='richtext'?changed[key]:escapeHtml(changed[key]))+end;
 });
 const attr=(tag,name,value)=>{const escaped=escapeHtml(value),pattern=new RegExp('\\s'+name+'="[^"]*"','i');return pattern.test(tag)?tag.replace(pattern,' '+name+'="'+escaped+'"'):tag.replace(/\/?>$/,m=>' '+name+'="'+escaped+'"'+m);};
 html=html.replace(/<[a-z][^>]*data-rkn-(?:href|image|background|alt|placeholder|aria-label|content)="[^"]+"[^>]*>/gi,tag=>{
  for(const [bind,target]of [['href','href'],['alt','alt'],['placeholder','placeholder'],['aria-label','aria-label'],['content','content']]){
   const id=tag.match(new RegExp('data-rkn-'+bind+'="([^"]+)"'))?.[1];if(id&&changed[id]!==undefined)tag=attr(tag,target,changed[id]);
  }
  for(const bind of ['image','background']){
   const id=tag.match(new RegExp('data-rkn-'+bind+'="([^"]+)"'))?.[1],value=id&&changed[id]!==undefined?image(changed[id],id):null;
   if(value){if(bind==='image'){tag=attr(tag,'src',value).replace(/\sdata-img="[^"]*"/,'').replace(/\sdata-variant="[^"]*"/,'');}
    else {tag=attr(tag,'style','background-image:url('+JSON.stringify(value)+')').replace(/\sdata-bg-img="[^"]*"/,'');}}
  }
  return tag;
 });
 for(const id of page?.snapshot?.hiddenSections||page?.draft?.hiddenSections||[])html=html.replace(new RegExp('(<section\\b[^>]*data-rkn-section="'+id+'"[^>]*)(>)'),'$1 hidden$2');
 const config={values:changed,fields:fields.filter(f=>f.project&&changed[f.id]!==undefined),preview,adminOrigin,publicOrigin};
 const data=JSON.stringify(config).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 // SEO metadata uses stable canonical routes even when older templates contain .html URLs.
 const slug=page?.page_slug||'home';
 // Vercel deployment is the canonical origin while the registrar's domain DNS remains unconfigured.
 const canonical='https://rknassociates.vercel.app/'+slug;
 if(/<link\s+rel=["']canonical["']/i.test(html)){
  html=html.replace(/<link\s+rel=["']canonical["'][^>]*>/i,'<link rel="canonical" href="'+escapeHtml(canonical)+'">');
 }else html=html.replace('</head>','<link rel="canonical" href="'+escapeHtml(canonical)+'"></head>');
 if(/<meta\s+property=["']og:url["']/i.test(html))html=html.replace(/<meta\s+property=["']og:url["'][^>]*>/i,'<meta property="og:url" content="'+escapeHtml(canonical)+'">');
 else html=html.replace('</head>','<meta property="og:url" content="'+escapeHtml(canonical)+'"></head>');
 if(!/property=["']og:image["']/i.test(html))html=html.replace('</head>','<meta property="og:image" content="https://rknassociates.vercel.app/assets/logo-512.png"></head>');
 if(!/name=["']twitter:card["']/i.test(html))html=html.replace('</head>','<meta name="twitter:card" content="summary"></head>');
 const crumbs={ '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
  {'@type':'ListItem',position:1,name:'RKN Associates',item:'https://rknassociates.vercel.app/home'},
  {'@type':'ListItem',position:2,name:slug.charAt(0).toUpperCase()+slug.slice(1),item:canonical}
 ]};
 // Fixed schema only; no customer data and no arbitrary admin-supplied markup.
 html=html.replace('</head>','<script type="application/ld+json">'+JSON.stringify(crumbs).replace(/</g,'\\u003c')+'</script></head>');
 // Add explicit accessible names to legacy inquiry form selects, without changing submitted field names.
 const inquirySelectLabels={project_type:'Project type',timeline:'Project timeline',interest:'Interior product interest',project:'Interior project type'};
 html=html.replace(/<select\b([^>]*)>/gi,(tag,attrs)=>{
  if(/\baria-label\s*=|\baria-labelledby\s*=/i.test(attrs))return tag;
  const name=attrs.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1];
  const label=name&&inquirySelectLabels[name];
  return label?'<select'+attrs+' aria-label="'+escapeHtml(label)+'">':tag;
 });
 html=html.replace('</head>','<link rel="stylesheet" href="/assets/rkn-accessibility.css"></head>');
 html=html.replace('</head>','<script id="rkn-site-data" type="application/json">'+data+'</script>'+'</head>');
 // The Interior collection renders client-side. Give it a stable, accessible page-level heading.
 if(!preview&&slug==='interior'&&!/<h1\b/i.test(html)){
  html=html.replace(/<main\b/i,'<h1 class="rkn-screen-reader-only">RKN Associates Interior Collection</h1><main');
 }
 // E-commerce is a separately managed public module; storefront JS respects per-page switches.
 const shopRoot='<div id="rkn-shop-root" data-page="'+escapeHtml(page?.page_slug||'home')+'"></div>';
 if(/<footer\b/i.test(html))html=html.replace(/<footer\b/i,shopRoot+'<footer');
 else html=html.replace('</body>',shopRoot+'</body>');
 html=html.replace('</head>','<link rel="stylesheet" href="/assets/rkn-commerce.css"></head>');
 html=html.replace('</body>','<script src="/assets/rkn-commerce.js" defer></script><script src="/assets/rkn-logo-admin.js" defer></script></body>');
 // Public website analytics are not loaded in the authenticated CMS preview.
 if(!preview){
  const installMeta='<link rel="manifest" href="/manifest.webmanifest">'+
   '<meta name="apple-mobile-web-app-capable" content="yes">'+
   '<meta name="apple-mobile-web-app-status-bar-style" content="default">'+
   '<meta name="apple-mobile-web-app-title" content="RKN">'+
   '<link rel="apple-touch-icon" sizes="180x180" href="/pwa/apple-touch-icon.png">';
  if(!/rel=["']manifest["']/i.test(html))html=html.replace('</head>',installMeta+'</head>');
  html=html.replace('</body>','<script src="/assets/rkn-pwa.js" defer></script></body>');
 }
 if(!preview)html=html.replace('</body>','<script src="/assets/customer-analytics.js" defer></script></body>');

 return html;
}
module.exports={renderSite,escapeHtml};

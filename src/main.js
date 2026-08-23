import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

// v6.9.5 CLEAN SPLIT CORE
// Load the checked local build byte-for-byte. No regex patching and no legacy
// camera implementation is executed.
const PARTS=[
  '../.v695-payload/part-000',
  '../.v695-payload/part-001',
  '../.v695-payload/part-002',
  '../.v695-payload/part-003'
];

const texts=await Promise.all(PARTS.map(async path=>{
  const r=await fetch(path+'?v=695',{cache:'no-store'});
  if(!r.ok)throw new Error(`v6.9.5 payload load failed: ${path} ${r.status}`);
  return r.text();
}));
const b64=texts.join('').replace(/\s+/g,'');
const binary=atob(b64);
const bytes=new Uint8Array(binary.length);
for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);

const zip=await JSZip.loadAsync(bytes);
const root='duel-arena-v6.9.5-clean-local/';
const mainEntry=zip.file(root+'src/main.js');
const styleEntry=zip.file(root+'style.css');
if(!mainEntry||!styleEntry)throw new Error('v6.9.5 canonical source files missing in payload');

const [source,canonicalCss]=await Promise.all([
  mainEntry.async('string'),
  styleEntry.async('string')
]);

for(const forbidden of ['updateSharedCamera','fitTopCamera','p2FaceControls','serviceWorker.register']){
  if(source.includes(forbidden))throw new Error(`v6.9.5 rejected stale source: ${forbidden}`);
}
if(!source.includes('SPLIT_VIEWS')||!source.includes('syncRendererSize')||!source.includes('getBoundingClientRect')){
  throw new Error('v6.9.5 canonical camera core markers missing');
}

document.querySelectorAll('link[rel="stylesheet"]').forEach(link=>{link.disabled=true;});
const style=document.createElement('style');
style.id='v695-canonical-style';
style.textContent=canonicalCss;
document.head.appendChild(style);

document.title='Duel Arena v6.9.5';
const badge=document.querySelector('.build-badge');
if(badge)badge.innerHTML='<strong>v6.9.5</strong><span>CLEAN SPLIT CORE</span>';

const blob=new Blob([source],{type:'text/javascript'});
const url=URL.createObjectURL(blob);
try{
  await import(url);
}finally{
  URL.revokeObjectURL(url);
}

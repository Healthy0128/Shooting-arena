import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

// v6.9.5 CLEAN SPLIT CORE
// The checked local build is stored byte-for-byte as one ZIP split into four
// repository blobs. This loader only restores that source; it does not patch,
// search/replace, or execute any older camera implementation.
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
const entry=zip.file('duel-arena-v6.9.5-clean-local/src/main.js');
if(!entry)throw new Error('v6.9.5 canonical src/main.js not found in payload');
const source=await entry.async('string');

// Safety guard: refuse to run if the archive is not the cleaned camera core.
for(const forbidden of ['updateSharedCamera','fitTopCamera','p2FaceControls','serviceWorker.register']){
  if(source.includes(forbidden))throw new Error(`v6.9.5 rejected stale source: ${forbidden}`);
}
if(!source.includes('SPLIT_VIEWS')||!source.includes('syncRendererSize')){
  throw new Error('v6.9.5 canonical camera core markers missing');
}

const blob=new Blob([source],{type:'text/javascript'});
const url=URL.createObjectURL(blob);
try{
  await import(url);
}finally{
  URL.revokeObjectURL(url);
}

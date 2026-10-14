/* Keeps the two field apps working without network. Pages are fetched fresh when there is a signal
   (a 4-second wait at most) and served from the phone when there is none. Data never passes through here:
   it is saved on the phone by the apps themselves. */
const V="awit-field-202610130449";
const CORE=["schooltrack/field/","sfvt/field/","lib/awit.js","schooltrack/field/manifest.webmanifest","sfvt/field/manifest.webmanifest","icons/schooltrack-192.png","icons/schooltrack-512.png","icons/sfvt-192.png","icons/sfvt-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE.map(p=>new Request(p,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("awit-field-")&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const mine=u=>u.origin===location.origin&&/\/(schooltrack|sfvt)\/field\/|\/lib\/awit\.js$|\/icons\//.test(u.pathname);
const fonts=u=>/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
async function fromPhone(c,r){const hit=await c.match(r,{ignoreSearch:true});if(hit)return hit;
  if(r.mode==="navigate"){const p=new URL(r.url).pathname;return c.match(p.includes("/sfvt/")?"sfvt/field/":"schooltrack/field/")}return undefined}
async function netFirst(r){const c=await caches.open(V);
  const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res});net.catch(()=>{});
  try{const first=await Promise.race([net,new Promise(ok=>setTimeout(()=>ok(null),4000))]);if(first)return first}catch(e){}
  const hit=await fromPhone(c,r);return hit||net}
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(mine(u))return e.respondWith(netFirst(r));
  if(fonts(u))e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(r);const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(r,res.clone());return res}).catch(()=>hit);return hit||net}))});

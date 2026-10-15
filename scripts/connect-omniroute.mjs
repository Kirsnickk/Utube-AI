// Use existing local credentials in memory; never print passwords, keys or cookies.
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const envFile=path.join(process.env.LOCALAPPDATA,'OmniRoute/data/.env');
const text=await fs.readFile(envFile,'utf8');const env=Object.fromEntries(text.split(/\r?\n/).filter(x=>/^[A-Z_]+=/.test(x)).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^['"]|['"]$/g,'')];}));
const base='http://127.0.0.1:20128';
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:env.INITIAL_PASSWORD}),signal:AbortSignal.timeout(15000)});
if(!login.ok){console.log('Local OmniRoute login HTTP',login.status,'; no settings changed');process.exit(1);}
const cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
const headers={'Content-Type':'application/json',Cookie:cookie};
const list=await fetch(base+'/api/keys',{headers});if(!list.ok){console.log('Keys HTTP',list.status);process.exit(1);}const payload=await list.json();
const rows=Array.isArray(payload)?payload:(payload.apiKeys||payload.keys||[]);
let key=rows.find(x=>x.name==='AI YouTube MVP'&&x.key);
if(!key){const r=await fetch(base+'/api/keys',{method:'POST',headers,body:JSON.stringify({name:'AI YouTube MVP'})});if(!r.ok){console.log('Create key HTTP',r.status);process.exit(1);}const p=await r.json();key=p.apiKey||p.key||p;}
const c=JSON.parse(await fs.readFile(path.join(root,'config.local.json'),'utf8'));
const r=await fetch(base+'/v1/models',{headers:{Authorization:'Bearer '+(typeof key==='string'?key:key.key)}});
if(!r.ok){console.log('Models HTTP',r.status);process.exit(1);}const ids=(await r.json()).data.map(x=>x.id);console.log('Configured requested models:',ids.filter(x=>Object.values(c.models).includes(x)));
console.log('OmniRoute connection ready; key stays in local OmniRoute storage.');

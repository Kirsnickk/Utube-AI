import fs from 'node:fs/promises';import path from 'node:path';
import {jobPath,locked,readJSON,writeJSON,hash} from '../src/core.mjs';
const root=path.resolve(import.meta.dirname,'..');
const source=jobPath(root,process.argv[2]||'tam-quoc-pilot-01');const id=process.argv[3]||'tam-quoc-images-01';const dest=jobPath(root,id);
await locked(source,async()=>{const s=await readJSON(path.join(source,'job.json'));await fs.mkdir(dest);await locked(dest,async()=>{
 const manifest=[];const names=['ridge','river','strategy','courtyard'];
 for(let i=0;i<names.length;i++){const from=path.join(root,'assets/tam-quoc',names[i]+'.png');const name=`image-${i}.png`;await fs.copyFile(from,path.join(dest,name));manifest.push({file:name,source:path.relative(root,from),sha256:hash(await fs.readFile(from)),origin:'imagegen',role:'Original conceptual historical illustration; not a movie still'});}
 for(const scene of s.assets.scenes){await fs.copyFile(path.join(source,scene.audio),path.join(dest,scene.audio));await fs.copyFile(path.join(source,scene.audio+'.json'),path.join(dest,scene.audio+'.json'));}
 await writeJSON(path.join(dest,'job.json'),{id,mode:'agents',stage:'assets',format:'landscape',parentJob:s.id,createdAt:new Date().toISOString(),agentCalls:0,usage:[],script:s.script,design:{...s.design,visualMode:'image-first',images:manifest.map(x=>x.file)},assets:s.assets,provenance:{...s.provenance,visuals:'Original ImageGen illustrations',captions:'Separate SRT, no burned-in text'}});
 await writeJSON(path.join(dest,'image-manifest.json'),manifest);
});});
console.log('Image revision created:',dest);

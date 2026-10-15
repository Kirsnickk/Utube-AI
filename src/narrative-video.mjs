import fs from 'node:fs/promises';
import path from 'node:path';
import {jobPath,locked,readJSON,writeJSON,hash,validateScript} from './core.mjs';
import {validateNarrativeInput,validateNarrativeScript,validateStoryboard} from './narrative.mjs';

export async function prepareNarrativeVideo(root,id,sourceId,mapFile){
 if(id===sourceId)throw Error('Use a new video job ID; preserve narrative source');
 const source=jobPath(root,sourceId),dir=jobPath(root,id);
 const narrative=await readJSON(path.join(source,'narrative.json'));
 if(narrative.stage!=='plan_review')throw Error('Narrative is not ready for rendering');
 validateNarrativeInput(narrative.input);
 validateNarrativeScript(narrative.script,narrative.bible,narrative.input);
 validateStoryboard(narrative.storyboard,narrative.script);
 if(narrative.input.mode==='review'&&narrative.input.sources.some(s=>s.scope!=='episode'||typeof s.locator!=='string'||!s.locator.trim()))throw Error('Review needs episode content sources with locators, not catalog sources');
 const scenes=narrative.script.chapters.flatMap((chapter,chapterIndex)=>chapter.scenes.map(s=>({
  heading:chapter.title,sceneId:s.id,chapterIndex,visualBrief:s.visualBrief,lines:s.lines,
  narration:s.lines.map(l=>l.text).join(' ')
 })));
 const script=validateScript({title:narrative.script.title,description:narrative.input.premise,sources:narrative.input.sources||[],scenes});
 const map=await readJSON(mapFile);
 if(!Array.isArray(map.shots)||map.shots.length!==scenes.length)throw Error('Asset map needs exactly one image per scene');
 const mapped=new Map();
 for(const shot of map.shots){
  if(mapped.has(shot.sceneId)||!scenes.some(s=>s.sceneId===shot.sceneId))throw Error('Duplicate or unknown asset scene');
  if(typeof shot.file!=='string'||path.isAbsolute(shot.file)||/^[a-z]+:|\\/i.test(shot.file))throw Error('Asset path must be relative to project');
  if(!shot.provenance||!['origin','rights'].every(k=>typeof shot.provenance[k]==='string'&&shot.provenance[k].trim()))throw Error('Asset provenance and rights required');
  const realRoot=await fs.realpath(root),file=await fs.realpath(path.resolve(root,shot.file));
  const relative=path.relative(realRoot,file);
  if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('Asset path escapes project');
  const bytes=await fs.readFile(file);
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Asset must be a PNG image');
  mapped.set(shot.sceneId,{...shot,bytes,sha256:hash(bytes)});
 }
 const images=scenes.map((s,i)=>{const a=mapped.get(s.sceneId);if(!a)throw Error('Missing scene asset');return {...a,localFile:`image-${i}.png`};});
 const provenance=images.map(({bytes,...a})=>a);
 const fingerprint=hash(JSON.stringify({narrative,assets:provenance,version:1}));
 return locked(dir,async()=>{
  let existing;try{existing=await readJSON(path.join(dir,'job.json'));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(existing){
   if(existing.narrativeFingerprint!==fingerprint||JSON.stringify(existing.script)!==JSON.stringify(script)||JSON.stringify(existing.design.sceneImages)!==JSON.stringify(images.map(a=>a.localFile)))throw Error('Input/assets changed or different job; use a new video job ID');
   for(const a of images){
    let bytes;
    try{bytes=await fs.readFile(path.join(dir,a.localFile));}
    catch(e){throw Error(`Copied asset missing (${a.localFile}); use a new video job ID`);}
    if(hash(bytes)!==a.sha256)throw Error('Copied asset changed; use a new video job ID');
   }
   return dir;
  }
  const marker=path.join(dir,'bridge-input.json');
  let pending;try{pending=await readJSON(marker);}catch(e){if(e.code!=='ENOENT')throw e;}
  if(pending&&pending.fingerprint!==fingerprint)throw Error('Pending input changed; use a new job ID');
  if(!pending){
   if((await fs.readdir(dir)).some(f=>f!=='.lock'))throw Error('Destination already contains unrelated files');
   await writeJSON(marker,{fingerprint});
  }
  for(const a of images)await fs.writeFile(path.join(dir,a.localFile),a.bytes);
  await writeJSON(path.join(dir,'narrative.json'),narrative);
  await writeJSON(path.join(dir,'storyboard.json'),narrative.storyboard);
  await writeJSON(path.join(dir,'asset-provenance.json'),provenance);
  await writeJSON(path.join(dir,'job.json'),{
   id,mode:'agents',stage:'script',format:'landscape',agentCalls:0,usage:[],createdAt:new Date().toISOString(),
   parentJob:sourceId,narrativeFingerprint:fingerprint,
   provenance:{narrativeMode:narrative.input.mode,sourceJob:sourceId,sourceAgentCalls:narrative.agentCalls||0,sourceUsage:narrative.usage||[],editorial:narrative.provenance||null,voiceMode:'single-narrator; speaker IDs retained in narrative and script'},
   script,design:{accent:'#d9ad70',labels:scenes.map(s=>s.heading.slice(0,55)),visualMode:'image-first',images:images.map(a=>a.localFile),sceneImages:images.map(a=>a.localFile)}
  });
  return dir;
 });
}

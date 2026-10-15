import fs from 'node:fs/promises';import path from 'node:path';
import {jobPath,locked,readJSON,writeJSON} from './core.mjs';
import {agent,models} from './gateway.mjs';
export function validateNarrativeInput(input) {
 if(!['original','review'].includes(input.mode)||typeof input.premise!=='string'||!input.premise.trim())throw Error('Narrative needs mode original/review and premise');
 if(input.mode==='review'){
  if(!Array.isArray(input.sources)||!input.sources.length)throw Error('Review requires source text');
  const ids=new Set();for(const s of input.sources){if(typeof s.id!=='string'||ids.has(s.id)||typeof s.text!=='string'||s.text.trim().length<50)throw Error('Each review source needs a unique ID and usable text');ids.add(s.id);}
 }
 return input;
}
export function validateNarrativeScript(script,bible,input){
 if(typeof script.title!=='string'||!Array.isArray(script.chapters)||script.chapters.length!==3)throw Error('Script needs title and 3 pilot chapters');
 const speakers=new Set(['narrator',...bible.characters.map(c=>c.id)]),ids=new Set(),sourceIds=new Set((input.sources||[]).map(s=>s.id));
 for(const chapter of script.chapters){if(typeof chapter.title!=='string'||!Array.isArray(chapter.scenes)||!chapter.scenes.length)throw Error('Invalid chapter');
  for(const s of chapter.scenes){if(typeof s.id!=='string'||ids.has(s.id)||typeof s.visualBrief!=='string'||!Array.isArray(s.lines)||!s.lines.length)throw Error('Invalid or duplicate scene');ids.add(s.id);
   for(const l of s.lines){if(!speakers.has(l.speakerId)||typeof l.text!=='string'||!l.text.trim())throw Error('Unknown speaker or empty line');
    if(input.mode==='review'&&(!['summary','commentary'].includes(l.kind)||!Array.isArray(l.sourceIds)||!l.sourceIds.length||l.sourceIds.some(id=>!sourceIds.has(id))))throw Error('Review lines need kind and valid source IDs');}
  }
 }
 return script;
}
export function validateStoryboard(storyboard,script){
 const scenes=script.chapters.flatMap(c=>c.scenes);if(!Array.isArray(storyboard.shots)||storyboard.shots.length!==scenes.length)throw Error('Storyboard needs one shot per scene');
 const ids=new Set(scenes.map(s=>s.id));for(const s of storyboard.shots){if(!ids.delete(s.sceneId)||typeof s.imagePrompt!=='string'||!s.imagePrompt.trim())throw Error('Invalid/duplicate shot');}return storyboard;
}
export async function planNarrative(root,id,inputFile,config){const dir=jobPath(root,id);return locked(dir,async()=>{
 const file=path.join(dir,'narrative.json');let state;try{state=await readJSON(file);}catch(e){if(e.code!=='ENOENT')throw e;await fs.access(path.join(dir,'job.json')).then(()=>{throw Error('Job ID already used by video pipeline');},e=>{if(e.code!=='ENOENT')throw e;});state={id,stage:'queued',agentCalls:0,createdAt:new Date().toISOString(),input:validateNarrativeInput(await readJSON(inputFile))};}
 const save=()=>writeJSON(file,state);await save();
 try{
  const available=await models(config);for(const id of Object.values(config.models))if(!available.includes(id))throw Error('Model unavailable: '+id);
  const rule=state.input.mode==='original'?'Create an ORIGINAL fictional story. Do not adapt characters, events or text from the reference channel.':'Only summarize the supplied source texts. Separate plot summary from original critical commentary; never invent missing plot details or pretend you watched a film.';
  if(!state.bible){state.stage='story_bible';await save();const b=await agent(config,state,save,'brain',`${rule} Plan a 3-minute Vietnamese pilot in 3 chapters. Return {title:string,characters:[{id:string,name:string,appearance:string,motivation:string}],outline:[{chapter:1,title:string,beat:string}],continuityRules:[string]}. 2-3 characters, unique lowercase IDs; narrator is reserved. For review use only source characters. Input: ${JSON.stringify(state.input)}`);if(!Array.isArray(b.characters)||!b.characters.length||new Set(b.characters.map(c=>c.id)).size!==b.characters.length||b.characters.some(c=>!c.id||c.id==='narrator')||!Array.isArray(b.outline)||b.outline.length!==3)throw Error('Invalid story bible');state.bible=b;await save();}
  if(!state.script){
   state.stage='chapter_script';state.chapterDrafts??=[];await save();
   for(let i=state.chapterDrafts.length;i<3;i++){
    const chapter=await agent(config,state,save,'writer',`${rule} Write ONLY chapter ${i+1} of the 3-chapter pilot. Return {title:string,scenes:[{id:string,visualBrief:string,lines:[{speakerId:string,text:string,kind:string,sourceIds:[string]}]}]}. Exactly 2 scenes with IDs c${i+1}s1 and c${i+1}s2. Vietnamese spoken text 100-130 words TOTAL for this chapter. Speakers match bible IDs or narrator. Original: kind narration/dialogue, sourceIds empty. Review: kind summary/commentary with valid source IDs. Keep continuity with earlier chapters; no recap repetition. Bible: ${JSON.stringify(state.bible)} Previous chapters: ${JSON.stringify(state.chapterDrafts)} Input: ${JSON.stringify(state.input)}`,{maxTokens:4000});
    if(!Array.isArray(chapter.scenes)||chapter.scenes.length!==2)throw Error('Chapter needs 2 scenes');state.chapterDrafts.push(chapter);await save();
   }
   state.script=validateNarrativeScript({title:state.bible.title,chapters:state.chapterDrafts},state.bible,state.input);await save();
  }
  if(!state.storyboard){state.stage='storyboard';await save();state.storyboard=validateStoryboard(await agent(config,state,save,'builder',`Create storyboard descriptors, do not generate media or claim files exist. Return {styleGuide:string,shots:[{sceneId:string,imagePrompt:string,characterIds:[string],camera:string}]}. Exactly one shot for each script scene. Prompts visually consistent with bible appearances. No copied logos or channel identity. Bible: ${JSON.stringify(state.bible)} Script: ${JSON.stringify(state.script)}`,{maxTokens:5000}),state.script);await save();}
  const text=state.script.chapters.map((c,i)=>`## Chương ${i+1}: ${c.title}\n\n`+c.scenes.map(s=>`### ${s.id}\n\n${s.lines.map(l=>`**${l.speakerId}:** ${l.text}`).join('\n\n')}\n\n*Hình: ${s.visualBrief}*`).join('\n\n')).join('\n\n');
  await fs.writeFile(path.join(dir,'script.md'),`# ${state.script.title}\n\n${text}\n`);await writeJSON(path.join(dir,'storyboard.json'),state.storyboard);state.stage='plan_review';state.error=null;await save();console.log('Narrative plan ready:',path.join(dir,'script.md'));
 }catch(e){state.failedStage=state.stage;state.stage='failed';state.error=e.message;await save();throw e;}
});}

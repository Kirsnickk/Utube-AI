import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readJSON,writeJSON,jobPath,locked,hash,validateScript,validateDesign} from './core.mjs';
import {models,agent} from './gateway.mjs';
import {projectRoot,makeAssets,enrichWaveforms,composition,render,mediaInfo,hf} from './media.mjs';
import {TEMPLATE_VERSION,normalizeVisual} from './scenes.mjs';
import {upload} from './youtube.mjs';
import {planNarrative} from './narrative.mjs';
import {writeDelivery} from './delivery.mjs';
import {prepareNarrativeVideo} from './narrative-video.mjs';
const args=process.argv.slice(2),command=args[0]||'help';
async function config(){try{return await readJSON(path.join(projectRoot,'config.local.json'));}catch(e){if(e.code!=='ENOENT')throw e;return readJSON(path.join(projectRoot,'config.example.json'));}}
async function pipeline(id,demo=false){const c=await config(),dir=jobPath(projectRoot,id);return locked(dir,async()=>{
 let state;try{state=await readJSON(path.join(dir,'job.json'));}catch(e){if(e.code!=='ENOENT')throw e;state={id,mode:demo?'demo':'agents',stage:'queued',agentCalls:0,createdAt:new Date().toISOString()};}
 if(state.mode!==(demo?'demo':'agents'))throw Error('Job mode mismatch');
 const save=()=>writeJSON(path.join(dir,'job.json'),state); await save();
 const stage=async(name,fn)=>{state.stage=name;state.error=null;await save();console.log(name);const value=await fn();await save();return value;};
 try{
  if(!state.script){
   if(demo){state.script=validateScript(await readJSON(path.join(projectRoot,'examples/demo-script.json')));state.design={accent:'#5ef1bd',labels:['Ý tưởng đến sản phẩm','Thông điệp rõ ràng','Giọng đọc tiếng Việt','Đồ họa chuyển động','Chất lượng trước số lượng']};}
   else{
    state.input??=await readJSON(path.resolve(args[2]||path.join(projectRoot,'examples/topic.json')));await save();
    const available=await models(c);for(const [role,id]of Object.entries(c.models))if(!available.includes(id))throw Error(`Model unavailable: ${role} ${id}`);
    state.brief??=await stage('brief',()=>agent(c,state,save,'brain',`Create a Vietnamese educational short brief. Only use supplied facts. Return {angle:string,audience:string,visualDirection:string}. Input: ${JSON.stringify(state.input)}`));
    state.script=validateScript(await stage('script',()=>agent(c,state,save,'writer',`Write a 30-60 second original Vietnamese short. Return {title:string,description:string,sources:array,scenes:[{heading:string,narration:string}]}. 3-5 scenes, 90-140 Vietnamese words TOTAL narration. Heading max 65 characters. Use supplied facts only, preserve source URLs. No claims of web research. Input ${JSON.stringify(state.input)} Brief ${JSON.stringify(state.brief)}`)));await save();
   }
  }
  if(!state.design)state.design=validateDesign(await stage('design',()=>agent(c,state,save,'builder',`Create declarative visual direction for this script, not executable code. Return {accent:"#RRGGBB",labels:[string],scenes:[{type:"title"|"process"|"audio"|"checklist",items:[string]}]}. Bright accent on dark navy; labels max 40 characters. Exactly one label and scene descriptor per script scene. 2-4 short items per scene, max 45 characters, accurately reflect the narration. Use audio only if explaining sound. No invented statistics. ${JSON.stringify(state.script)}`)));
  if(state.design.scenes && state.design.scenes.length!==state.script.scenes.length)throw Error('Design scene count mismatch');
  if(state.design.labels.length!==state.script.scenes.length)throw Error('Design label count mismatch');
  for(let i=0;i<state.script.scenes.length;i++)normalizeVisual(state.design.scenes?.[i],state.script.scenes[i].heading,state.design.labels[i]);
  if(!state.assets)state.assets=await stage('assets',()=>makeAssets(c,dir,state.script));
  if(!state.composed)state.assets=await enrichWaveforms(dir,state.assets);
  if(!state.composed){await stage('composition',async()=>{await fs.copyFile(path.join(projectRoot,'node_modules/gsap/dist/gsap.min.js'),path.join(dir,'gsap.min.js'));await fs.copyFile(c.fontPath||'C:/Windows/Fonts/arial.ttf',path.join(dir,'font.ttf'));await fs.writeFile(path.join(dir,'index.html'),composition(state.script,state.assets,state.design,state.format));state.composed=true;state.templateVersion=TEMPLATE_VERSION;});}
  if(!state.renderInfo){state.renderInfo=await stage('render',()=>render(dir));const video=state.renderInfo.streams.find(s=>s.codec_type==='video');const size=state.format==='landscape'?[1920,1080]:[1080,1920];if(video.width!==size[0]||video.height!==size[1]||Math.abs(Number(state.renderInfo.format.duration)-state.assets.duration)>1)throw Error('Render dimensions/duration mismatch');}
  await writeDelivery(dir,state);
  if(!['approved','uploaded'].includes(state.stage))state.stage='review';state.videoHash=hash(await fs.readFile(path.join(dir,'video.mp4')));await save();console.log(`Video (${state.stage}): ${path.join(dir,'video.mp4')}`);
 }catch(e){state.failedStage=state.stage;if(state.stage==='render')delete state.renderInfo;state.stage='failed';state.error=e.message;await save();throw e;}
 });}
async function main(){
 if(command==='render-narrative'){
  if(!args[1]||!args[2]||!args[3])throw Error('Usage: render-narrative <new-id> <narrative-id> <asset-map.json>');
  await prepareNarrativeVideo(projectRoot,args[1],args[2],path.resolve(args[3]));
  return pipeline(args[1]);
 }
 if(command==='render-script'){
  const dir=jobPath(projectRoot,args[1]);let exists=false;try{await fs.access(path.join(dir,'job.json'));exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}
  if(!exists){const spec=await readJSON(path.resolve(args[2]));validateScript(spec.script);validateDesign(spec.design);if(!['portrait','landscape'].includes(spec.format||'portrait'))throw Error('Unsupported format');await locked(dir,()=>writeJSON(path.join(dir,'job.json'),{id:args[1],mode:'agents',stage:'script',agentCalls:0,usage:[],createdAt:new Date().toISOString(),format:spec.format||'portrait',provenance:spec.provenance||{scriptAuthor:'User supplied script',agentGenerated:false},script:spec.script,design:spec.design}));}
  return pipeline(args[1]);
 }
 if(command==='plan-story')return planNarrative(projectRoot,args[1],path.resolve(args[2]||'examples/original-story.json'),await config());
 if(command==='demo')return pipeline(args[1]||'demo-001',true);
 if(command==='run')return pipeline(args[1]||'video-001');
 if(command==='revise'){
  const source=jobPath(projectRoot,args[1]),dest=jobPath(projectRoot,args[2]);
  await locked(source,async()=>{
   const previous=await readJSON(path.join(source,'job.json'));if(!previous.script||!previous.assets||!previous.design)throw Error('Source job has no reusable assets');
   await fs.mkdir(dest); // Never overwrite an existing revision.
   await locked(dest,async()=>{for(const s of previous.assets.scenes){await fs.copyFile(path.join(source,s.audio),path.join(dest,s.audio));await fs.copyFile(path.join(source,s.audio+'.json'),path.join(dest,s.audio+'.json'));}
    if(previous.design.visualMode==='image-first')for(const name of previous.design.images){if(!/^image-\d+\.png$/.test(name))throw Error('Invalid local image asset');await fs.copyFile(path.join(source,name),path.join(dest,name));}
    await writeJSON(path.join(dest,'job.json'),{id:args[2],mode:previous.mode,format:previous.format,provenance:previous.provenance,stage:'assets',parentJob:args[1],createdAt:new Date().toISOString(),agentCalls:0,usage:[],input:previous.input,brief:previous.brief,script:previous.script,design:previous.design,assets:previous.assets});});
  });return pipeline(args[2],(await readJSON(path.join(dest,'job.json'))).mode==='demo');
 }
 if(command==='doctor'){const c=await config();console.log('Node',process.version);try{console.log('Gateway models:',(await models(c)).filter(x=>Object.values(c.models).includes(x)));}catch(e){console.log(e.message);}console.log(await hf(projectRoot,['doctor','--json']));return;}
 if(command==='status'){console.log(JSON.stringify(await readJSON(path.join(jobPath(projectRoot,args[1]),'job.json')),null,2));return;}
 if(command==='approve'){const dir=jobPath(projectRoot,args[1]);return locked(dir,async()=>{const s=await readJSON(path.join(dir,'job.json'));if(s.stage!=='review')throw Error('Not ready for review');if(!args.includes('--ai-disclosure-yes')&&!args.includes('--ai-disclosure-no'))throw Error('Specify --ai-disclosure-yes or --ai-disclosure-no after reviewing YouTube criteria');s.approvedHash=hash(await fs.readFile(path.join(dir,'video.mp4')));s.disclosure=args.includes('--ai-disclosure-yes');s.stage='approved';await writeJSON(path.join(dir,'job.json'),s);console.log('Approved current video hash');});}
 if(command==='upload'){const dir=jobPath(projectRoot,args[1]);return locked(dir,async()=>{const s=await readJSON(path.join(dir,'job.json'));console.log('YouTube private video ID:',await upload(await config(),dir,s,()=>writeJSON(path.join(dir,'job.json'),s)));});}
 if(command==='unlock'){const dir=jobPath(projectRoot,args[1]);const pid=Number(await fs.readFile(path.join(dir,'.lock'),'utf8'));try{process.kill(pid,0);throw Error('Lock process still running');}catch(e){if(e.code!=='ESRCH')throw e;}await fs.unlink(path.join(dir,'.lock'));return;}
 console.log('Commands: render-narrative <new-id> <narrative-id> <asset-map.json> | render-script <id> <spec.json> | plan-story <id> <input.json> | doctor | demo [id] | run <id> [topic.json] | revise <source-id> <new-id> | status <id> | approve <id> --ai-disclosure-yes/no | upload <id> | unlock <id>');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});

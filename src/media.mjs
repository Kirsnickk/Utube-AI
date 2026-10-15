import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import probe from 'ffprobe-static';
import {escapeHTML,readJSON,hash,writeJSON} from './core.mjs';
import {compositionV2} from './scenes.mjs';
import {landscapeComposition} from './landscape.mjs';
import {imageFirstComposition} from './image-video.mjs';
export const projectRoot=path.resolve(import.meta.dirname,'..');
export function run(exe,args,cwd=projectRoot) { return new Promise((resolve,reject)=>{const p=spawn(exe,args,{cwd,windowsHide:true,env:{...process.env,PATH:[path.dirname(ffmpeg),path.dirname(probe.path),process.env.PATH].join(path.delimiter)}});let out='';p.stdout.on('data',x=>{out+=x;});p.stderr.on('data',x=>{out+=x;});p.on('error',reject);p.on('close',code=>code===0?resolve(out):reject(Error(`${path.basename(exe)} exit ${code}: ${out.slice(-3500)}`)));}); }
export async function mediaInfo(file) {return JSON.parse(await run(probe.path,['-v','error','-show_format','-show_streams','-of','json',file]));}
export async function makeAssets(config,dir,script) {
  let start=0;const scenes=[];
  for(let i=0;i<script.scenes.length;i++) {
    const audio=path.join(dir,`voice-${i}.mp3`);let valid=false;
    const fingerprint=audioFingerprint(script.scenes[i].narration,config.tts);
    try { const info=await mediaInfo(audio);valid=Number(info.format.duration)>0 && (await readJSON(audio+'.fingerprint.json')).hash===fingerprint; await readJSON(audio+'.json'); } catch {}
    if(!valid) {await fs.writeFile(audio+'.txt',script.scenes[i].narration);await run(config.tts.python,[path.join(projectRoot,'scripts/tts.py'),audio+'.txt',audio,config.tts.voice,config.tts.backend||'edge',probe.path,ffmpeg]);await writeJSON(audio+'.fingerprint.json',{hash:fingerprint});}
    const info=await mediaInfo(audio);const duration=Number(info.format.duration)+0.35;
    if(!Number.isFinite(duration)||duration<=0)throw Error('Invalid speech duration');
    scenes.push({...script.scenes[i],start,duration,audio:path.basename(audio),cues:await readJSON(audio+'.json')});start+=duration;
  }
  return {scenes,duration:start};
}
export function audioFingerprint(narration,tts) {return hash(JSON.stringify({narration,backend:tts.backend||'edge',voice:tts.voice,version:2}));}
export async function enrichWaveforms(dir,assets) {
 for(const s of assets.scenes){if(s.waveform)continue;const r=spawnSync(ffmpeg,['-v','error','-i',path.join(dir,s.audio),'-ac','1','-ar','8000','-f','s16le','pipe:1'],{windowsHide:true,maxBuffer:20*1024*1024});if(r.status!==0)throw Error('Waveform decode failed');const b=r.stdout;const samples=Math.floor(b.length/2);if(!samples)throw Error('Empty waveform');const bins=[];for(let n=0;n<48;n++){let sum=0,count=0;for(let j=Math.floor(n*samples/48);j<Math.floor((n+1)*samples/48);j++){const v=b.readInt16LE(j*2)/32768;sum+=v*v;count++;}bins.push(Math.sqrt(sum/Math.max(1,count)));}const peak=Math.max(...bins,0.00001);s.waveform=bins.map(v=>v/peak);}
 return assets;
}
export function composition(script,assets,design,format='portrait') {
  if(design.visualMode==='image-first')return imageFirstComposition(script,assets,design,format);
  if(format==='landscape')return landscapeComposition(script,assets,design);
  return compositionV2(script,assets,design);
}
export function legacyComposition(script,assets,design) {
  const sceneHTML=assets.scenes.map((s,i)=>`<section class="clip scene" data-start="${s.start}" data-duration="${s.duration}" data-track-index="0"><div id="content-${i}" class="content"><div class="eyebrow">AI VIDEO LAB / ${String(i+1).padStart(2,'0')}</div><h1>${escapeHTML(s.heading)}</h1><div class="diagram"><div class="orb">${i+1}</div><div class="line"></div><div class="step">${escapeHTML(design.labels[i]||s.heading)}</div></div><div class="progress">${script.scenes.map((_,n)=>`<span style="background:${n<=i?'var(--accent)':'#32445a'}"></span>`).join('')}</div></div></section><audio id="voice-${i}" src="${s.audio}" data-start="${s.start}" data-duration="${s.duration-0.35}" data-track-index="1"></audio>`).join('');
  const captions=assets.scenes.flatMap((s,i)=>s.cues.map((c,n)=>`<div class="clip caption" data-start="${s.start+c.start}" data-duration="${Math.max(0.1,Math.min(c.duration,s.duration-c.start))}" data-track-index="2"><div>${escapeHTML(c.text)}</div></div>`)).join('');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><script src="gsap.min.js"></script><style>
@font-face{font-family:VideoFont;src:url('font.ttf')}*{box-sizing:border-box}body{margin:0;background:#0b1324;color:#f7f9ff;font-family:VideoFont,sans-serif}#root{position:relative;width:100%;height:100%;overflow:hidden;--accent:${design.accent};background:#0b1324}.clip{position:absolute;inset:0}.content{position:absolute;inset:180px 85px 440px;display:flex;flex-direction:column;justify-content:center}.eyebrow{font-size:28px;letter-spacing:5px;color:var(--accent);margin-bottom:65px}h1{font-size:92px;line-height:1.12;margin:0;overflow-wrap:anywhere}.diagram{display:flex;align-items:center;margin-top:110px;gap:32px}.orb{width:150px;height:150px;flex-shrink:0;border:5px solid var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:72px;color:var(--accent)}.line{width:60px;height:5px;background:var(--accent);flex-shrink:0}.step{font-size:42px;line-height:1.35}.progress{display:flex;gap:14px;margin-top:100px}.progress span{height:8px;flex:1;border-radius:4px}.caption{inset:auto 85px 230px;height:260px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:43px;line-height:1.4}.caption div{background:#17263e;padding:25px 32px;border-radius:20px;width:100%}.footer{position:absolute;bottom:80px;left:85px;font-size:26px;color:#a8bad2}
</style></head><body><div id="root" data-composition-id="main" data-width="1080" data-height="1920" data-duration="${assets.duration}" data-start="0">${sceneHTML}${captions}<div class="footer">Ý TƯỞNG → KỊCH BẢN → VIDEO</div></div><script>const tl=gsap.timeline({paused:true});${assets.scenes.map((s,i)=>`tl.fromTo('#content-${i}',{y:35,opacity:0},{y:0,opacity:1,duration:0.6,ease:'power2.out'},${s.start});`).join('')}window.__timelines['main']=tl;</script></body></html>`;
}
export async function hf(dir,args) {const pkg=await readJSON(path.join(projectRoot,'node_modules/hyperframes/package.json'));const bin=typeof pkg.bin==='string'?pkg.bin:Object.values(pkg.bin)[0];return run(process.execPath,[path.join(projectRoot,'node_modules/hyperframes',bin),...args],dir);}
export async function render(dir) {
  await fs.writeFile(path.join(dir,'check.log'),await hf(dir,['check']));
  await fs.writeFile(path.join(dir,'render.log'),await hf(dir,['render','--quality','draft','--output','video.mp4']));
  const info=await mediaInfo(path.join(dir,'video.mp4'));if(!info.streams.some(x=>x.codec_type==='audio')||!info.streams.some(x=>x.codec_type==='video'))throw Error('Missing audio/video stream');
  await run(ffmpeg,['-y','-ss','3','-i',path.join(dir,'video.mp4'),'-frames:v','1',path.join(dir,'preview.png')]);return info;
}

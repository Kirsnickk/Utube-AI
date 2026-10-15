import {escapeHTML as e} from './core.mjs';
export const TEMPLATE_VERSION='2.0.0';
export function sceneType(heading) {
 const t=heading.toLowerCase();
 if(/tts|giọng|âm thanh.*văn bản/.test(t))return 'audio';
 if(/kiểm tra|bản quyền|duyệt/.test(t))return 'checklist';
 return 'process';
}
export function normalizeVisual(v,heading,label) {
 const type=v?.type||sceneType(heading);
 if(!['title','process','audio','checklist'].includes(type))throw Error('Unsupported visual type: '+type);
 const defaults=type==='audio'?['Văn bản','Giọng đọc','Timing']:
 type==='checklist'?['Nội dung chính xác','Quyền dùng media','Xem và nghe bản dựng']:
 /render|ghép|dựng/i.test(heading)?['Hình ảnh','Âm thanh','MP4']:['Ý tưởng','Kịch bản','Cấu trúc cảnh'];
 const items=v?.items||defaults;
 if(!Array.isArray(items)||items.length<2||items.length>4||items.some(s=>typeof s!=='string'||!s.trim()||s.length>45))throw Error('Visual items: 2-4 strings, max 45 characters');
 return {type,items,caption:label||heading};
}
export function visualMarkup(v,waveform,index) {
 if(v.type==='audio') {
   const samples=Array.isArray(waveform)&&waveform.length?waveform:Array(48).fill(0.15);
   return `<div class="visual audio-panel"><div class="panel-label">VOICE / AUDIO THỰC TẾ</div><div class="waveform">${samples.map((x,n)=>`<span class="beat" style="height:${Math.round(15+Math.max(0,Math.min(1,x))*185)}px"></span>`).join('')}</div><div class="audio-rail">${v.items.map(x=>`<span>${e(x)}</span>`).join('<b>→</b>')}</div></div>`;
 }
 if(v.type==='checklist')return `<div class="visual checklist">${v.items.map((x,n)=>`<div class="check-row reveal"><span class="check-icon">✓</span><span>${e(x)}</span></div>`).join('')}</div>`;
 if(v.type==='title')return `<div class="visual title-panel"><span class="big-index">${String(index+1).padStart(2,'0')}</span><p>${e(v.caption)}</p></div>`;
 return `<div class="visual process-grid">${v.items.map((x,n)=>`<div class="node reveal"><span class="node-number">${String(n+1).padStart(2,'0')}</span><div>${e(x)}</div></div>${n<v.items.length-1?'<div class="connector">↓</div>':''}`).join('')}</div>`;
}
export function compositionV2(script,assets,design) {
 const visuals=assets.scenes.map((s,i)=>normalizeVisual(design.scenes?.[i],s.heading,design.labels[i]));
 const scenes=assets.scenes.map((s,i)=>`<section class="clip scene" data-start="${s.start}" data-duration="${s.duration}" data-track-index="0"><div id="scene-${i}" class="scene-body"><div class="topline"><span>AI VIDEO LAB</span><span>${String(i+1).padStart(2,'0')} / ${script.scenes.length}</span></div><h1>${e(s.heading)}</h1>${visualMarkup(visuals[i],s.waveform,i)}<div class="scene-note">${e(design.labels[i]||s.heading)}</div><div class="progress">${script.scenes.map((_,n)=>`<span class="${n<=i?'active':''}"></span>`).join('')}</div></div></section><audio id="voice-${i}" src="${s.audio}" data-start="${s.start}" data-duration="${s.duration-0.35}" data-track-index="1"></audio>`).join('');
 const captions=assets.scenes.flatMap(s=>s.cues.map(c=>`<div class="clip caption" data-start="${s.start+c.start}" data-duration="${Math.max(0.1,Math.min(c.duration,s.duration-c.start))}" data-track-index="2"><div>${e(c.text)}</div></div>`)).join('');
 return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><script src="gsap.min.js"></script><style>
@font-face{font-family:VideoFont;src:url('font.ttf')}*{box-sizing:border-box}body{margin:0;color:#f8fafc;background:#0b1324;font-family:VideoFont,sans-serif}#root{position:relative;width:100%;height:100%;overflow:hidden;--accent:${design.accent};background:#0b1324}.clip{position:absolute;inset:0}.scene-body{position:absolute;inset:140px 85px 550px;display:flex;flex-direction:column}.topline{display:flex;justify-content:space-between;color:var(--accent);font-size:28px;letter-spacing:3px;margin-bottom:65px}h1{margin:0;font-size:82px;line-height:1.1;overflow-wrap:anywhere}.visual{margin-top:55px}.process-grid{display:flex;flex-direction:column;align-items:center}.node{width:100%;min-height:105px;background:#182941;border:2px solid #31455f;border-radius:22px;display:flex;align-items:center;gap:28px;padding:25px 32px;font-size:42px}.node-number{font-size:28px;color:var(--accent);border-right:2px solid #47617e;padding-right:28px}.connector{font-size:42px;height:45px;color:var(--accent);line-height:1}.scene-note{font-size:30px;line-height:1.4;color:#b8c8db;margin-top:32px}.progress{display:flex;gap:14px;margin-top:35px}.progress span{height:8px;flex:1;background:#32445a;border-radius:4px}.progress span.active{background:var(--accent)}.audio-panel{border:2px solid #31455f;border-radius:28px;padding:35px;background:#182941}.panel-label{font-size:25px;color:#b8c8db;letter-spacing:2px}.waveform{display:flex;gap:5px;height:270px;align-items:center;justify-content:center}.beat{width:11px;border-radius:7px;background:var(--accent);flex-shrink:0}.audio-rail{display:flex;align-items:center;justify-content:space-between;font-size:32px;gap:15px}.audio-rail b{color:var(--accent)}.checklist{display:flex;flex-direction:column;gap:20px}.check-row{display:flex;align-items:center;gap:30px;border:2px solid #31455f;border-radius:24px;padding:35px 30px;font-size:39px;background:#182941}.check-icon{color:var(--accent);font-size:48px;width:60px;flex-shrink:0}.title-panel{padding:40px;background:#182941;border-radius:28px;display:flex;gap:35px;align-items:center}.big-index{font-size:130px;color:var(--accent)}.title-panel p{font-size:42px}.caption{inset:auto 85px 215px;height:300px;display:flex;align-items:center;text-align:center;font-size:41px;line-height:1.38}.caption div{background:#17263e;border-left:5px solid var(--accent);padding:25px 30px;border-radius:18px;width:100%}.footer{position:absolute;bottom:85px;left:85px;color:#b8c8db;font-size:25px}
</style></head><body><div id="root" data-composition-id="main" data-width="1080" data-height="1920" data-start="0" data-duration="${assets.duration}">${scenes}${captions}<div class="footer">Ý TƯỞNG → KỊCH BẢN → VIDEO</div></div><script>const tl=gsap.timeline({paused:true});${assets.scenes.map((s,i)=>`tl.fromTo('#scene-${i}',{opacity:0,y:20},{opacity:1,y:0,duration:0.5},${s.start});${['process','checklist'].includes(visuals[i].type)?`tl.fromTo('#scene-${i} .reveal',{opacity:0,x:-28},{opacity:1,x:0,stagger:0.22,duration:0.55},${s.start+0.5});`:''}`).join('')}window.__timelines['main']=tl;</script></body></html>`;
}

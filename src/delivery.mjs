import fs from 'node:fs/promises';import path from 'node:path';
export function subtitleTime(seconds){const ms=Math.round(seconds*1000);const h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;}
export function subtitles(assets){let n=0;return assets.scenes.flatMap(s=>s.cues.map(c=>`${++n}\n${subtitleTime(s.start+c.start)} --> ${subtitleTime(Math.min(s.start+s.duration,s.start+c.start+c.duration))}\n${c.text}\n`)).join('\n');}
export async function writeDelivery(dir,state){
 await fs.writeFile(path.join(dir,'subtitles.srt'),subtitles(state.assets));
 const formatSource=s=>typeof s==='string'?s:(s.url?s.url+(s.locator?` (${s.locator})`:''):`${s.id||'source'}${s.locator?` (${s.locator})`:''}`);
 const text=`# ${state.script.title}\n\n${state.script.scenes.map((s,i)=>`## ${i+1}. ${s.heading}\n\n${s.narration}`).join('\n\n')}\n\n## Nguồn\n\n${state.script.sources.map(s=>`- ${formatSource(s)}`).join('\n')}\n`;
 await fs.writeFile(path.join(dir,'script.md'),text);
}

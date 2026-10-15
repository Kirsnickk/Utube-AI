import {test} from 'node:test';import assert from 'node:assert/strict';
import {subtitleTime,subtitles} from '../src/delivery.mjs';import {landscapeComposition} from '../src/landscape.mjs';
test('delivery script.md formats sources without url cleanly without object stringification',async()=>{
 const {writeDelivery}=await import('../src/delivery.mjs');
 const os=await import('node:os');const path=await import('node:path');const fs=await import('node:fs/promises');
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'delivery-'));
 try{
  const state={script:{title:'T',scenes:[{heading:'H',narration:'N'}],sources:[{id:'src-1',locator:'10:00'},'plain-source-text']},
   assets:{duration:1,scenes:[{start:0,duration:1,cues:[{start:0,duration:1,text:'N'}]}]}};
  await writeDelivery(tmp,state);
  const text=await fs.readFile(path.join(tmp,'script.md'),'utf8');
  assert.ok(!text.includes('[object Object]'));
  assert.ok(text.includes('- src-1 (10:00)'));
  assert.ok(text.includes('- plain-source-text'));
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
test('SRT timing rolls milliseconds into the next minute and offsets scenes',()=>{assert.equal(subtitleTime(59.9999),'00:01:00,000');const s=subtitles({scenes:[{start:10,duration:5,cues:[{start:1,duration:2,text:'Xin chào'}]}]});assert.ok(s.includes('00:00:11,000 --> 00:00:13,000'));});
test('landscape scene contract keeps 16:9 canvas and timed audio',()=>{const s={title:'T',scenes:[{heading:'H'}]};const a={duration:5,scenes:[{heading:'H',start:0,duration:5,audio:'v.mp3',cues:[]}]};const d={accent:'#e7bf75',labels:['N'],scenes:[{type:'title',items:['A','B']}]};const html=landscapeComposition(s,a,d);assert.ok(html.includes('data-width="1920" data-height="1080"'));assert.ok(html.includes('src="v.mp3" data-start="0"'));});

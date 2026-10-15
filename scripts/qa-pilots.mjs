import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {readJSON,writeJSON,hash} from '../src/core.mjs';
import {mediaInfo,run,projectRoot} from '../src/media.mjs';
import ffmpeg from 'ffmpeg-static';
const sharp=createRequire(await fs.realpath(path.join(projectRoot,'node_modules/hyperframes/package.json')))('sharp');
const ids=process.argv.slice(2);if(!ids.length)ids.push('story-film-002','review-film-002');
const results=[];
for(const id of ids){
 assert.match(id,/^[\w-]+$/);
 const dir=path.join(projectRoot,'jobs',id),state=await readJSON(path.join(dir,'job.json'));
 const video=path.join(dir,'video.mp4'),info=await mediaInfo(video),duration=Number(info.format.duration);
 assert.equal(info.streams.find(s=>s.codec_type==='video').width,1920);
 assert.equal(info.streams.find(s=>s.codec_type==='video').height,1080);
 assert.equal(info.streams.find(s=>s.codec_type==='video').codec_name,'h264');
 assert.equal(info.streams.find(s=>s.codec_type==='audio').codec_name,'aac');
 assert.ok(Math.abs(duration-state.assets.duration)<0.1);
 assert.equal(hash(await fs.readFile(video)),state.videoHash);
 const srt=await fs.readFile(path.join(dir,'subtitles.srt'),'utf8');
 const seconds=t=>{const [h,m,s]=t.replace(',','.').split(':').map(Number);return h*3600+m*60+s;};
 const intervals=[...srt.matchAll(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g)].map(m=>[seconds(m[1]),seconds(m[2])]);
 assert.ok(intervals.length>0);let end=0;
 for(const [a,b] of intervals){assert.ok(a>=end-0.002&&b>a&&b<=duration);end=b;}
 const provenance=await readJSON(path.join(dir,'asset-provenance.json'));
 for(const a of provenance)assert.equal(hash(await fs.readFile(path.join(dir,a.localFile))),a.sha256);
 const html=await fs.readFile(path.join(dir,'index.html'),'utf8');assert.ok(!/<h1|class="caption"/.test(html));
 await run(ffmpeg,['-v','error','-i',video,'-f','null','-']);
 const times=[2,...state.assets.scenes.slice(1).flatMap(s=>[Math.max(0,s.start-0.2),s.start+0.4]),duration-2];
 const tiles=[];
 for(const [i,t] of times.entries()){
  const frame=path.join(process.env.TMPDIR||dir,`${id}-qa-${i}.png`);
  await run(ffmpeg,['-v','error','-y','-ss',String(t),'-i',video,'-frames:v','1','-vf','scale=480:270',frame]);
  const label=Buffer.from(`<svg width="480" height="28"><rect width="480" height="28"/><text x="10" y="21" fill="white" font-size="19">${id} / ${t.toFixed(2)}s</text></svg>`);
  tiles.push({input:await sharp(frame).extend({bottom:28,background:'black'}).composite([{input:label,left:0,top:270}]).toBuffer(),left:i%3*480,top:Math.floor(i/3)*298});await fs.unlink(frame);
 }
 await sharp({create:{width:1440,height:Math.ceil(times.length/3)*298,channels:3,background:'black'}}).composite(tiles).png().toFile(path.join(dir,'qa-contact.png'));
 const names=['video.mp4','index.html',...state.assets.scenes.flatMap(s=>[s.audio,s.audio+'.json'])];
 const before=await Promise.all(names.map(async n=>({name:n,mtime:(await fs.stat(path.join(dir,n))).mtimeMs,sha256:hash(await fs.readFile(path.join(dir,n)))})));
 const map=id.startsWith('story')?'examples/original-assets.json':'examples/review-assets.json';
 const rerun=await run(process.execPath,['src/cli.mjs','render-narrative',id,state.parentJob,map]);
 assert.ok(!/^assets$|^composition$|^render$/m.test(rerun));
 for(const f of before){assert.equal((await fs.stat(path.join(dir,f.name))).mtimeMs,f.mtime);assert.equal(hash(await fs.readFile(path.join(dir,f.name))),f.sha256);}
 assert.equal((await readJSON(path.join(dir,'job.json'))).agentCalls,state.agentCalls);
 const result={id,duration,width:1920,height:1080,videoCodec:'h264',audioCodec:'aac',subtitleCount:intervals.length,lastSubtitleEnd:end,assetCount:provenance.length,videoHash:state.videoHash,fullDecode:true,resumePreservedMediaBytesAndMtimes:true,agentCalls:state.agentCalls,contactSheet:'qa-contact.png',perceptualAudioReview:'not performed',checkedAt:new Date().toISOString()};
 await writeJSON(path.join(dir,'qa.json'),result);results.push(result);
}
await writeJSON(path.join(projectRoot,'research/pilot-qa.json'),results);
assert.equal(results.length,ids.length);console.log(JSON.stringify(results,null,2));

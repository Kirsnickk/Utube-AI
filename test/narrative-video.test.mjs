import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import * as bridge from '../src/narrative-video.mjs';
import {writeJSON,readJSON} from '../src/core.mjs';
function narrative(){return {id:'story',stage:'plan_review',agentCalls:3,usage:[],input:{mode:'original',premise:'Một câu chuyện mới'},bible:{characters:[{id:'an',name:'An'}]},script:{title:'Truyện',chapters:[1,2,3].map(i=>({title:'Chương '+i,scenes:[{id:'s'+i,visualBrief:'Cảnh đồng quê',lines:[{speakerId:'an',text:'Một lời thoại nguyên bản đủ dài.',kind:'dialogue',sourceIds:[]}]}]}))},storyboard:{shots:[1,2,3].map(i=>({sceneId:'s'+i,imagePrompt:'Đồng quê'}))}};}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9GkAAAAASUVORK5CYII=','base64');
test('bridge preserves narrative and resumes only identical input/asset bytes',async()=>{
 assert.equal(typeof bridge.prepareNarrativeVideo,'function','missing narrative-to-video bridge');
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'narrative-'));
 try{
  await writeJSON(path.join(root,'jobs/story/narrative.json'),narrative());
  await fs.mkdir(path.join(root,'assets'));await fs.writeFile(path.join(root,'assets/scene.png'),png);
  const map={shots:[1,2,3].map(i=>({sceneId:'s'+i,file:'assets/scene.png',provenance:{origin:'Original test illustration',rights:'Created for this test'}}))};
  const file=path.join(root,'map.json');await writeJSON(file,map);
  const dir=await bridge.prepareNarrativeVideo(root,'film','story',file);
  const job=await readJSON(path.join(dir,'job.json'));
  assert.equal(job.format,'landscape');assert.equal(job.agentCalls,0);
  assert.deepEqual(job.script.scenes.map(s=>s.sceneId),['s1','s2','s3']);
  assert.equal(job.script.scenes[0].lines[0].speakerId,'an');
  assert.deepEqual(job.design.sceneImages,['image-0.png','image-1.png','image-2.png']);
  assert.deepEqual(await readJSON(path.join(dir,'narrative.json')),narrative());
  const before=await fs.readFile(path.join(dir,'job.json'),'utf8');
  await bridge.prepareNarrativeVideo(root,'film','story',file);
  assert.equal(await fs.readFile(path.join(dir,'job.json'),'utf8'),before);
  job.script.scenes[0].narration='Lời đọc bị sửa sau khi tạo audio';await writeJSON(path.join(dir,'job.json'),job);
  await assert.rejects(bridge.prepareNarrativeVideo(root,'film','story',file),/changed|different/i);
  await fs.writeFile(path.join(dir,'job.json'),before);
  await fs.unlink(path.join(dir,'job.json')); // interruption before final manifest commit
  await bridge.prepareNarrativeVideo(root,'film','story',file);
  const review=narrative();review.input={mode:'review',premise:'Review tập 1',sources:[{id:'src',text:'Tư liệu tập phim thật. '.repeat(5),scope:'episode',locator:'32:00'}]};
  for(const c of review.script.chapters)for(const s of c.scenes)s.lines[0]={speakerId:'narrator',text:'Lời tóm tắt nội dung đã đối chiếu.',kind:'summary',sourceIds:['invalid']};
  await writeJSON(path.join(root,'jobs/bad/narrative.json'),review);
  await assert.rejects(bridge.prepareNarrativeVideo(root,'bad-film','bad',file),/source/i);
  const badScope=narrative();badScope.input={mode:'review',premise:'Review tập 1',sources:[{id:'src',text:'Tư liệu tập phim thật. '.repeat(5),scope:'catalog',locator:'none'}]};
  for(const c of badScope.script.chapters)for(const s of c.scenes)s.lines[0]={speakerId:'narrator',text:'Lời tóm tắt nội dung đã đối chiếu.',kind:'summary',sourceIds:['src']};
  await writeJSON(path.join(root,'jobs/bad-scope/narrative.json'),badScope);
  await assert.rejects(bridge.prepareNarrativeVideo(root,'bad-scope-film','bad-scope',file),/episode content sources with locators/i);
  await fs.writeFile(path.join(root,'assets/fake.png'),Buffer.from('not a real png header'));
  const badMap={shots:[1,2,3].map(i=>({sceneId:'s'+i,file:'assets/fake.png',provenance:{origin:'test',rights:'test'}}))};
  const badMapFile=path.join(root,'bad-map.json');await writeJSON(badMapFile,badMap);
  await assert.rejects(bridge.prepareNarrativeVideo(root,'bad-png-film','story',badMapFile),/PNG/i);
  await fs.appendFile(path.join(root,'assets/scene.png'),'changed');
  await assert.rejects(bridge.prepareNarrativeVideo(root,'film','story',file),/changed|different/i);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

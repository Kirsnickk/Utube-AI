import {test} from 'node:test';import assert from 'node:assert/strict';import {imageFirstComposition} from '../src/image-video.mjs';
test('image mode renders media without headings or burned-in captions',()=>{const html=imageFirstComposition({title:'TEXT TO OMIT'}, {duration:20,scenes:[{start:0,duration:20,audio:'voice-0.mp3',cues:[{text:'CAPTION TO OMIT'}]}]}, {images:['image-0.png']});assert.ok(html.includes('<img'));assert.ok(html.includes('<audio'));assert.ok(!html.includes('TEXT TO OMIT'));assert.ok(!html.includes('CAPTION TO OMIT'));assert.ok(!html.includes('<h1'));});
test('scene images stay bound to their narrative scene, without global rotation',()=>{
 const assets={duration:60,scenes:[{start:0,duration:30,audio:'voice-0.mp3'},{start:30,duration:30,audio:'voice-1.mp3'}]};
 const html=imageFirstComposition({},assets,{images:['image-0.png','image-1.png'],sceneImages:['image-1.png','image-0.png']});
 assert.deepEqual([...html.matchAll(/class="picture" src="([^"]+)"/g)].map(m=>m[1]),['image-1.png','image-1.png','image-1.png','image-0.png','image-0.png','image-0.png']);
 assert.throws(()=>imageFirstComposition({},assets,{images:['image-0.png'],sceneImages:['../secret.png']}),/scene/i);
});
test('image mode respects portrait format dimensions',()=>{
 const assets={duration:20,scenes:[{start:0,duration:20,audio:'voice-0.mp3'}]};
 const html=imageFirstComposition({},assets,{images:['image-0.png']},'portrait');
 assert.ok(html.includes('data-width="1080" data-height="1920"'));
});
test('image mode rejects external URLs and paths escaping the job',()=>{for(const src of ['https://example.com/a.png','../a.png'])assert.throws(()=>imageFirstComposition({}, {scenes:[]},{images:[src]}),/local/);});

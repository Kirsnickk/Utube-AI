import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateNarrativeInput,validateNarrativeScript,validateStoryboard} from '../src/narrative.mjs';
const bible={characters:[{id:'an'}]};
function script(){return {title:'T',chapters:[1,2,3].map(i=>({title:'C'+i,scenes:[{id:'s'+i,visualBrief:'Hình',lines:[{speakerId:'an',text:'Lời thoại',kind:'summary',sourceIds:['src1']}]}]}))};}
test('review requires usable source material before agent calls',()=>{assert.throws(()=>validateNarrativeInput({mode:'review',premise:'phim',sources:[]}),/source/);assert.equal(validateNarrativeInput({mode:'original',premise:'Truyện riêng'}).mode,'original');});
test('review script cannot cite nonexistent source or speaker',()=>{const s=script();assert.throws(()=>validateNarrativeScript(s,bible,{mode:'review',sources:[{id:'src2'}]}),/source/);s.chapters[0].scenes[0].lines[0].speakerId='invented';assert.throws(()=>validateNarrativeScript(s,bible,{mode:'original'}),/speaker/);});
test('storyboard covers every scene exactly once',()=>{const s=script();assert.throws(()=>validateStoryboard({shots:[{sceneId:'s1',imagePrompt:'p'},{sceneId:'s1',imagePrompt:'p'},{sceneId:'s3',imagePrompt:'p'}]},s),/duplicate/);assert.equal(validateStoryboard({shots:['s1','s2','s3'].map(sceneId=>({sceneId,imagePrompt:'Prompt'}))},s).shots.length,3);});

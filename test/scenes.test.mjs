import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeVisual,visualMarkup,compositionV2} from '../src/scenes.mjs';
import {audioFingerprint} from '../src/media.mjs';
test('untrusted agent design rejects executable/unknown scene kinds',()=>{
 assert.throws(()=>normalizeVisual({type:'script',items:['a','b']},'x','x'),/Unsupported/);
 assert.throws(()=>normalizeVisual({type:'process',items:['a',{}]},'x','x'),/strings/);
 const v=normalizeVisual({type:'checklist',items:['<script>alert(1)</script>','B']},'x','x');
 assert.ok(!visualMarkup(v,[],0).includes('<script>'));
});
test('old saved designs can render v2 with preserved media timing',()=>{
 const script={scenes:[{heading:'TTS tạo giọng đọc'}]};const assets={duration:5,scenes:[{heading:script.scenes[0].heading,start:0,duration:5,audio:'voice-0.mp3',cues:[{text:'Xin chào',start:1,duration:2}],waveform:[0.1,0.8]}]};
 const html=compositionV2(script,assets,{accent:'#00F0FF',labels:['Lời dẫn']});
 assert.ok(html.includes('data-duration="5"'));assert.ok(html.includes('VOICE / AUDIO THỰC TẾ'));assert.ok(html.includes('data-start="1" data-duration="2"'));assert.ok(html.includes('src="voice-0.mp3"'));
});
test('speech cache changes when narration or provider settings change',()=>{
 const t={backend:'gtts',voice:'vi'};assert.notEqual(audioFingerprint('câu cũ',t),audioFingerprint('câu mới',t));assert.notEqual(audioFingerprint('câu',t),audioFingerprint('câu',{...t,backend:'edge'}));
});

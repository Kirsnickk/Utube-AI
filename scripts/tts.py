import asyncio,json,sys,re,subprocess
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'.runtime/python'))
import edge_tts
async def main():
    text=Path(sys.argv[1]).read_text(encoding='utf-8')
    if len(sys.argv)>4 and sys.argv[4]=='gtts':
        from gtts import gTTS
        output=Path(sys.argv[2]); parts=[]; cues=[]; start=0
        sentences=re.split(r'(?<=[.!?])\s+',text)
        for i,sentence in enumerate(sentences):
            if not sentence.strip(): continue
            part=output.with_name(output.stem+f'-part-{i}.mp3')
            # Invocation follows a fingerprint cache miss; regenerate every part.
            gTTS(sentence,lang='vi',timeout=30).save(str(part))
            duration=float(subprocess.check_output([sys.argv[5],'-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(part)],text=True))
            parts.append(part); cues.append({'start':start,'duration':duration,'text':sentence}); start+=duration
        listing=output.with_suffix('.concat.txt')
        listing.write_text('\n'.join("file '"+str(p.resolve()).replace('\\','/')+"'" for p in parts),encoding='utf-8')
        subprocess.run([sys.argv[6],'-y','-v','error','-f','concat','-safe','0','-i',str(listing),'-c','copy',str(output)],check=True)
        Path(str(output)+'.json').write_text(json.dumps(cues,ensure_ascii=False),encoding='utf-8')
        return
    # Word boundaries from the service are grouped into readable caption lines.
    communicate=edge_tts.Communicate(text,sys.argv[3])
    cues=[]
    with open(sys.argv[2],'wb') as audio:
        async for chunk in communicate.stream():
            if chunk['type']=='audio': audio.write(chunk['data'])
            elif chunk['type']=='WordBoundary':
                start=chunk['offset']/10000000; end=start+chunk['duration']/10000000
                if cues and len(cues[-1]['text'])+len(chunk['text'])<65:
                    cues[-1]['text']+=' '+chunk['text']; cues[-1]['duration']=end-cues[-1]['start']
                else: cues.append({'start':start,'duration':end-start,'text':chunk['text']})
    Path(sys.argv[2]+'.json').write_text(json.dumps(cues,ensure_ascii=False),encoding='utf-8')
asyncio.run(main())

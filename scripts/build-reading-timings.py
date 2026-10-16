"""Estimate reading-word times from acoustic activity. No audio is changed."""
import json,pathlib,subprocess,re,numpy as np
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'dist/audio-manifest.json').read_text())
data=json.loads((root/'dist/lessons.json').read_text())
entries=[(f'phrase-{i}:answer',s) for i,s in enumerate(data['phrases'])]+[(f'adjective-{i}:answer',', '.join(s)) for i,s in enumerate(data['adjectives'])]+[(f'fil-phrase-{i}:answer',s) for i,s in enumerate(data['filipinoPhrases'])]
for key,text in entries:
 clip=manifest['clips'][key];path=root/'dist'/clip['src'].split('?')[0]
 pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','1','-ar','16000','-']),dtype='<f4')
 count=len(pcm)//160;energy=np.sqrt(np.mean(pcm[:count*160].reshape(-1,160)**2,axis=1))
 active=np.flatnonzero(energy>max(.004,float(energy.max())*.055));assert len(active),key
 tokens=re.findall(r'\S+',text)
 # Allocate speech-active time by word length; pauses remain at their true times.
 weights=np.array([max(2,len(re.sub(r'[^\w]','',w)))**.65 for w in tokens]);fractions=np.r_[0,np.cumsum(weights)/sum(weights)]
 points=[int(active[min(len(active)-1,int(f*(len(active)-1)))]) for f in fractions]
 words=[]
 for i,token in enumerate(tokens):
  start=points[i]*.01;end=(points[i+1]+1)*.01
  words.append({'text':token,'start':round(start,3),'end':round(end if i==len(tokens)-1 else points[i+1]*.01,3)})
 clip['words']=words;clip['wordTimingMethod']='estimated-acoustic-activity'
(root/'dist/audio-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'Added estimated word timings to {len(entries)} readings; audio unchanged.')

"""Split complete takes only at real silent pauses, never at ASR word edges.

ASR text is useful for alignment, but its word timings can drift substantially.
Globally match line breaks to distinct pauses; retain the entire source including
its final utterance. Refuse to split when there aren't enough safe pauses.
"""
import concurrent.futures, json, pathlib, re, subprocess, sys
import numpy as np

ROOT=pathlib.Path(__file__).resolve().parents[1]
STATE=pathlib.Path(sys.argv[1])
state=json.loads(STATE.read_text());jobs=state['jobs'];batches=state['batches']
OUT=ROOT/'dist/assets/audio';OUT.mkdir(parents=True,exist_ok=True)
def tokens(text):return re.findall(r'[^\W_]+',text.lower())
tasks=[];reports=[]
for b in batches:
 t=b['transcript'];assert not t.get('words_truncated'),f"Truncated transcript {b['index']}"
 assert tokens(b['prompt'])==tokens(t['text']),f"Transcript mismatch in batch {b['index']}"
 word_tokens=[]
 for w in t['words']:
  if w.get('type','word')=='word':word_tokens.extend((x,w['start'],w['end']) for x in tokens(w['text']))
 assert [x[0] for x in word_tokens]==tokens(b['prompt']),f"Word timing mismatch in batch {b['index']}"
 source=ROOT/'audio-production/masters'/f"batch-{b['index']:02d}.mp3"
 assert source.exists(),str(source)
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-ac','1','-ar','16000','-f','f32le','pipe:1'])
 pcm=np.frombuffer(raw,dtype=np.float32);duration=len(pcm)/16000
 detection=subprocess.run(['ffmpeg','-hide_banner','-i',str(source),'-af','silencedetect=noise=-42dB:d=0.06','-f','null','-'],capture_output=True,text=True,check=True).stderr
 gaps=[(float(end)-float(length),float(end)) for end,length in re.findall(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)',detection)]
 gaps=[(a,z) for a,z in gaps if a>.02 and z<duration-.02]
 # Reviewed pause patterns: comma-separated adjective forms have shorter
 # internal pauses than question/answer boundaries. Do not split those lists.
 min_pause={3:.4,4:.4,5:.42,6:.4,12:.35,13:.35,16:.35}.get(b['index'],.18)
 # Psalm line "Even though I walk" flows into the next line; its real pause
 # is only 75 ms, unlike the longer pauses elsewhere in that take.
 gaps=[(a,z) for a,z in gaps if z-a>=min_pause or (b['index']==17 and 29.07<a<29.09 and 29.15<z<29.16)]
 ranges=[];cursor=0
 for index in b['jobs']:
  n=len(tokens(jobs[index]['prompt']));assert n>0
  ranges.append((index,word_tokens[cursor][1],word_tokens[cursor+n-1][2]));cursor+=n
 assert cursor==len(word_tokens)
 targets=[(ranges[i-1][2]+ranges[i][1])/2 for i in range(1,len(ranges))]
 assert len(gaps)>=len(targets),(b['index'],'Not enough safe pauses',len(gaps),len(targets))
 # Ordered dynamic programming prevents two lines sharing the same pause and
 # rescues lists where recognition timestamps have cumulatively drifted.
 dp={(0,-1):(0,[])}
 for row,target in enumerate(targets):
  nxt={}
  for (_,prev),(score,path) in dp.items():
   for col in range(prev+1,len(gaps)-(len(targets)-row-1)):
    a,z=gaps[col];mid=(a+z)/2
    cost=score+(mid-target)**2
    key=(row+1,col)
    if key not in nxt or cost<nxt[key][0]:nxt[key]=(cost,path+[col])
  dp=nxt
 selected=min(dp.values(),key=lambda x:x[0])[1] if targets else []
 cuts=[0]+[sum(gaps[k])/2 for k in selected]+[duration]
 print(json.dumps({'batch':b['index'],'lines':len(ranges),'safePauses':len(gaps),'changes':[{'line':i,'text':jobs[ranges[i][0]]['text'],'oldTarget':round(t,3),'cut':round(cuts[i+1],3),'shift':round(cuts[i+1]-t,3)} for i,t in enumerate(targets) if abs(cuts[i+1]-t)>.35]}),flush=True)
 for i,(index,_,__) in enumerate(ranges):
  start,end=cuts[i],cuts[i+1]
  assert 0<=start<end<=duration+.05,(b['index'],index,start,end,duration)
  assert end-start>.12,(index,'implausibly short clip',end-start)
  file=f'jessica-{index:03d}.mp3'
  tasks.append((source,start,end,OUT/file,index))
  jobs[index].update(status='completed',sourceBatch=b['index'],start=round(start,4),end=round(end,4),src='assets/audio/'+file)
  reports.append({'index':index,'batch':b['index'],'start':start,'end':end,'text':jobs[index]['text'],'startSilence':gaps[selected[i-1]] if i else None,'endSilence':gaps[selected[i]] if i<len(selected) else None})
if '--check' in sys.argv:sys.exit(0)
def cut(task):
 source,start,end,out,index=task
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',f'atrim=start={start}:end={end},asetpts=PTS-STARTPTS,adelay=120,apad=pad_dur=0.18','-ac','1','-ar','44100','-codec:a','libmp3lame','-b:a','96k',str(out)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 assert out.stat().st_size>1000,(index,'empty clip')
 return index
only_batch=next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--only-batch=')),None)
render_tasks=tasks if only_batch is None else [t for t in tasks if t[0].stem==f'batch-{only_batch:02d}']
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(cut,render_tasks))
clips={}
for j in jobs:
 if j['language']=='la':continue
 src=f"assets/audio/jessica-{j['index']:03d}.mp3"
 assert (ROOT/'dist'/src).exists(),j['key']
 j.update(status='completed',src=src)
 for key in j['keys']:clips[key]={'src':src}
manifest={'version':2,'provider':'ElevenLabs','model':'eleven_v4','selectedVoice':'Jessica','voiceId':'cgSgspJ2msm6clMCkdW9','recordingStatus':'available-except-latin','supportedRecordedLanguages':['en-US','fil-PH','de-DE'],'unavailableLanguages':{'la':'Latin is not supported by this model. A verified Latin recording is still needed.'},'uniqueRecordings':sum(j['language']!='la' for j in jobs),'clips':clips}
(ROOT/'dist/audio-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
for j in jobs:j.pop('url',None)
provenance={'voice':'Jessica','voice_id':manifest['voiceId'],'model':'eleven_v4','takes':1,'flow_id':'MbDnjeuaxboyemT333vS','jobs':jobs,'batches':[{'index':b['index'],'node_id':b['node_id'],'generation_id':b['generation']['id'],'credits':b['generation'].get('price',{}).get('credits'),'transcription_id':b['transcript']['generation_id'],'transcriptMatched':True} for b in batches]}
(ROOT/'audio-production/jessica-jobs.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
(ROOT/'audio-production/clip-boundaries.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'verifiedBatches':len(batches),'splitClips':len(tasks),'totalRecordings':manifest['uniqueRecordings'],'clipKeys':len(clips),'latinUnavailable':sum(j['language']=='la' for j in jobs)}))

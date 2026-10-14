"""Check full source coverage and real silence at every repaired cut."""
import concurrent.futures, json, pathlib, subprocess
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'audio-production/clip-boundaries.json').read_text())
def decode(path):
 return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar','16000','-f','f32le','pipe:1']),dtype=np.float32)
for batch in range(22):
 pcm=decode(ROOT/f'audio-production/masters/batch-{batch:02d}.mp3')
 group=[r for r in rows if r['batch']==batch]
 assert group[0]['start']==0
 assert abs(group[-1]['end']-len(pcm)/16000)<.001
 for left,right in zip(group,group[1:]):
  assert left['end']==right['start'],'Lost or duplicated source audio'
  a,z=left['endSilence'];cut=left['end']
  assert a<cut-.025<cut+.025<z,'Cut too close to speech'
  samples=pcm[round((cut-.025)*16000):round((cut+.025)*16000)]
  assert np.max(np.abs(samples))<.011,(batch,cut,'Cut is not quiet')
def check(row):
 length=row['end']-row['start']
 if row['text'].startswith('What are the comparative'):
  assert 3<length<4.3,(row['index'],'Question swallowed a list word')
 elif 2<=row['batch']<=6 and ',' in row['text']:
  assert 2.2<length<3.5,(row['index'],'Three-word adjective list incomplete')
 pcm=decode(ROOT/f"dist/assets/audio/jessica-{row['index']:03d}.mp3")
 expected=row['end']-row['start']+.3
 assert abs(len(pcm)/16000-expected)<.005,(row['index'],'Incomplete rendered clip')
 assert np.sqrt(np.mean(pcm[:1200]**2))<.001,'Missing leading padding'
 assert np.sqrt(np.mean(pcm[-1600:]**2))<.001,'Missing trailing padding'
 return True
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 assert all(pool.map(check,rows))
print(f'PASS: {len(rows)} complete rendered clips; 22 full masters retained; every interior cut is quiet; leading/trailing padding intact.')

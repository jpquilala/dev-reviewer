import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {makeCards,audioEntries} from '../dist/core.mjs';
const root=new URL('../',import.meta.url), read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const data=read('dist/lessons.json'),manifest=read('dist/audio-manifest.json'),production=read('audio-production/jessica-jobs.json');
const all=[...new Map([...makeCards(data,'catholic'),...makeCards(data,'nonCatholic')].map(c=>[c.id,c])).values()];
for(const card of all)for(const part of card.parts||[]){
 const job=production.jobs.find(j=>j.language==='en-US'&&j.text===part);
 assert.ok(job?.src,'Missing anatomy audio: '+part);
 manifest.clips[`${card.id}:part:${part}`]={src:job.src};
}
const entries=audioEntries(all);let recorded=0,latin=0;
for(const e of entries){if(e.language==='la'&&!manifest.clips[e.key]){latin++;continue;}assert.ok(manifest.clips[e.key],'Missing clip '+e.key);recorded++;}
for(const key of ['cue:welcome','cue:finish','test:en-US','test:fil-PH','test:de-DE','test:la'])assert.ok(manifest.clips[key],key);
for(const [key,clip] of Object.entries(manifest.clips)){
 const path=clip.src.split('?')[0];
 assert.match(path,/^assets\/audio\/(?:jessica-\d{3}|sarah-latin-(?:\d{2}|build-\d+))\.mp3$/);
 const bytes=fs.readFileSync(new URL('dist/'+path,root));
 assert.ok(bytes.length>1000,'Empty audio '+key);
 clip.src=path+'?v='+createHash('sha256').update(bytes).digest('hex').slice(0,12);
}
assert.equal(new Set(Object.values(manifest.clips).map(c=>c.src)).size,530);
manifest.lessonAudioCoverage={recorded,total:entries.length,latinAwaitingRecording:latin};
assert.equal(latin,0,'All Latin answers must now have Sarah recordings');
manifest.version=5;
manifest.clipRevision='sarah-latin-2026-10-15';
fs.writeFileSync(new URL('dist/audio-manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(`PASS: ${recorded}/${entries.length} lesson prompts/answers recorded; ${latin} Latin answers explicitly pending; all cues, tests and anatomy taps covered by 530 local MP3s.`);

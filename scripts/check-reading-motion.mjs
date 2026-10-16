import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BuddyAudio} from '../dist/audio.mjs';
import {makeCards} from '../dist/core.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../dist/audio-manifest.json',import.meta.url)));
const data=JSON.parse(fs.readFileSync(new URL('../dist/lessons.json',import.meta.url)));
for(const c of makeCards(data).filter(c=>[2,3,14].includes(c.item))){
 const words=manifest.clips[c.id+':answer'].words;
 assert.deepEqual(words.map(w=>w.text),c.answer.match(/\S+/g));
 words.forEach((w,i)=>{assert.ok(w.end>w.start,c.id);if(i)assert.ok(w.start>=words[i-1].end,c.id);});
}
globalThis.window={speechSynthesis:{getVoices:()=>[],addEventListener(){},cancel(){}}};
globalThis.Audio=class{constructor(){this.currentTime=0;}play(){return Promise.resolve();}pause(){}};
const events=[],audio=new BuddyAudio(manifest,()=>{},e=>events.push(e));
const key='fil-phrase-3:answer',words=manifest.clips[key].words;
const playing=audio.play('ang aso at ang mga pusa','fil-PH',key,true);await Promise.resolve();
const media=audio.media;assert.equal(media.playbackRate,.85);
for(let i=0;i<words.length;i++){media.currentTime=(words[i].start+words[i].end)/2;media.ontimeupdate();assert.equal(events.at(-1).index,i);}
media.onended();assert.equal(await playing,true);assert.equal(events.at(-1).index,-1,'Final underline fades');
const replay=audio.play('ang aso at ang mga pusa','fil-PH',key);await Promise.resolve();
audio.media.currentTime=words[0].start;audio.media.ontimeupdate();assert.equal(events.at(-1).index,0,'Replay starts at first word');
audio.stop();assert.equal(await replay,false);assert.equal(events.at(-1).reset,true);
const count=events.length;media.ontimeupdate();assert.equal(events.length,count,'Old recording cannot highlight a new card');
console.log('PASS: all 87 word mappings, playback-clock timing, slow speed, replay, finish fade, cancellation, and stale events.');

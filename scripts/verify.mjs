import fs from 'node:fs';
import assert from 'node:assert/strict';
import {makeCards,chooseSession,copyDefaults,recordProgress,statusOf,audioEntries} from '../dist/core.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../dist/lessons.json',import.meta.url)));
const expected={words:49,phrases:31,adjectives:38,science:18,ethics:8,bible:5,german:7,shapes:8,numbers:10,animals:19,filipinoPhrases:18};
for(const [k,n] of Object.entries(expected))assert.equal(data[k].length,n,k);
for(const track of ['','catholic','nonCatholic']){
 const cards=makeCards(data,track);assert.equal(new Set(cards.map(c=>c.id)).size,cards.length,'unique IDs');
 assert.equal(cards.filter(c=>c.item===4).length,79);
 for(const c of cards){assert.equal(typeof c.answer,'string',c.id);assert.ok(c.answer.length,c.id);if(c.choices){assert.ok(c.choices.includes(c.correct),c.id);assert.equal(new Set(c.choices).size,c.choices.length,c.id);}
  if(c.asset)assert.ok(fs.existsSync(new URL('../dist/assets/'+c.asset+'.webp',import.meta.url)),c.asset);
  if(c.diagram)assert.ok(fs.existsSync(new URL('../dist/assets/'+c.diagram+'.webp',import.meta.url)),c.diagram);
 }
 assert.equal(cards.find(c=>c.id==='science-4').correct,'Invertebrates');
 if(track){assert.equal(cards.filter(c=>c.item===8&&!c.supplement).length,13);assert.equal(cards.filter(c=>c.item===9).length,5);assert.ok(cards.find(c=>c.id==='bible-1-'+track).answer.includes(track==='catholic'?'six':'nine'));}
 else assert.equal(cards.filter(c=>[8,9].includes(c.item)).length,0);
 assert.equal(copyDefaults().length,0);
 const session=chooseSession(cards,{}, {...copyDefaults(),length:8});assert.equal(session.length,8);assert.deepEqual(session.map(c=>c.answer),['stick','quack','quick','pick','rack','lock','check','clock']);
 const settings={...copyDefaults(),length:8,track};const seen=[];const ordered=cards.filter(c=>!c.supplement);
 const mixedProgress=Object.fromEntries(cards.map((c,i)=>[c.id,{views:i%3,needsHelp:i%2===0,last:999-i}]));
 while(seen.length<ordered.length){const batch=chooseSession(cards,mixedProgress,settings);seen.push(...batch.map(c=>c.id));settings.reviewerAfter={[track||'none']:batch.at(-1).id};}
 assert.deepEqual(seen.filter(id=>!id.startsWith('after-')),ordered.filter(c=>c.item!==4).map(c=>c.id),'Non-math reviewer order preserved');assert.equal(new Set(seen).size,ordered.length,'Resume never skips or repeats questions');assert.deepEqual([...seen].sort(),ordered.map(c=>c.id).sort());
 assert.equal(chooseSession(cards,mixedProgress,settings)[0].id,'word-0','Completed reviewer restarts');
 assert.equal(chooseSession(cards,{}, {...copyDefaults(),enabled:[2]})[0].id,'phrase-0');
 assert.deepEqual(chooseSession(cards,{}, {...copyDefaults(),length:0}).map(c=>c.id).sort(),ordered.map(c=>c.id).sort(),'No limit includes the complete reviewer');
 assert.equal(chooseSession(cards,{}, {...copyDefaults(),length:0},1).length,49,'No limit works for subject practice');
 assert.equal(chooseSession(cards,{}, {...copyDefaults(),enabled:[]}).length,0);
 const math=cards.filter(c=>c.item===4);for(const c of math)assert.equal(Number(c.answer),c.number+1);
}
let p=recordProgress({},'test','view');assert.equal(statusOf(p.test),'Practiced');p=recordProgress(p,'test','help');assert.equal(statusOf(p.test),'Needs another try');p=recordProgress(p,'test','correct');assert.equal(statusOf(p.test),'Recognized independently');p=recordProgress(p,'test','parent');assert.equal(statusOf(p.test),'Parent checked');
const cards=makeCards(data,'catholic');const prayerProgress=Object.fromEntries(cards.filter(c=>c.item===8&&c.line<=8).map(c=>[c.id,{views:1}]));assert.equal(chooseSession(cards,prayerProgress,copyDefaults(),8)[0].line,9);
const all=[...new Map([...cards,...makeCards(data,'nonCatholic')].map(c=>[c.id,c])).values()];const script=audioEntries(all);assert.equal(script.length,all.length*2);fs.writeFileSync(new URL('../dist/audio-scripts.json',import.meta.url),JSON.stringify({title:'Kinder Review Buddy',entries:script},null,2));
console.log('PASS: content counts, unique cards, both religion tracks, maths, answer matching, assets, progress, session selection and audio scripts.');

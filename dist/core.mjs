export const subjects = [
 {id:1,title:'1. English Reading',subtitle:'Little words, big discoveries',icon:'🌱',tint:'#eaf2df',tag:'ENGLISH · WORDS',group:'English'},
 {id:2,title:'2. English Reading',subtitle:'Let’s read a little more',icon:'📖',tint:'#faecdf',tag:'ENGLISH · PHRASES',group:'English'},
 {id:3,title:'3. English Grammar',subtitle:'Tall, taller, tallest!',icon:'🌳',tint:'#e4efe2',tag:'ENGLISH · GRAMMAR',group:'English'},
 {id:4,title:'4. Mathematics',subtitle:'What number comes next?',icon:'🔢',tint:'#e7eefb',tag:'MATH · 131–210',group:'Explore'},
 {id:5,title:'5. Science',subtitle:'Meet some amazing animals',icon:'🦋',tint:'#f6e8ed',tag:'SCIENCE · DISCOVER',group:'Explore'},
 {id:6,title:'6. Social Studies',subtitle:'Places near the Philippines',icon:'🌏',tint:'#e5f1f0',tag:'SOCIAL STUDIES',group:'Explore'},
 {id:7,title:'7. Ethics',subtitle:'Learn to help and care',icon:'🤝',tint:'#fff0d8',tag:'ETHICS · KINDNESS',group:'Explore'},
 {id:8,title:'8. Religion',subtitle:'One line at a time',icon:'🕊️',tint:'#eeeafb',tag:'RELIGION · RECITE',group:'Religion'},
 {id:9,title:'9. Religion',subtitle:'Discover the books of the Bible',icon:'📚',tint:'#ede8f4',tag:'RELIGION · QUESTIONS',group:'Religion'},
 {id:10,title:'10. German',subtitle:'Seven new words to say',icon:'💬',tint:'#fff2d9',tag:'GERMAN · WORDS',group:'Languages'},
 {id:11,title:'11. Filipino',subtitle:'Kilalanin ang mga hugis',icon:'🔶',tint:'#fbead9',tag:'FILIPINO · SHAPES',group:'Languages'},
 {id:12,title:'12. Filipino',subtitle:'Magbilang tayo hanggang sampu',icon:'🍎',tint:'#f8e8e1',tag:'FILIPINO · NUMBERS',group:'Languages'},
 {id:13,title:'13. Filipino',subtitle:'Anong hayop ito?',icon:'🐸',tint:'#e9f1df',tag:'FILIPINO · ANIMALS',group:'Languages'}
];
export const defaults={track:'',length:0,pause:8,slow:false,auto:false,mode:'learn',enabled:subjects.map(s=>s.id)};
export const copyDefaults=()=>({...defaults,enabled:[...defaults.enabled]});
export function makeCards(d,track=''){
 const a=[];const push=(item,id,type,prompt,answer,extra={})=>a.push({item,id,type,prompt,answer,promptLang:'en-US',answerLang:'en-US',...extra});
 d.words.forEach((x,i)=>push(1,`word-${i}`,'word','Read this word.',x.word,{pattern:x.pattern}));
 d.phrases.forEach((x,i)=>push(2,`phrase-${i}`,'phrase','Read this phrase.',x));
 d.adjectives.forEach((x,i)=>push(3,`adjective-${i}`,'adjective',`What are the comparative and superlative forms of ${x[0]}?`,x.join(', '),{triple:x,choices:[x[2],...d.adjectives.filter(y=>y[0]!==x[0]).slice(i%20,i%20+2).map(y=>y[2])],correct:x[2]}));
 const math=[136,154,198,209,...Array.from({length:79},(_,i)=>131+i).filter(x=>![136,154,198,209].includes(x))];
 math.forEach(n=>push(4,`after-${n}`,'math',`What is the number after ${n}?`,String(n+1),{number:n,choices:[String(n),String(n+1),String(n+2)],correct:String(n+1)}));
 d.science.forEach((x,i)=>{
  const diagram=x.diagram?.animal||x.diagram?.type||(typeof x.diagram==='string'?x.diagram:null)||(x.question.toLowerCase().includes('wasp')?'wasp':x.question.toLowerCase().includes('butterfly')?'butterfly':null);
  const choices=x.choices?.map(c=>typeof c==='string'?c:String(c));
  const normalize=v=>v.toLowerCase().replace(/[.!]/g,'').trim();
  push(5,`science-${i}`,'question',x.question,x.answer,{icon:x.icon,diagram,parts:x.parts,choices,correct:choices?.find(c=>normalize(x.answer)===normalize(c))});
  if(x.parts)for(const part of x.parts)push(5,`science-${i}-part-${part}`,'anatomy',`What is this part of the ${diagram}?`,part,{diagram,part,parts:x.parts,supplement:true});
 });
 push(6,'neighbors-all','countries','Name some neighbor countries of the Philippines.',d.countries.join(', ')+'.',{countries:d.countries});
 [d.countries.slice(0,3),d.countries.slice(3,5),d.countries.slice(5)].forEach((group,i)=>push(6,`neighbors-${i}`,'countries','Say these neighbor countries with me.',group.join(', ')+'.',{countries:group,supplement:true}));
 d.ethics.forEach((x,i)=>push(7,`ethics-${i}`,'question',x.question,x.answer,{icon:'🤝',...(x.question.startsWith('Is it')?{choices:['Yes, it is.',"No, it isn’t."],correct:"No, it isn’t."}:{})}));
 if(track){
  const lines=d.prayers[track];
  lines.forEach((line,i)=>push(8,`prayer-${track}-${i}`,'prayer',`Your turn. Say line ${i+1}.`,line,{line:i+1,track,answerLang:track==='catholic'?'la':'en-US'}));
  push(8,`prayer-${track}-full`,'prayerFull',track==='catholic'?'Recite the Our Father in Latin.':'Recite Psalm twenty-three, verses one to four.',lines.join('\n'),{track,answerLang:track==='catholic'?'la':'en-US',supplement:true});
  [2,4,6,8,10,13].forEach(n=>push(8,`prayer-${track}-build-${n}`,'prayerFull',`Let’s practice the first ${n} lines together.`,lines.slice(0,n).join('\n'),{track,build:n,answerLang:track==='catholic'?'la':'en-US',supplement:true}));
  d.bible.forEach((x,i)=>{const alt=track==='catholic'?x.answerCatholic:x.answerNonCatholic;push(9,`bible-${i}${alt?'-'+track:''}`,'question',x.question,alt||x.answer,{icon:'📖'});});
 }
 d.german.forEach((x,i)=>push(10,`german-${i}`,'german',`What is ${x.english} in German?`,x.german,{english:x.english,answerLang:'de-DE'}));
 d.shapes.forEach((x,i)=>push(11,`shape-${i}`,'shape','Anong hugis ito?',x.name,{shape:x.kind,promptLang:'fil-PH',answerLang:'fil-PH',choices:[x.name,d.shapes[(i+2)%8].name,d.shapes[(i+5)%8].name],correct:x.name}));
 d.numbers.forEach((x,i)=>push(12,`fil-number-${i}`,'number','Anong bilang ito?',x,{number:i+1,promptLang:'fil-PH',answerLang:'fil-PH',choices:[x,d.numbers[(i+3)%10],d.numbers[(i+7)%10]],correct:x}));
 d.animals.forEach((x,i)=>push(13,`animal-${i}`,'animal','Anong hayop ito?',x.name,{asset:x.name,icon:x.emoji,promptLang:'fil-PH',answerLang:'fil-PH',choices:[x.name,d.animals[(i+3)%19].name,d.animals[(i+9)%19].name],correct:x.name}));
 return a;
}
export function chooseSession(cards,progress,settings,subject=0){
 if(!subject){
  const ordered=cards.filter(c=>!c.supplement).sort((a,b)=>a.item-b.item);
  const after=ordered.findIndex(c=>c.id===settings.reviewerAfter?.[settings.track||'none']);
  const enabled=c=>settings.enabled.includes(c.item);
  const remaining=ordered.slice(after+1).filter(enabled);
  return (remaining.length?remaining:ordered.filter(enabled)).slice(0,settings.length===0?undefined:settings.length);
 }
 let pool=cards.filter(c=>(subject?c.item===subject:settings.enabled.includes(c.item))&&!c.supplement);
 const score=c=>{const p=progress[c.id];if(!p)return 1;return p.needsHelp?0:p.parentChecked?4:p.correct>0?3:2;};
 if(subject===8)pool.sort((a,b)=>Number(Boolean(progress[a.id]?.views))-Number(Boolean(progress[b.id]?.views))||(a.line||100)-(b.line||100));
 else if(subject)pool.sort((a,b)=>score(a)-score(b)||(progress[a.id]?.last||0)-(progress[b.id]?.last||0));
 return pool.slice(0,settings.length===0?undefined:settings.length);
}
export function recordProgress(progress,id,kind){const p=progress[id]||{views:0,correct:0,needsHelp:false,parentChecked:false,last:0};const next={...p,last:Date.now()};if(kind==='view')next.views++;if(kind==='correct'){next.correct++;next.needsHelp=false;}if(kind==='help')next.needsHelp=true;if(kind==='parent')next.parentChecked=!next.parentChecked;return {...progress,[id]:next};}
export function statusOf(p){if(!p)return 'New';if(p.parentChecked)return 'Parent checked';if(p.needsHelp)return 'Needs another try';if(p.correct)return 'Recognized independently';return 'Practiced';}
export function audioEntries(cards){const found=new Map();for(const c of cards)for(const part of ['prompt','answer']){const key=c.id+':'+part;found.set(key,{key,item:c.item,language:c[part+'Lang'],text:c[part]});}return [...found.values()];}

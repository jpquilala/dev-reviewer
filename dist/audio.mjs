import {spokenWordAt} from './reading-motion.mjs';
export class BuddyAudio{
 constructor(manifest,onState,onWord=()=>{}){this.onWord=onWord;this.frame=null;this.manifest=manifest;this.onState=onState;this.generation=0;this.media=null;this.speech=null;this.waiters=[];this.voices=[];this.refresh();if('speechSynthesis'in window)window.speechSynthesis.addEventListener('voiceschanged',()=>this.refresh());}
 refresh(){this.voices=window.speechSynthesis?.getVoices()||[];}
 stop(){this.generation++;if(this.frame!==null)globalThis.cancelAnimationFrame?.(this.frame);this.frame=null;this.onWord({reset:true});this.media?.pause();this.media=null;window.speechSynthesis?.cancel();this.speech=null;this.waiters.splice(0).forEach(f=>f(false));this.onState('idle');}
 languageVoice(lang){const codes=lang.startsWith('fil')?['fil','tl']: [lang.split('-')[0]];return this.voices.find(v=>codes.includes(v.lang.toLowerCase().split('-')[0]));}
 canSpeak(lang,key){return Boolean(this.manifest.clips?.[key]||this.languageVoice(lang));}
 async play(text,lang='en-US',key='',slow=false){
  this.stop();const token=this.generation;const clip=this.manifest.clips?.[key];this.onState('playing');
  return new Promise(resolve=>{
   let settled=false;let timeout;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timeout);this.waiters=this.waiters.filter(x=>x!==finish);if(token===this.generation){if(this.frame!==null)globalThis.cancelAnimationFrame?.(this.frame);this.frame=null;this.onWord({key,index:-1,reset:!ok});this.onState(ok?'idle':'error');}resolve(ok);};this.waiters.push(finish);
   if(clip){const media=new Audio(clip.src);this.media=media;media.playbackRate=slow?.85:1;media.onended=()=>finish(true);media.onerror=()=>finish(false);media.onloadedmetadata=()=>{if(clip.start)media.currentTime=clip.start;};let last=-2;const updateWord=()=>{if(token!==this.generation||settled)return;const index=spokenWordAt(clip.words,media.currentTime);if(index!==last){last=index;this.onWord({key,index});}};const animate=()=>{if(token!==this.generation||settled)return;updateWord();if(globalThis.requestAnimationFrame)this.frame=globalThis.requestAnimationFrame(animate);};media.ontimeupdate=()=>{updateWord();if(clip.end&&media.currentTime>=clip.end){media.pause();finish(true);}};media.play().then(()=>{if(token===this.generation&&!settled)animate();}).catch(()=>finish(false));timeout=setTimeout(()=>finish(false),Math.max(60000,text.length*180));return;}
   this.refresh();const voice=this.languageVoice(lang);
   if(!voice||!('speechSynthesis'in window)){this.onState('unavailable',lang);settled=true;this.waiters=this.waiters.filter(x=>x!==finish);resolve(false);return;}
   const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.voice=voice;u.rate=slow?.68:.83;u.pitch=1;u.onboundary=e=>{if(token!==this.generation||e.name!=='word')return;const matches=[...text.matchAll(/\S+/g)];const index=matches.findIndex(m=>e.charIndex>=m.index&&e.charIndex<m.index+m[0].length);this.onWord({key,index});};u.onend=()=>finish(true);u.onerror=()=>finish(false);this.speech=u;window.speechSynthesis.speak(u);timeout=setTimeout(()=>finish(false),Math.max(60000,text.length*180));
  });
 }
}

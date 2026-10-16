// Timings follow the recording clock, including slower playback and replay.
export function spokenWordAt(words,time){
 return (words||[]).findIndex(w=>time>=w.start&&time<w.end);
}

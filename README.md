# Kinder Review Buddy

Kindergarten oral-review app based on the supplied Test 7 handout and enrichment slides.

The app includes all requested sections 1–14, both religion options, guided and per-lesson sessions, repeat/recall modes, checks for suitable answers, local progress, and adult settings. Item 14 includes all 18 Filipino phrases in printed column order. Existing installations enable this newly added lesson once while preserving other settings. No microphone recordings or automated speech grading are used.

The home “Let’s start” button follows the reviewer’s numbered subject order and the stored printed order within each subject. Short sessions resume after the last completed card, with a separate place for each religion track. Existing practice scores do not reorder this queue, and help does not insert repeats. Disabled subjects are skipped; completing the reviewer returns to its beginning. Reset progress also resets the saved review position. Individual subject practice retains its focused practice behavior.

## Audio status

Grown-ups → Practice rhythm → Activities per session includes “No activity limit (parent decides)”. It queues all remaining eligible reviewer activities (or the full selected subject) instead of stopping after 5, 8, or 12. “Take a break” stops playback and offers a return home; completed reviewer progress is saved and the unfinished card resumes next time. Completing the entire available reviewer still shows its completion screen. No activity limit is the default. Older saved limits are migrated once; parents can subsequently choose 5, 8, or 12 and keep that preference.

Jessica (`cgSgspJ2msm6clMCkdW9`) is connected through the official ElevenLabs account. The app includes 530 reusable local MP3 recordings for English, Filipino, German and Latin, including welcome/finish cues and language tests. User requested one take per lesson line. Item 14 uses complete individual takes, with no cropping. Replay serves the saved files and does not call ElevenLabs.

The manifest covers all 702 lesson prompt/answer entries. Sarah (`EXAVITQu4vr4xnSDxMaL`) narrates the Catholic Latin Our Father using 13 individual complete takes, with full and progressive playback assembled without cropping. The user selected Sarah after a preview. Latin is not an officially supported model language; pronunciation has not been teacher-verified, as noted in adult settings. Jessica continues to narrate the other lessons.

The 473 clips split from 22 grouped takes were repaired after ASR word timings caused mid-word cuts and incomplete/misassigned lines. The splitter now matches ordered line boundaries to real silent pauses, distinguishes comma-list pauses from sentence pauses, and retains each complete master through its final sample. Clips have 120 ms leading and 180 ms trailing padding. Original transcripts verify source text, not individual clip completeness. The remaining 19 recordings are individual cues, tests and initial word clips. Original grouped recordings and segmentation provenance are retained under `audio-production/` and are not deployed as site assets. Production uses individual local MP3s with content-hash cache-busting URLs rather than expiring ElevenLabs URLs. No additional speech generation was used for this repair.

Run `node scripts/finalize-jessica.mjs` after rebuilding the clip bank to populate all diagram-part aliases and verify coverage. The Python clipping script accepts a local generation-state JSON; do not rerun paid generation to rebuild clips.

## Verification

`node scripts/verify.mjs` validates the content, answer matching, religion isolation, number range, asset references, progress rules, and generates the script bank. `node scripts/interaction-check.mjs` exercises screen generation and interactions using a minimal DOM/audio harness, including the recorded-audio path. `node scripts/check-recorded-audio.mjs` checks playback cancellation, replay, slow speed, stale events, Latin recording playback, and unavailable-language fallback. These are not browser or visual QA.

This environment does not expose the required control-browser skill. No preview server or alternative browser-control path was used. Target-phone testing remains required for audio, layout, interruptions, and an end-to-end session.

`python scripts/check-clip-boundaries.py` checks every repaired cut is inside a real quiet interval, all source audio is retained without gaps or overlaps, and every rendered clip decodes with its expected complete duration and padding. This signal-level check is not a listening or fresh speech-recognition test.

## Content notes

The numbered handout defines scope. The full supplied slides are not bundled publicly. Extracted pictures are included in this app. Source references and discrepancies are preserved in `dist/lessons.json` and displayed in adult settings. Squid anatomy uses eight arms and two tentacles; the Psalm opening uses the slide's correct “I shall not want.”

## Data

Progress is stored in the current browser under `kinder-buddy-v1`. The parent area offers an export and deliberate reset. Religion-specific recitation and Old Testament answers have separate IDs; shared lessons keep their progress when switching options.

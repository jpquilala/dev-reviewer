# Deploy Kinder Review Buddy to Vercel

This archive contains the source for published version 7, including all saved audio, images, lesson data, and audio-production masters. The editable application source is directly in dist/; no bundler or framework is required.

## Deploy through GitHub
1. Extract the ZIP.
2. Create a GitHub repository and push the contents of the extracted kinder-review-buddy folder. Keep vercel.json and dist/ at the repository root.
3. In Vercel, choose Add New → Project and import that repository.
4. Use Framework Preset: Other; Output Directory: dist; leave Build Command and Install Command empty. The included vercel.json sets these values.
5. Deploy. Test audio and saved progress on your target devices.

## Deploy using the CLI
With Node.js installed, open a terminal in the extracted project folder and run:

    npx vercel

Sign in, link or create your Vercel project, and follow its prompts. To publish production:

    npx vercel --prod

## Local preview
    python3 -m http.server 8080 --directory dist

Open http://localhost:8080. Do not open index.html with a file:// URL because the app fetches JSON data.

## Files
- dist/app.mjs: screens, settings, interactions, local progress.
- dist/core.mjs: subjects, lesson cards, ordering, session selection.
- dist/audio.mjs: audio playback.
- dist/style.css: styling.
- dist/lessons.json: reviewer content.
- dist/audio-manifest.json and dist/assets/: saved audio and images.
- scripts/: checks and audio-processing utilities.
- audio-production/: original grouped takes and clip provenance, not deployed.

No ElevenLabs key, OpenAI key, database, or backend is needed to run this version. Audio playback uses included MP3 files. Latin recordings remain unavailable as documented in README.md. Audio rebuilding requires the original generation-state JSON, which is not part of this repository export; the ready-to-play clips and masters are included.

Progress and parent settings are stored in the browser per website origin. Your existing ChatGPT-hosted site's progress will not automatically transfer to the new Vercel domain. The existing hosted site remains unchanged.

Only dist/ is published. Git history and ChatGPT hosting configuration are omitted from this portable export.

Vercel references:
https://vercel.com/docs/project-configuration/vercel-json
https://vercel.com/docs/builds/configure-a-build

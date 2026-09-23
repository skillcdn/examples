# Editing decisions: video model or code

Every element of the reference gets a build route in the analysis brief: **generate** (the video model makes it), **edit** (code in the sandbox makes it), or **drop**. This page is the rule book. When a case is not covered, prefer code: it is free, exact and repeatable, and a take can always be re-edited without spending credits.

The reference video itself is never a build material. No frame, clip, still or sound from it is uploaded as a model input, used as a start frame, a reference or a motion source, or cut into the output. The brief describes it in words, and the words drive the build.

## Always code

| Element | Why |
|---|---|
| Captions and subtitles | Must show the intended line exactly; models misspell and drift. |
| Titles, stickers, prices, calls to action, any on-screen text | Same reason. Text is set in the brand's type ([design.md](design.md)), not hallucinated. |
| Frames, borders, split screens, rounded masks, letterboxing | Geometry is deterministic in ffmpeg. |
| Logos and product packshots as overlays | The real asset, pixel-exact, from the product's site or the user's upload. |
| App screens, search boxes, chat bubbles, phone interfaces | Composed in code from the product's own screenshots, or drawn as a still in the style line and overlaid; models garble interface text. |
| End cards | Composed as a layout in the brand's type and colors ([design.md](design.md)), lightly animated; no reason to generate. |
| Music bed | Licensed or user-supplied track, mixed with ducking under speech. |
| Freeze frames, speed ramps, zooms on a still frame | Pure post-production. |
| Transitions between shots (cut, dip to black, whip) | Concatenation and filters. |

## Usually the model

| Element | Why | Exception |
|---|---|---|
| A person speaking on camera, or a voice-over | Lip sync, performance and narration come from the model's native audio. No text-to-speech, no dubbing, no voice tools. | None. A voice-over is prompted as an off-screen voice in the take it plays under. |
| The same character across shots | The approved portrait as the identity input of every shot with that character, or as the source of each first frame, plus the same clothing and traits in every prompt ([cast](cast.md)). | |
| Continuous camera moves within one shot | Cannot be faked from stills. | |
| A character doing something with the product | Motion must be generated. | The product's exact label or text: cover it with a packshot overlay in the edit if the model gets it wrong. |
| Diegetic sound tied to an action (a pour, a click, a door) | Native audio matches timing. | If the take's sound is wrong, replace it with a sound effect in the edit rather than regenerating. |

## Judgment calls

| Situation | Choice | Why |
|---|---|---|
| Two shots of the same character where continuity matters (mid-gesture, same sentence across a cut) | Generate as one longer shot, cut in code | Models keep identity within a generation better than across two. |
| Two shots of different framings or scenes | Two separate generations, concatenate in code | Cheaper to regenerate one; a hard cut is natural for shorts. |
| A cut inside a shot of the reference (jump cut for pace) | One generation, then cut in code | Cutting is free. |
| Picture-in-picture: an inset video playing over the main shot | Generate the inset only if it must be new footage; otherwise use a user-supplied clip or a still, composited in code | The model cannot place an inset accurately. |
| A sound effect that is comedic or emphatic (record scratch, ding) | Code, from a user-supplied effect or one synthesized in the sandbox with sox (a sine ding, a filtered-noise whoosh) | Models rarely produce it on cue, and the server's audio tool makes speech only. |
| Music that is heard in the reference | Never from the reference itself (rights). A user-supplied licensed track, mixed in code. The server has no music generation, so without a track the ad runs on native audio and effects, and the plan says so | Rights and control. |
| Ambient sound (street, café) | Model native audio if the shot has it; otherwise a user-supplied bed, or room tone synthesized with sox, in the edit | Native ambience is free with the take. |
| Speech that is slightly off in a good take | Trim around it, cut to a beat, cover with an effect | Cheaper than a retry; see [regeneration](regeneration.md). |
| A shot that needs the exact product | Give the model the product image as a reference input where the model supports it; verify against the image; overlay a packshot in the edit if the label is wrong | Identity inputs help but do not guarantee text on packaging. |

## Sandbox conventions

- One self-contained script does the whole assembly: download takes, fonts and assets, cut, filter, mix, mux, probe, upload. Run it with `background: true` and poll its log; an encode of a whole ad plus its uploads exceeds the foreground transport timeout. The sandbox is discarded between calls and recycled during long waits, so the script fetches everything it needs itself.
- Reserve the output with `media_upload` before the script, and end the script with the PUT of the finished file, with the `Content-Type` header the upload result names. Call `media_confirm` only after HTTP 200.
- Prepare the assembly while the last take renders: rasterize the logo, synthesize the effects with sox, fetch the font, write and syntax-check the script. The assembly then starts within a minute of the last verdict.
- A take generated with audio off has no audio stream at all, not a silent one. Give it a room-tone or silent track (`anullsrc`, or sox noise low-passed) before concatenation, or the concat drops audio.
- Text is drawn from files with `drawtext` and `expansion=none`, which avoids escaping punctuation in non-Latin text; `amix` with `normalize=0` keeps the levels that were set; a dip to white is two fades around a cut, which the concat demuxer accepts.
- Verify beyond `ffprobe`: per-second loudness of the master (speech where it should be, nowhere else), a 1 fps contact sheet, and a strip of frames at every text moment, since the agent cannot play video.
- Keep synthetic accents (a chime, a thump, a whoosh) clear of the first word of a line: the caption step finds speech onsets in the loudness curve, and an effect on top of an onset reads as speech.
- Work at the take's native resolution; do not upscale drafts. Output 9:16 H.264 with AAC audio.
- Keep the caption burn as a separate step on the clean master ([captions](captions.md)), so a caption fix never touches the edit.
- Fonts for text overlays: use the caption fonts preinstalled in the sandbox or fetch a font the user is licensed to use. Check that the font covers the language's script before rendering.

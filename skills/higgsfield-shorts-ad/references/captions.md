# Captions

Captions show the **intended line**. Speech-to-text supplies the **clock**. Never burn a raw transcript.

## Why not the transcript

A model speaks the line it was given, mostly. Speech-to-text then hears the line, mostly. Burning what was heard doubles the error: a brand name becomes a common word, a number changes, a filler word appears. The intended line is what the user approved in the shot list, so it is what the caption says. If the take does not actually say the intended line, that is a regeneration question ([regeneration.md](regeneration.md)), not a caption question.

## Pipeline

Four steps, in one `sandbox_exec` call on the clean master, in this order. Skipping the verification step is how captions drift.

1. **Transcribe** the clean master's audio with Whisper, word timestamps on, voice activity detection on, language set to the dialogue language. On a mixed track (music under speech), band-pass the voice range first or transcribe the pre-mix speech stems if the edit kept them.
2. **Align** each intended line to the transcript: match line by line in order, take the first and last word times of the matched span as the cue window, then split the line into cues of at most five words or 32 characters, distributing the window by word count. Cues come from word timestamps, never from segments: Whisper may return one segment for several sentences. Report a similarity score per line; below 0.9, look at the line by hand before burning. A low score caused by spelling alone (dialect, homophones the intended line writes differently) is fine when every cue start is within 0.3 seconds of the take's own word timestamps.
3. **Burn** in the reference's look. Position follows the reference too, when its captions sit inside the platform safe zones and off faces (top of frame or beside the speaker are common); otherwise bottom of frame. Safe zones for portrait: the top 12 percent and the bottom 17 percent of the height are kept for overlays only when the reference uses them, and 11 percent margins on the sides always. One or two lines, never over a face. No animation, no emoji, no karaoke highlighting.
4. **Verify**: output duration equals input within one second, audio stream intact, every intended word present in the cue file, two frames at cue midpoints extracted and inspected.

## Using the bundled subtitles workflow

If `get_workflow_instructions` lists a `subtitles` workflow, use its scripts: they implement this pipeline with tested caption geometry and font fallback. Pass the intended lines as the script input (its manifest of lines) so that the transcript is used only as the clock, which is exactly the rule above. Use the reference's look as derived in the brief, or the look the user asked for at a checkpoint; when the reference has no captions, use the bold look the workflow recommends for shorts.

Three things the bundle does not do on its own. It ships no font for non-Latin scripts: pass the font file and its directory through the workflow's font flags. Its clean burner is white with a slim outline and has no colour option: when the reference's caption colour matters, burn with ffmpeg's `subtitles` filter and `force_style` instead. Its similarity gate (re-run below 0.9) misfires when the intended lines legitimately differ from the STT spelling; check the cue starts against the takes' word timestamps and go on when they hold. It also asks the user about the look for direct requests; this skill does not ask, it derives the look. Run it in the background like the assembly.

Otherwise, run Whisper for word timings, write an SRT from the aligned intended lines, and burn with ffmpeg's subtitles filter, with a font that covers the script of the dialogue language. Keep the SRT next to the output for verification.

## Looks

| Look | When |
|---|---|
| Bold caps, white with black outline | Default for shorts and UGC-style ads. Matches most references. |
| Clean sentence case, slim outline | Calmer, premium products; when the reference uses it. |
| Handwritten on paper | Only when the reference has it. |

The reference's look is described in the analysis brief under "On-screen text and captions" and is the default.

## Language and fonts

Captions are in the dialogue language unless the user asked for another. A translated caption is still aligned to the spoken line's clock. "Caps" in the looks table applies only to scripts that have case.

The sandbox's preinstalled caption fonts (Metropolis, Montserrat) cover Latin only. For Korean, Japanese, Chinese, Cyrillic, Arabic, Thai, Devanagari and every other script, fetch a font under the SIL Open Font License in the same sandbox command, before burning: Noto Sans for that script, from the google/fonts repository on GitHub (the `ofl/<family>` directory, for example `ofl/notosanskr`) or from the Noto releases. Put it in a `fonts` directory, pass `fontsdir=fonts` to the subtitles filter together with `force_style='FontName=<family name>'`, and check that the download is a font (a few megabytes, not an error page) before using it. A variable font's filename carries brackets, which must be URL-encoded in the download address. Fetch the font while a take renders, so the caption step does not wait for it. The bundled `subtitles` workflow has its own font option; give it the same file. An empty or boxed caption is a font failure, not a timing failure.

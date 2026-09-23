# Tool notes

How the Higgsfield tools behaved in real runs of this skill, with the workaround that worked. Each note is dated; when a tool behaves differently from what a note says, trust the tool and update the note. Nothing here changes the rules in SKILL.md; it saves the next run from rediscovering the same edges.

## Sandbox (`sandbox_exec`)

- 2026-09-23: a poll that slept 60 seconds with `timeout_seconds` 100 timed out at the transport ("The operation timed out") well under the tool's 120-second ceiling. Polls with a 20 to 25 second sleep and a timeout of 40 to 45 worked every time.
- 2026-09-23: the sandbox's ffmpeg rejects `tile=6x0`; both tile dimensions must be given. Because the analysis command is one `&&` chain, a failure there skips the transcript and the upload. The brief template uses `tile=6x6` and `sheet%02d.png`.
- 2026-09-23: a presigned upload URL from `media_upload` is signed with the content type. A PUT without `-H 'Content-Type: ...'` fails; the `media_upload` result names the header to send.
- 2026-09-23: the sandbox's own curl of the product page returned the whole page text, so a separate web-reading tool was not needed for the words; it is still useful when a page is script-rendered.

## Scene analysis (`video_analysis_create`, `video_analysis_status`)

- 2026-09-23: a 27-second reference imported from a direct link stayed `queued`, with an unchanged `updated_at`, through eight polls over fifteen minutes and never completed or failed. The brief was built from the frames and the Whisper transcript instead, as the template allows. Do not let this block phase 2.

## Preflight (`generate_video` and `generate_image` with `get_cost: true`)

- 2026-09-23: six of ten video preflights came back with a preset recommendation and no cost. Calling again with `declined_preset_id` set to the recommended preset returned the cost. Near-identical prompts did not all trigger it. Pass the same `declined_preset_id` on the real generation.
- 2026-09-23: cost did not depend on the prompt or on which reference media was attached, only on model, duration, tier and audio. Seven identical image preflights returned identical numbers; one per parameter set is enough.
- 2026-09-23: a reference-mode video model (Seedance 2.5 `omni_reference`) needs a media input even for a preflight; the product image's media id served as the placeholder.
- 2026-09-23: turning native audio off made Kling 3.0 cheaper and Seedance 2.5 not at all (a flat per-second price either way).
- 2026-09-23: an image model's preflight returned `credits: 1` with `credits_exact: 0.12`; the estimate used the rounded figure, and the ledger records what the transaction shows.

## Models (`models_explore`)

- 2026-09-23: the identity-portrait recommendation (Soul Cast) produced only 16:9 and took no reference input, so first frames needed a second, reference-capable image model (Nano Banana Pro that day). cast.md now finds the two models separately.
- 2026-09-23: Soul Cast ignored the prompt's framing and returned a 2048x1152 three-panel character sheet (full body front, full body back, face) every time. It served as the identity reference as it was. Four portraits cost 0.12 credits each; the preflight had shown a rounded 1.

## Jobs (`generate_image`, `generate_video`, `jobs_wait`)

- 2026-09-23: `jobs_wait` accepted a single job id from `generate_image` (not from a batch tool) and returned the result URL when the job finished, in two 15-second waits per portrait. The tool text's mention of batch job ids is not a restriction.
- 2026-09-23: `generate_image` never returned the preset notice that `generate_video` preflights did.

## Takes and assembly

- 2026-09-23: a 4-second Seedance 2.5 take at 480p rendered in about three and a half minutes, a 10-second one in five to eight; `jobs_wait` is capped at 15 seconds, so a five-shot run polled about 75 times. Every charge equalled its preflight.
- 2026-09-23: a take generated with `generate_audio: false` came back with no audio stream at all. The assembly synthesized room tone for it before the concat.
- 2026-09-23: the assembly encode (29 seconds of video plus uploads) took about 50 seconds; run as a background script it finished cleanly, where a foreground call would have hit the transport timeout seen in phase 2. The sandbox had been recycled during the last take's wait, so the script re-fetched every input; a self-contained script is the safe shape.
- 2026-09-23: the bundled `subtitles` workflow accepted the intended lines as a manifest, timed 21 words, and scored similarity 0.75 because of dialect and homophone spellings; the cue starts were within 0.3 seconds of the takes' word timestamps, so the score was ignored. It ships no Korean font (Noto Serif KR was passed in), its clean burner is white only, and its SRT cannot be uploaded (backend whitelist), so the cue list travels in the delivery.

## Pronunciation outcomes

- 2026-09-23, Seedance 2.5, Korean: "적혔다" came out without its aspiration in two takes (Whisper wrote "적겼다" at about 0.85 both times, and that was the truth, not a homophone). Respelling it in the prompt as "저켰다" while the intended line stayed "적혔다" fixed it on the first retry: Whisper then wrote "적혔다" at 0.98, and the syllable's onset carried about 50 milliseconds of aspiration noise against 10 to 20 in the failed takes. A 10-second take with three lines took about four and a half minutes.

## Speech-to-text (Whisper in the sandbox)

- 2026-09-23: on the mixed master, Whisper's default voice-detection split of two seconds pushed word starts back into pauses and onto a chime, so five of seven cues failed the onset check; a 300-millisecond split plus onset snapping and cut clamping passed all seven. Re-uploading a corrected file to the same presigned URL before `media_confirm` worked.

- 2026-09-23: Whisper normalized a dialect pronoun to the standard one and wrote a two-word tagline as one word in both takes of the same shot; the medium model did the same. The user heard the first take as unnatural; the retry, prompted with "natural standard pronunciation", was chosen after a 10-millisecond RMS envelope showed a slightly longer closure gap inside the disputed word and a decode with the intended line as `initial_prompt` read it as two words.
- 2026-09-23: on a sighing shot with no dialogue, Whisper with voice detection returned a low-confidence phrase on a stretch 13 dB under real speech, and without voice detection returned stock Korean phrases. Loudness and no-speech probability, not the transcript, settled it as silence.

- 2026-09-23: Whisper `small` heard a Korean line as "니가 엄마 손재 기다린다" where the burned caption read "느그 엄마 손주 기다린다", and missed two on-screen lines that were never spoken. Frames are the ground truth for text; the transcript is the clock.

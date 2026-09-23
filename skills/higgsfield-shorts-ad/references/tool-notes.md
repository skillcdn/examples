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

- 2026-09-23: the identity-portrait recommendation (Soul Cast) produced only 16:9 and took no reference input, so first frames for a start-image model needed a second, reference-capable image model (Nano Banana Pro that day). cast.md now finds the two models separately.

## Speech-to-text (Whisper in the sandbox)

- 2026-09-23: Whisper `small` heard a Korean line as "니가 엄마 손재 기다린다" where the burned caption read "느그 엄마 손주 기다린다", and missed two on-screen lines that were never spoken. Frames are the ground truth for text; the transcript is the clock.

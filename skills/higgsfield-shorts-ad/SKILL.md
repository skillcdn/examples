---
name: higgsfield-shorts-ad
description: Makes a short-form vertical AI ad, promo or commercial video on Higgsfield, modeled on a reference video. Asks for what the request left out (the reference, the product, the language), analyzes the reference (mood, dialogue, on-screen text, cast), has the user choose the latest Kling or Seedance model from a side-by-side credit estimate, generates draft-quality takes one at a time, and adds captions, frames and text with code-based editing instead of the video model. Use when a user wants a promo or ad short (TikTok, Reels, Shorts) for their product, brand or website in the style of a reference short, with credit use kept low.
license: MIT
compatibility: Needs the Higgsfield MCP server with video generation, video analysis, media upload and the cloud sandbox (ffmpeg and Whisper). Works in any agent that can call MCP tools.
metadata:
  author: skillcdn
  version: "0.2"
  tools: higgsfield
---
# Shorts-style AI ad from a reference video

From one reference video and a product brief, this skill produces a vertical short-form ad: a clean master, a captioned master, and a ledger of what it cost. Video comes from the latest Kling or Seedance model on Higgsfield, generated one draft-quality take at a time. Everything that can be done with code (cuts, captions, frames, text, sound effects, music) is done with code in the sandbox, not prompted into the video model.

This skill is the whole workflow. Do not switch to one of Higgsfield's bundled ad, UGC or Marketing Studio workflows, even when the server recommends one for an ad; the only bundled workflow used here is `subtitles`, in phase 7. The user is consulted twice before anything is spent: at intake, and once more with the plan and the estimate in front of them. Everything in between runs without stopping.

## Requirements

All of these come from the Higgsfield MCP server. Check that they are callable before phase 2; if any is missing, stop, ask the user to connect the Higgsfield MCP server (or enable the missing tool) and wait. Do not substitute a different service or skip the step silently.

| Tool | Used for |
|---|---|
| `models_explore` | Finding the latest Kling and Seedance video models and their parameters. |
| `generate_video` with `get_cost: true` | Credit preflight of every take before it is generated. |
| `generate_video` | Generating one take. |
| `video_analysis_create`, `video_analysis_status` | Scene-by-scene analysis of the reference video. |
| `media_upload_widget`, `media_upload`, `media_confirm`, `media_import_url` | Getting the reference video and the finished cut in and out. |
| `sandbox_exec` | Frame extraction, speech-to-text, cutting, overlays, captions, muxing. |
| `jobs_wait`, `show_generation_by_ids` | Collecting a finished take. |
| `balance` | Checking credits before the estimate is presented. |

Optional: `generate_audio` for a voice-over line that no take carries (it makes speech only, never music or sound effects); `get_workflow_instructions` with `subtitles` for the bundled caption burner (see [captions](references/captions.md)); outside Higgsfield, any tool that reads a web page, used when the product is given as a link.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Reference video | yes | A local file (uploaded through the widget) or a link. Asked for when the request has none. Short references analyze best; warn that accuracy drops with length. |
| Product or brand to advertise | yes | Name, what it is, one or two claims that may be made. A link to its site is enough when a web-reading tool is available. Images of the product if it must appear. |
| What must differ from the reference | yes | Usually the product, the cast and the dialogue. Ask if not stated. |
| Dialogue language | if spoken | Defaults to the language of the product's site or brief, else to the reference's. |
| Target length | no | Defaults to the length of the reference. |
| Caption style | no | Defaults to the style seen in the reference. |
| Credit budget | no | Asked in phase 4, with numbers in front of the user. |

## Workflow

Each phase produces a named artifact. Do not start a phase before the previous one's artifact exists. Only phases 1 and 4 stop for the user.

### Phase 1: Intake

Produces the **intake record**: every input above, answered or defaulted.

1. Compare the request with the inputs table. Everything the request did not answer is asked in one message, with the questions in [analysis-brief.md](references/analysis-brief.md) under "Intake". A request such as "make a promo video" is answered with that message, not with guesses: no placeholder reference, no invented product.
2. A product given as a link: read the page first (name, what it does, tagline, the claims it makes) and put what was read into the message so the user can correct it. Only claims the page or the user makes are spoken in the ad. Without a web-reading tool, ask the user to describe the product instead.
3. Stop until the user answers. The answers stand for the rest of the run.

### Phase 2: Analyze the reference

Produces the **analysis brief** ([template](references/analysis-brief.md)).

1. Get the reference in: `media_upload_widget` for a local file, `media_import_url` for a link. Start `video_analysis_create` right away with the media id; it runs for a few minutes. A YouTube link can go to the analysis as `youtube_url`, but the sandbox still needs a file it can download.
2. In the same waiting time, run the reference through the sandbox in one `sandbox_exec` call started with `background: true`: probe duration and frame size, extract one frame per second and a contact sheet, and transcribe the audio with the preinstalled Whisper. The command, and how to poll it, are in the brief template.
3. From the analysis result, the frames and the transcript, fill in the brief: mood and pacing, shot list with timings, dialogue as spoken, on-screen text and captions with their timing and look, cast appearance, sound design (music, effects, silence), and what is a cut versus a camera move.
4. Mark each element of the reference with its build route: **generate** (a take from the video model), **edit** (code in the sandbox), or **drop**. The rules are in [editing-decisions.md](references/editing-decisions.md).
5. Do not stop here. Note anything the brief raises that intake did not settle (two speakers where the ad needs one, an on-screen price, a setting that does not fit the product) as a question for phase 4.

### Phase 3: Plan the build

Produces the **shot list** ([example](assets/shot-list.example.json)) and the **edit plan**.

1. Rewrite the dialogue for the user's product. Every spoken line gets an **intended line**: the exact words to be said and later captioned, in the dialogue language. Keep lines short; a model speaks 2 to 3 words per second.
2. Split the ad into shots. One shot is one generation. Merge shots only when the model must carry continuity across them (same character mid-motion); otherwise keep them separate, because separate shots are cheaper to regenerate.
3. For each shot record: duration, aspect ratio 9:16, the intended line, the visual prompt, the reference image if any, and whether it carries native audio. The cast is generated: never depict a real person from the reference or from the product's site, by likeness or by name.
4. The edit plan lists everything that is done in code after generation: cut order, inserts, frames, text, captions, sound effects, music, end card.

### Phase 4: Estimate and approval

Produces the **estimate**, the user's **model choice** and the approved plan ([model-selection.md](references/model-selection.md)).

1. Find the latest generation of each family with `models_explore` (search `kling`, search `seedance`; type `video`). Pick the newest general video model of each family, not a turbo, edit or legacy variant, unless the user asks. Read its parameters.
2. Lock the lowest tier for each: resolution `480p` where the model offers it; where it does not (Kling exposes quality modes instead), the lowest quality mode, `std`.
3. Preflight the cost of every shot with `generate_video` and `get_cost: true`, once per family, with the exact parameters that will be used. Nothing is submitted and nothing is charged. Sum per family, add a regeneration reserve of one extra take per three shots (rounded up), and read the balance with `balance`.
4. Present, in one message: the brief, the shot list with its intended lines, the edit plan, the two estimates side by side (model name, per-shot cost, total, reserve, what each family does better for this brief), the balance, and any question phase 2 raised. Ask the user to approve or correct the shot list, pick a family, and confirm the budget. Stop until they answer. A corrected shot list is preflighted again before anything is generated.

### Phase 5: Generate takes, one at a time

Produces one **take** per shot and the running **budget ledger**.

1. Generate shot 1 only, with `count` 1 and `use_unlim: false` unless the user asked for their unlimited generations. Never use the batch tool. A take takes minutes: poll `jobs_wait` until it is terminal.
2. Review the take before the next shot: watch it (or its frames from the sandbox), and transcribe it with Whisper. Compare the transcript with the intended line.
3. Record the take in the ledger: shot, model, parameters, credits charged, verdict. Verdicts: **accept**, **accept with edit** (fixable in code), or **regenerate** (see phase 8).
4. Only then generate the next shot. If the ledger reaches the accepted estimate, stop and ask before continuing.

### Phase 6: Assemble and edit in code

Produces the **clean master**.

1. Download every accepted take into one `sandbox_exec` command, cut and concatenate in shot order, and apply the edit plan: inserts, picture-in-picture, frames, borders, text, logo, end card, sound effects, music bed with ducking under speech. Reserve the output with `media_upload` before the command and PUT the file at the end of the same command; the sandbox is discarded between calls.
2. Never prompt the video model for an overlay. Captions, frames, text, logos and end cards are always code ([editing-decisions.md](references/editing-decisions.md)).
3. Verify the master with `ffprobe`: duration, one video stream, one audio stream, 9:16. Confirm the upload with `media_confirm`.

### Phase 7: Captions

Produces the **captioned master** ([captions.md](references/captions.md)).

1. Transcribe the clean master with Whisper to get word timings.
2. Align the timings to the **intended lines**, not the transcript. The displayed words are always the intended lines; the transcript only supplies the clock. A brand name Whisper misheard is still captioned correctly.
3. Burn the captions in the look chosen in intake (bottom of frame, inside safe zones, at most five words or 32 characters per cue). Prefer the bundled `subtitles` workflow when the server offers it; otherwise Whisper plus ffmpeg as documented. The preinstalled fonts cover Latin only; for any other script, fetch a font that covers it as [captions.md](references/captions.md) describes, before burning.
4. Verify: every intended word appears, no cue drifts, two frames at cue midpoints look right. Upload and confirm.

### Phase 8: Regenerate what is ambiguous

Applies to any take whose dialogue is not clearly understood ([regeneration.md](references/regeneration.md)).

- Ambiguous means: the transcript of the take differs from the intended line in a way a listener would notice, or the speech is mumbled, cut off or overlapped. A line that is close, with the same meaning and no wrong words, is fine. Do not chase perfection.
- Regenerate only that shot, at the same tier, with the intended line quoted verbatim in the prompt and the audio instruction made explicit. One retry per shot without asking; a second retry only with the user's consent, because it comes out of the reserve.
- If an accepted take has one bad word and the rest is good, prefer a code fix (trim, cut around it, cover with a sound effect or a beat) over regeneration.

### Phase 9: Deliver

Hand over, in one message:

- The captioned master and the clean master as hosted links.
- The shot list with the intended lines, so captions can be checked.
- The ledger: estimated versus spent, per shot, with regenerations called out.
- What was generated, what was edited in code, and what was dropped from the reference and why.

## Hard rules

1. No generation before the user has approved the shot list and the estimate in phase 4. Missing inputs are asked for in phase 1, never guessed.
2. The user picks the model family, from a side-by-side estimate. The latest general model of that family is used, found through the catalog at run time, never a pinned version.
3. Lowest tier only: `480p` where offered, otherwise the lowest quality mode (`std`). One take per call, one shot at a time, no batch tool, `count` is 1.
4. Overlays are code: captions, frames, borders, text, logos, end cards, inserts. Never asked of the video model.
5. Captions show the intended line. Speech-to-text supplies timing only.
6. Regenerate only the ambiguous shot, one retry without asking, close enough is accepted.
7. Every credit is preflighted, recorded in the ledger, and never exceeds what the user accepted.
8. Free-trial unlimited generations are used only when the user explicitly asks for them; `use_unlim` is set explicitly on every generation call.
9. The cast is generated. No real person's likeness or name, from the reference or from the product's site.
10. No bundled Higgsfield workflow replaces this skill; only `subtitles` is borrowed, for the caption burn.

## Terminology

| Term | Meaning |
|---|---|
| Reference video | The example the user supplies. Analyzed, never republished. |
| Intake record | The inputs table, answered or defaulted, from phase 1. |
| Analysis brief | The structured description of the reference from phase 2. |
| Shot | One planned segment of the ad. One shot is one generation. |
| Take | One generated video for a shot. A shot may have several takes; one is accepted. |
| Intended line | The exact words a character is meant to say in a shot. Source of the captions. |
| Transcript | What speech-to-text heard in a take. Used for timing and for judging ambiguity. |
| Lowest tier | The cheapest resolution or quality mode a model offers: `480p`, or `std` when there is no resolution parameter. |
| Credit preflight | A `generate_video` call with `get_cost: true`; returns the cost without generating. |
| Budget ledger | The running record of estimate, accepted budget and credits spent per take. |
| Clean master | The assembled ad without captions. |
| Captioned master | The clean master with captions burned in. The deliverable. |
| Build route | Per element of the reference: generate, edit or drop. |

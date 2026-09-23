---
name: higgsfield-shorts-ad
description: Makes a short-form vertical AI ad, promo or commercial video on Higgsfield, modeled on a reference video that is analyzed but never fed to a model. Asks for what the request left out, analyzes the reference (mood, dialogue, on-screen text, cast), generates a portrait for each character for the user to approve, has the user choose the latest Kling or Seedance model from a side-by-side credit estimate, generates draft-quality takes one at a time with the user reviewing each, and adds captions, frames and text with code-based editing instead of the video model. Use when a user wants a promo or ad short (TikTok, Reels, Shorts) for their product, brand or website in the style of a reference short, with credit use kept low.
license: MIT
compatibility: Needs the Higgsfield MCP server with video generation, image generation, video analysis, media upload and the cloud sandbox (ffmpeg and Whisper). Works in any agent that can call MCP tools.
metadata:
  author: skillcdn
  version: "0.3"
  tools: higgsfield
---
# Shorts-style AI ad from a reference video

From one reference video and a product brief, this skill produces a vertical short-form ad: a clean master, a captioned master, and a ledger of what it cost. The reference is studied, never reused: no frame, clip or sound of it enters a generation or the output. The cast is generated from portraits the user approves. Video comes from the latest Kling or Seedance model on Higgsfield, generated one draft-quality take at a time, and every spoken word is produced by the video model itself. Everything that can be done with code (cuts, captions, frames, text, sound effects, music) is done with code in the sandbox, not prompted into the video model.

This skill is the whole workflow. Do not switch to one of Higgsfield's bundled ad, UGC, character or Marketing Studio workflows, even when the server recommends one; the only bundled workflow used here is `subtitles`, in phase 8.

## Review gates

The user sees and approves the artifact of every phase before the next one starts: the intake answers, the analysis brief, the cast list and shot list with the estimate, each cast portrait, each take, the clean master, the captioned master. Each gate is one message: the artifact, what can be changed, and what happens if nothing is said. If the user says to go ahead without them, the gates after the estimate are skipped and the agent judges by the rules in the references; the intake and the estimate are never skipped, because spending needs consent.

## Requirements

All of these come from the Higgsfield MCP server. Check that they are callable before phase 2; if any is missing, stop, ask the user to connect the Higgsfield MCP server (or enable the missing tool) and wait. Do not substitute a different service or skip the step silently.

| Tool | Used for |
|---|---|
| `models_explore` | Finding the latest Kling and Seedance video models, the image model for portraits, and their parameters. |
| `generate_video` with `get_cost: true` | Credit preflight of every take before it is generated. |
| `generate_video` | Generating one take. |
| `generate_image` with `get_cost: true`, `generate_image` | Preflight and generation of the cast portraits, and of first frames where the video model needs them. |
| `video_analysis_create`, `video_analysis_status` | Scene-by-scene analysis of the reference video. |
| `media_upload_widget`, `media_upload`, `media_confirm`, `media_import_url` | Getting the reference video and the finished cut in and out. |
| `sandbox_exec` | Frame extraction, speech-to-text, cutting, overlays, captions, muxing. |
| `jobs_wait`, `show_generation_by_ids` | Collecting a finished take or portrait. |
| `balance` | Checking credits before the estimate is presented. |

Optional: `get_workflow_instructions` with `subtitles` for the bundled caption burner (see [captions](references/captions.md)); outside Higgsfield, any tool that reads a web page, used when the product is given as a link. No text-to-speech tool is used: every line is spoken by the video model.

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
| Go-ahead without reviews | no | Off: every gate stops for the user. On only when the user says so; the estimate still stops. |

## Workflow

Each phase produces a named artifact and ends at its review gate. Do not start a phase before the previous artifact is approved, or, with the go-ahead, produced.

### Phase 1: Intake

Produces the **intake record**: every input above, answered or defaulted.

1. Compare the request with the inputs table. Everything the request did not answer is asked in one message, with the questions in [analysis-brief.md](references/analysis-brief.md) under "Intake". A request such as "make a promo video" is answered with that message, not with guesses: no placeholder reference, no invented product.
2. A product given as a link: read the page first (name, what it does, tagline, the claims it makes) and put what was read into the message so the user can correct it. Only claims the page or the user makes are spoken in the ad. Without a web-reading tool, ask the user to describe the product instead.
3. Say that each step will be shown for review, and that the user may say to go ahead alone once the estimate is accepted. Stop until they answer. The answers stand for the rest of the run.

### Phase 2: Analyze the reference

Produces the **analysis brief** ([template](references/analysis-brief.md)).

1. Get the reference in: `media_upload_widget` for a local file, `media_import_url` for a link that points at a media file. Start `video_analysis_create` right away with the media id; it runs for a few minutes. A YouTube link feeds only the scene analysis (as `youtube_url`); the sandbox cannot download from YouTube, so frames and transcript need a file or a direct link, asked for at intake.
2. In the same waiting time, run the reference through the sandbox in one `sandbox_exec` call started with `background: true`: probe duration and frame size, extract one frame per second and a contact sheet, and transcribe the audio with the preinstalled Whisper. The command, and how to poll it, are in the brief template.
3. From the analysis result, the frames and the transcript, fill in the brief: mood and pacing, shot list with timings, dialogue as spoken, on-screen text and captions with their timing and look, cast appearance, sound design (music, effects, silence), and what is a cut versus a camera move.
4. Mark each element of the reference with its build route: **generate** (a take from the video model), **edit** (code in the sandbox), or **drop**. The rules are in [editing-decisions.md](references/editing-decisions.md).
5. The frames, the contact sheet, the audio and the imported reference are for looking and listening only. They are never passed to a model as a start frame, a reference, a motion source or an audio source, and never cut into the output.
6. Gate: show the brief and ask what to correct. Note anything the intake did not settle (two speakers where the ad needs one, an on-screen price, a setting that does not fit the product) as a question here.

### Phase 3: Plan the build

Produces the **cast list**, the **shot list** ([example](assets/shot-list.example.json)) and the **edit plan**.

1. Describe each character of the ad from the brief's cast section and from what must differ: apparent age range, build, hair, skin tone, clothing, expression, role. The cast is generated; never a real person from the reference or from the product's site, by likeness or by name. Portraits are made from these descriptions in phase 5 ([cast.md](references/cast.md)).
2. Rewrite the dialogue for the user's product. Every spoken line gets an **intended line**: the exact words to be said and later captioned, in the dialogue language. Keep lines short; a model speaks 2 to 3 words per second. Every line, on camera or voice-over, is spoken by the video model in the take; there is no text-to-speech step.
3. Split the ad into shots. One shot is one generation. Merge shots only when the model must carry continuity across them (same character mid-motion); otherwise keep them separate, because separate shots are cheaper to regenerate.
4. For each shot record: duration, aspect ratio 9:16, the intended line, which cast member, the visual prompt (which repeats that character's clothing and identifying traits), the product image if any, and native audio on for any shot with a line.
5. The edit plan lists everything that is done in code after generation: cut order, inserts, frames, text, captions, sound effects, music, end card.

### Phase 4: Estimate and approval

Produces the **estimate**, the user's **model choice** and the approved plan ([model-selection.md](references/model-selection.md)).

1. Find the latest generation of each family with `models_explore` (search `kling`, search `seedance`; type `video`). Pick the newest general video model of each family, not a turbo, edit or legacy variant, unless the user asks. Read its parameters, its `aspect_ratios` and its `medias[].roles`.
2. Lock the lowest tier for each: resolution `480p` where the model offers it; where it does not (Kling exposes quality modes instead), the lowest quality mode, `std`.
3. Preflight the cost of every shot with `generate_video` and `get_cost: true`, once per family, with the exact parameters that will be used. Find the image model and preflight one portrait per cast member with `generate_image` and `get_cost: true`; for a family whose video model takes only a start frame, also one first frame per shot with a character ([cast.md](references/cast.md)). Nothing is submitted and nothing is charged. Sum per family, add a reserve of one extra take per three shots (rounded up) and one extra portrait per cast member, and read the balance with `balance`.
4. Gate: present, in one message, the cast list, the shot list with its intended lines, the edit plan, the two estimates side by side (model name, images, per-shot cost, sum, reserve, total, what each family does better for this brief and which route its portraits take), the balance, and any open question. Ask the user to approve or correct the cast and the shots, pick a family, and confirm the budget. Stop until they answer. A corrected plan is preflighted again before anything is generated.

### Phase 5: Cast portraits

Produces the **approved portraits** ([cast.md](references/cast.md)).

1. Generate one portrait per cast member, one at a time, at the image model's cheapest setting, `count` 1, `use_unlim` set explicitly. Record each in the ledger.
2. Gate: show the portraits with their hosted links and the descriptions they were made from. The user approves each or says what to change; a changed portrait is regenerated from the edited description and shown again. One retry per cast member is in the reserve; more needs consent.
3. The approved portrait's media id or job id goes into the shot list. Where the video model takes only a start frame, the first frame of each shot is made from the portrait right before that shot's take and shown with it.

### Phase 6: Generate takes, one at a time

Produces one **take** per shot and the running **budget ledger**.

1. Generate shot 1 only: `count` 1, `use_unlim` set explicitly, the approved portrait in the identity role or the first frame as `start_image`, native audio on, and the intended line quoted verbatim in the prompt with an explicit instruction that the character speaks exactly these words in the dialogue language. Never use the batch tool. A take takes minutes: poll `jobs_wait` until it is terminal.
2. Review the take before anything else: watch it (or its frames from the sandbox), transcribe it with Whisper, compare the transcript with the intended line, and give it a verdict by [regeneration.md](references/regeneration.md): **accept**, **accept with edit** (fixable in code), or **regenerate**.
3. Record the take in the ledger: shot, model, parameters, credits charged, verdict.
4. Gate: show the take's hosted link, the transcript against the intended line, the verdict and what is recommended. The user accepts, asks for a retry with a change, or changes the shot. Only then generate the next shot. With the go-ahead, the verdict decides, with one retry per shot without asking.
5. If the ledger reaches the accepted estimate, stop and ask before continuing.

### Phase 7: Assemble and edit in code

Produces the **clean master**.

1. Download every accepted take into one `sandbox_exec` command, cut and concatenate in shot order, and apply the edit plan: inserts, picture-in-picture, frames, borders, text, logo, end card, sound effects, music bed with ducking under speech. Reserve the output with `media_upload` before the command and PUT the file at the end of the same command; the sandbox is discarded between calls.
2. Never prompt the video model for an overlay. Captions, frames, text, logos and end cards are always code ([editing-decisions.md](references/editing-decisions.md)).
3. Verify the master with `ffprobe`: duration, one video stream, one audio stream, 9:16. Confirm the upload with `media_confirm`.
4. Gate: show the clean master's link with what was cut, overlaid and dropped. Ask what to change.

### Phase 8: Captions

Produces the **captioned master** ([captions.md](references/captions.md)).

1. Transcribe the clean master with Whisper to get word timings.
2. Align the timings to the **intended lines**, not the transcript. The displayed words are always the intended lines; the transcript only supplies the clock. A brand name Whisper misheard is still captioned correctly.
3. Burn the captions in the look chosen in intake (bottom of frame, inside safe zones, at most five words or 32 characters per cue). Prefer the bundled `subtitles` workflow when the server offers it; otherwise Whisper plus ffmpeg as documented. The preinstalled fonts cover Latin only; for any other script, fetch a font that covers it as [captions.md](references/captions.md) describes, before burning.
4. Verify: every intended word appears, no cue drifts, two frames at cue midpoints look right. Upload and confirm.
5. Gate: the captioned master is shown in the delivery message; a caption change re-runs this phase only.

### Phase 9: Regenerate what is ambiguous

Applies to any take whose dialogue is not clearly understood ([regeneration.md](references/regeneration.md)). At the take gate this is the recommendation the user sees; with the go-ahead it is the rule.

- Ambiguous means: the transcript of the take differs from the intended line in a way a listener would notice, or the speech is mumbled, cut off or overlapped. A line that is close, with the same meaning and no wrong words, is fine. Do not chase perfection.
- Regenerate only that shot, at the same tier, with the same portrait, with the intended line quoted verbatim in the prompt and the audio instruction made explicit. One retry per shot from the reserve; a second retry only with the user's consent.
- If an accepted take has one bad word and the rest is good, prefer a code fix (trim, cut around it, cover with a sound effect or a beat) over regeneration.

### Phase 10: Deliver

Hand over, in one message:

- The captioned master and the clean master as hosted links.
- The approved portraits as hosted links, so they can be reused for the same brand.
- The shot list with the intended lines, so captions can be checked.
- The ledger: estimated versus spent, per portrait and per shot, with regenerations called out.
- What was generated, what was edited in code, and what was dropped from the reference and why.

## Hard rules

1. Missing inputs are asked for in phase 1, never guessed.
2. Every phase ends at a review gate, skipped only when the user has said to go ahead alone; the estimate is confirmed in every mode. No generation before the cast, the shot list and the estimate are approved.
3. The user picks the model family from a side-by-side estimate. The latest general model of that family is used, found through the catalog at run time, never a pinned version.
4. Lowest tier only: `480p` where offered, otherwise the lowest quality mode (`std`); the cheapest setting of the image model. One take per call, one shot at a time, no batch tool, `count` is 1.
5. The reference video is analyzed only. No frame, clip, still or sound from it is ever passed to an image or video model or copied into the output.
6. The cast is generated: portraits made with the image tool, approved by the user, passed to the video model as identity. No real person's likeness or name.
7. Every spoken word is produced by the video model in the take. No text-to-speech, dubbing or voice tools, for on-camera lines or voice-over.
8. Overlays are code: captions, frames, borders, text, logos, end cards, inserts. Never asked of the video model.
9. Captions show the intended line. Speech-to-text supplies timing only.
10. Regenerate only what the take gate or the ambiguity rules call for; close enough is accepted.
11. Every credit is preflighted, recorded in the ledger, and never exceeds what the user accepted.
12. Free-trial unlimited generations are used only when the user explicitly asks for them; `use_unlim` is set explicitly on every generation call.
13. No bundled Higgsfield workflow replaces this skill; only `subtitles` is borrowed, for the caption burn.

## Terminology

| Term | Meaning |
|---|---|
| Reference video | The example the user supplies. Analyzed, never republished, never a model input. |
| Intake record | The inputs table, answered or defaulted, from phase 1. |
| Analysis brief | The structured description of the reference from phase 2. |
| Cast list | One description per character of the ad, from phase 3. |
| Cast portrait | The generated, approved image of a character; the video model's identity input. |
| First frame | A 9:16 image made from a portrait for a shot, when the video model takes only a start frame. |
| Shot | One planned segment of the ad. One shot is one generation. |
| Take | One generated video for a shot. A shot may have several takes; one is accepted. |
| Intended line | The exact words a character is meant to say in a shot. Source of the captions. |
| Transcript | What speech-to-text heard in a take. Used for timing and for judging ambiguity. |
| Lowest tier | The cheapest resolution or quality mode a model offers: `480p`, or `std` when there is no resolution parameter. |
| Credit preflight | A `generate_video` or `generate_image` call with `get_cost: true`; returns the cost without generating. |
| Budget ledger | The running record of estimate, accepted budget and credits spent per portrait and per take. |
| Review gate | The message that ends a phase: its artifact, what can change, and the default. |
| Go-ahead | The user's statement that reviews after the estimate may be skipped. |
| Clean master | The assembled ad without captions. |
| Captioned master | The clean master with captions burned in. The deliverable. |
| Build route | Per element of the reference: generate, edit or drop. |

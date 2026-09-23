---
name: higgsfield-shorts-ad
description: Makes a short-form vertical AI ad, promo or commercial video on Higgsfield in the style of a reference video that is analyzed but never fed to a model. Needs only the reference and the product (a link is enough) and derives the rest itself: language, length, caption look, product images. Generates a portrait per character for the user to approve, recommends the latest Kling or Seedance model with a credit estimate, generates draft-quality takes one at a time with a quick check after each, and adds captions, frames and text with code-based editing instead of the video model. Use when a user wants a promo or ad short (TikTok, Reels, Shorts) for their product, brand or website in the style of a reference short, with credit use kept low and no expertise needed.
license: MIT
compatibility: Needs the Higgsfield MCP server with video generation, image generation, video analysis, media upload and the cloud sandbox (ffmpeg and Whisper). Works in any agent that can call MCP tools.
metadata:
  author: skillcdn
  version: "0.4"
  tools: higgsfield
---
# Shorts-style AI ad from a reference video

From one reference video and one product (a link is enough), this skill produces a vertical short-form ad: a clean master, a captioned master, and a ledger of what it cost. The user needs to know nothing about AI or advertising: everything beyond those two inputs is derived from the reference and the product page, shown in plain words, and changed when the user asks. The reference is studied, never reused: no frame, clip or sound of it enters a generation or the output. The cast is generated from portraits the user approves. Video comes from the latest Kling or Seedance model on Higgsfield, one draft-quality take at a time, and every spoken word is produced by the video model itself. Everything that can be done with code (cuts, captions, frames, text, sound effects, music) is done with code in the sandbox, not prompted into the video model.

This skill is the whole workflow. Do not switch to one of Higgsfield's bundled ad, UGC, character or Marketing Studio workflows, even when the server recommends one; the only bundled workflow used here is `subtitles`, in phase 8.

## How the user is involved

- **Questions:** only for the reference video and the product, and only when the request did not give them. Nothing else is ever asked; it is derived.
- **Checkpoints:** the plan with its cost, the portraits, each take, the clean master, the finished ad. Each is one short message in plain words: what was made, the recommendation, and that one word ("OK" or its equivalent in the user's language) continues. Anything can be changed at a checkpoint, including a derived setting.
- **Go-ahead:** when the user says to go ahead alone, the checkpoints after the cost are skipped and the agent judges by the references. The cost is confirmed in every mode, because spending needs consent.
- **Changes mid-run:** a change asked for at any point (another language, a shorter ad, other captions, a different look for a character) is applied from that point on, and re-quoted first when it costs credits.

## Requirements

All of these come from the Higgsfield MCP server. Check that they are callable before the first message; if any is missing, stop, ask the user to connect the Higgsfield MCP server (or enable the missing tool) and wait. Do not substitute a different service or skip the step silently.

| Tool | Used for |
|---|---|
| `models_explore` | Finding the latest Kling and Seedance video models, the image model for portraits, and their parameters. |
| `generate_video` with `get_cost: true` | Credit preflight of every take before it is generated. |
| `generate_video` | Generating one take. |
| `generate_image` with `get_cost: true`, `generate_image` | Preflight and generation of the cast portraits, and of first frames where the video model needs them. |
| `video_analysis_create`, `video_analysis_status` | Scene-by-scene analysis of the reference video. |
| `media_upload_widget`, `media_upload`, `media_confirm`, `media_import_url` | Getting the reference video, the product images and the finished cut in and out. |
| `sandbox_exec` | Frame extraction, speech-to-text, reading the product page's images, cutting, overlays, captions, muxing. |
| `jobs_wait`, `show_generation_by_ids` | Collecting a finished take or portrait. |
| `balance` | Checking credits before the cost is presented. |

Optional: `get_workflow_instructions` with `subtitles` for the bundled caption burner (see [captions](references/captions.md)); outside Higgsfield, any tool that reads a web page, used for the product page's text. No text-to-speech tool is used: every line is spoken by the video model. In a client without the upload widget, everything comes in as links.

## Inputs

| Input | Source |
|---|---|
| Reference video | Required. A link straight to a media file, or a local file through the widget where the client has one. Asked for only when the request has none. Short references analyze best. |
| Product | Required. A link to its site or page, or a name with a sentence about it. Asked for only when the request has none. |
| Everything else | Derived, never asked: dialogue language (the product page's, else the reference's), length (the reference's), caption look (the reference's), what changes (the product, the cast and the words; the setting only when it does not fit the product), product images (the logo and one product image from the page), the budget (quoted at the cost checkpoint). Each is stated at the plan checkpoint, in one line, and changed on request. |

## Workflow

Each phase produces a named artifact. Phases stop only at the checkpoints listed above.

### Phase 1: Intake

Produces the **intake record**: the two inputs, and every derived setting with where it came from.

1. If the request names both the reference and the product, ask nothing. Say in one or two lines what happens next (the reference is analyzed, then the plan and its cost are shown) and go on.
2. If one is missing, ask for that one thing in a short message, as [analysis-brief.md](references/analysis-brief.md) "Intake" shows. Do not list the derived settings as questions. Stop until the user answers.
3. Read the product as "Product brief" in the same file describes: name, what it is, tagline, the claims it makes, its language, and its images (the logo and one product image), imported for the edit. Only claims the page or the user makes are spoken in the ad. Without a web-reading tool, ask the user for two lines instead.
4. Derive the rest (the inputs table) and record it.

### Phase 2: Analyze the reference

Produces the **analysis brief** ([template](references/analysis-brief.md)).

1. Get the reference in: `media_upload_widget` for a local file, `media_import_url` for a link that points at a media file. Start `video_analysis_create` right away with the media id; it runs for a few minutes. A YouTube link feeds only the scene analysis (as `youtube_url`); the sandbox cannot download from YouTube, so frames and transcript need a file or a direct link.
2. In the same waiting time, run the reference through the sandbox in one `sandbox_exec` call started with `background: true`: probe duration and frame size, extract one frame per second and a contact sheet, and transcribe the audio with the preinstalled Whisper. The command, and how to poll it, are in the brief template.
3. From the analysis result, the frames and the transcript, fill in the brief: mood and pacing, shot list with timings, dialogue as spoken, on-screen text and captions with their timing and look, cast appearance, sound design (music, effects, silence), and what is a cut versus a camera move.
4. Mark each element of the reference with its build route: **generate** (a take from the video model), **edit** (code in the sandbox), or **drop**. The rules are in [editing-decisions.md](references/editing-decisions.md).
5. The frames, the contact sheet, the audio and the imported reference are for looking and listening only. They are never passed to a model as a start frame, a reference, a motion source or an audio source, and never cut into the output.
6. No checkpoint here. Anything the brief raises that the derived settings do not cover (two speakers where one will do, an on-screen price, a setting that does not fit the product) is decided by the closest match to the reference and listed at the plan checkpoint as a decision the user can reverse.

### Phase 3: Plan the build

Produces the **cast list**, the **shot list** ([example](assets/shot-list.example.json)) and the **edit plan**.

1. Describe each character of the ad from the brief's cast section, in the reference's spirit but new: apparent age range, build, hair, skin tone, clothing, expression, role. The cast is generated; never a real person from the reference or from the product's site, by likeness or by name. Portraits are made from these descriptions in phase 5 ([cast.md](references/cast.md)).
2. Rewrite the dialogue for the product, in the dialogue language, keeping the reference's rhythm and structure. Every spoken line gets an **intended line**: the exact words to be said and later captioned. Keep lines short; a model speaks 2 to 3 words per second. Every line, on camera or voice-over, is spoken by the video model in the take; there is no text-to-speech step.
3. Split the ad into shots. One shot is one generation. Merge shots only when the model must carry continuity across them (same character mid-motion); otherwise keep them separate, because separate shots are cheaper to regenerate. The total length matches the reference within the models' duration options.
4. For each shot record: duration, aspect ratio 9:16, the intended line, which cast member, the visual prompt (which repeats that character's clothing and identifying traits), the product image if the product appears, and native audio on for any shot with a line.
5. The edit plan lists everything that is done in code after generation: cut order, inserts, frames, text, captions, sound effects, music, the logo, the end card with the product's name or address.

### Phase 4: Cost and the plan checkpoint

Produces the **estimate**, the **model choice** and the approved plan ([model-selection.md](references/model-selection.md)).

1. Find the latest generation of each family with `models_explore` (search `kling`, search `seedance`; type `video`). Pick the newest general video model of each family, not a turbo, edit or legacy variant. Read its parameters, its `aspect_ratios` and its `medias[].roles`.
2. Lock the lowest tier for each: resolution `480p` where the model offers it; where it does not (Kling exposes quality modes instead), the lowest quality mode, `std`.
3. Preflight the cost of every shot with `generate_video` and `get_cost: true`, once per family, with the exact parameters that will be used. Find the image model and preflight one portrait per cast member with `generate_image` and `get_cost: true`; for a family whose video model takes only a start frame, also one first frame per shot with a character ([cast.md](references/cast.md)). Nothing is submitted and nothing is charged. Sum per family, add a reserve of one extra take per three shots (rounded up) and one extra portrait per cast member, and read the balance with `balance`.
4. Recommend one family, with its reason in one line, as [model-selection.md](references/model-selection.md) says.
5. Checkpoint, one message in plain words: what the ad will be (length, language, the style in one line), the lines in order with who says them, the cast in one line each, what the edit adds (captions, logo, end card), the derived settings and any decision from phase 2 with a note that each can change, the recommended model with its total including the reserve and the balance, and the other family's total in one line. "OK" proceeds with the recommendation; the user may name the other family or change anything. Stop until they answer. A changed plan is preflighted again. The full brief and shot list are given on request, never by default.

### Phase 5: Cast portraits

Produces the **approved portraits** ([cast.md](references/cast.md)).

1. Generate one portrait per cast member, one at a time, at the image model's cheapest setting, `count` 1, `use_unlim` set explicitly. Record each in the ledger.
2. Checkpoint: the portraits with their hosted links, one line each on who they are. "OK" approves them all; otherwise the user says what to change for which one, and that portrait is regenerated from the edited description and shown again. One retry per cast member is in the reserve; more needs consent.
3. The approved portrait's media id or job id goes into the shot list. Where the video model takes only a start frame, the first frame of each shot is made from the portrait right before that shot's take and shown with it.

### Phase 6: Generate takes, one at a time

Produces one **take** per shot and the running **budget ledger**.

1. Generate shot 1 only: `count` 1, `use_unlim` set explicitly, the approved portrait in the identity role or the first frame as `start_image`, native audio on, and the intended line quoted verbatim in the prompt with an explicit instruction that the character speaks exactly these words in the dialogue language. Never use the batch tool. A take takes minutes: poll `jobs_wait` until it is terminal.
2. Review the take before anything else: watch it (or its frames from the sandbox), transcribe it with Whisper, compare the transcript with the intended line, and give it a verdict by [regeneration.md](references/regeneration.md): **accept**, **accept with edit** (fixable in code), or **regenerate**.
3. Record the take in the ledger: shot, model, parameters, credits charged, verdict.
4. Checkpoint: the take's hosted link, one line on what it says against what it should say, and the recommendation ("keep", or "retry, because ..."). "OK" follows the recommendation; the user may ask for a retry with a change, or change the shot. Only then generate the next shot. With the go-ahead, the verdict decides, with one retry per shot without asking.
5. If the ledger reaches the accepted estimate, stop and ask before continuing.

### Phase 7: Assemble and edit in code

Produces the **clean master**.

1. Download every accepted take into one `sandbox_exec` command, cut and concatenate in shot order, and apply the edit plan: inserts, picture-in-picture, frames, borders, text, logo, end card, sound effects, music bed with ducking under speech. Reserve the output with `media_upload` before the command and PUT the file at the end of the same command; the sandbox is discarded between calls.
2. Never prompt the video model for an overlay. Captions, frames, text, logos and end cards are always code ([editing-decisions.md](references/editing-decisions.md)).
3. Verify the master with `ffprobe`: duration, one video stream, one audio stream, 9:16. Confirm the upload with `media_confirm`.
4. Checkpoint: the clean master's link and one line on what was added and dropped. "OK" continues to captions.

### Phase 8: Captions

Produces the **captioned master** ([captions.md](references/captions.md)).

1. Transcribe the clean master with Whisper to get word timings.
2. Align the timings to the **intended lines**, not the transcript. The displayed words are always the intended lines; the transcript only supplies the clock. A brand name Whisper misheard is still captioned correctly.
3. Burn the captions in the reference's look (bottom of frame, inside safe zones, at most five words or 32 characters per cue). Prefer the bundled `subtitles` workflow when the server offers it; otherwise Whisper plus ffmpeg as documented. The preinstalled fonts cover Latin only; for any other script, fetch a font that covers it as [captions.md](references/captions.md) describes, before burning.
4. Verify: every intended word appears, no cue drifts, two frames at cue midpoints look right. Upload and confirm.
5. The captioned master is shown in the delivery message; a caption change re-runs this phase only.

### Phase 9: Regenerate what is ambiguous

Applies to any take whose dialogue is not clearly understood ([regeneration.md](references/regeneration.md)). At the take checkpoint this is the recommendation the user sees; with the go-ahead it is the rule.

- Ambiguous means: the transcript of the take differs from the intended line in a way a listener would notice, or the speech is mumbled, cut off or overlapped. A line that is close, with the same meaning and no wrong words, is fine. Do not chase perfection.
- Regenerate only that shot, at the same tier, with the same portrait, with the intended line quoted verbatim in the prompt and the audio instruction made explicit. One retry per shot from the reserve; a second retry only with the user's consent.
- If an accepted take has one bad word and the rest is good, prefer a code fix (trim, cut around it, cover with a sound effect or a beat) over regeneration.

### Phase 10: Deliver

Hand over, in one message, in plain words:

- The captioned master and the clean master as hosted links.
- The approved portraits as hosted links, so they can be reused for the same brand.
- The lines as captioned, so they can be checked.
- The ledger: estimated versus spent, per portrait and per shot, with regenerations called out.
- What was generated, what was edited in code, and what was dropped from the reference and why. The full brief and shot list on request.

## Hard rules

1. Only the reference and the product are ever asked for. Everything else is derived, shown at the plan checkpoint, and changed on request, never asked up front.
2. Every checkpoint stops for the user, skipped only after the user's go-ahead; the cost is confirmed in every mode. No generation before the plan and the cost are approved.
3. The agent recommends one model family from a side-by-side estimate and the user confirms or picks the other. The latest general model of that family is used, found through the catalog at run time, never a pinned version.
4. Lowest tier only: `480p` where offered, otherwise the lowest quality mode (`std`); the cheapest setting of the image model. One take per call, one shot at a time, no batch tool, `count` is 1.
5. The reference video is analyzed only. No frame, clip, still or sound from it is ever passed to an image or video model or copied into the output.
6. The cast is generated: portraits made with the image tool, approved by the user, passed to the video model as identity. No real person's likeness or name.
7. Every spoken word is produced by the video model in the take. No text-to-speech, dubbing or voice tools, for on-camera lines or voice-over.
8. Overlays are code: captions, frames, borders, text, logos, end cards, inserts. Never asked of the video model.
9. Captions show the intended line. Speech-to-text supplies timing only.
10. Regenerate only what the take checkpoint or the ambiguity rules call for; close enough is accepted.
11. Every credit is preflighted, recorded in the ledger, and never exceeds what the user accepted.
12. Free-trial unlimited generations are used only when the user explicitly asks for them; `use_unlim` is set explicitly on every generation call.
13. No bundled Higgsfield workflow replaces this skill; only `subtitles` is borrowed, for the caption burn.

## Terminology

| Term | Meaning |
|---|---|
| Reference video | The example the user supplies. Analyzed, never republished, never a model input. |
| Intake record | The two inputs and every derived setting, from phase 1. |
| Derived setting | A choice taken from the reference or the product page instead of asked: language, length, caption look, what changes, product images. Shown at the plan checkpoint, changed on request. |
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
| Checkpoint | The short plain-words message that ends a phase: what was made, the recommendation, and that one word continues. |
| Go-ahead | The user's statement that checkpoints after the cost may be skipped. |
| Clean master | The assembled ad without captions. |
| Captioned master | The clean master with captions burned in. The deliverable. |
| Build route | Per element of the reference: generate, edit or drop. |

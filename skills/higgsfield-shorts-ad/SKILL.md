---
name: higgsfield-shorts-ad
description: Makes a short-form vertical AI ad, promo or commercial on Higgsfield from a reference video and a product link. Learns what makes the reference work (hook, emotional arc, pacing, payoff) and writes an original ad for the product rather than a copy; never feeds the reference to a model. Derives language, length, medium (live action or animation, as the reference), look and brand typography itself, generates approved portraits and a still first frame per shot, directs each character's performance, recommends the latest Kling or Seedance model with a credit estimate, animates one draft take at a time, and adds captions, text and the end card in code. Use when a user wants a promo or ad short (TikTok, Reels, Shorts) for a product, brand or website in the spirit of a reference short, with credit use kept low and no expertise needed.
license: MIT
compatibility: Needs the Higgsfield MCP server with video generation, image generation, video analysis, media upload and the cloud sandbox (ffmpeg and Whisper). Works in any agent that can call MCP tools.
metadata:
  author: skillcdn
  version: "0.8"
  tools: higgsfield
skillcdn:
  include:
    - references/tool-notes.md
    - references/design.md
    - references/analysis-brief.md
    - references/editing-decisions.md
    - references/cast.md
    - references/model-selection.md
    - references/regeneration.md
    - references/captions.md
  translations:
    ko:
      title: 레퍼런스 영상으로 만드는 숏폼 AI 광고
      description: 레퍼런스 영상 하나와 제품 링크만으로 Higgsfield에서 세로형 숏폼 AI 광고·프로모 영상을 만듭니다. 레퍼런스가 왜 통하는지(후킹, 감정선, 호흡, 마무리)를 배워 제품을 위한 새 광고를 쓰며, 레퍼런스 자체는 절대 모델에 넣지 않습니다. 언어·길이·매체(레퍼런스처럼 실사 또는 애니메이션)·룩·브랜드 타이포그래피를 스스로 정하고, 승인받은 인물 초상과 컷별 첫 프레임을 만든 뒤 최신 Kling 또는 Seedance 모델을 크레딧 견적과 함께 추천하고, 초안 테이크를 한 번에 하나씩 생성하며, 자막·문구·엔드 카드는 코드로 넣습니다. 제품·브랜드·웹사이트를 위한 프로모/광고 숏폼(TikTok, Reels, Shorts)을 레퍼런스 숏폼의 느낌으로, 크레딧을 아끼면서 전문 지식 없이 만들고 싶을 때 쓰세요.
---
# Shorts-style AI ad from a reference video

One reference video and one product (a link is enough) go in; a captioned vertical ad, its clean master and a credit ledger come out. The reference teaches what works (the hook, the emotional arc, the pacing, the payoff) and sets the medium and the look (live action or animation, in its style); the ad itself is written new for the product: no frame, sound, person or line of the reference is reused, and no take is made from the reference. Everything beyond the two inputs is derived and shown in plain words. Portraits and a still first frame per shot are approved before any video is paid for; the latest Kling or Seedance model animates one draft-quality take at a time and speaks every line itself; cuts, text, captions, effects and the end card are code in the sandbox. This skill is the whole workflow: no bundled Higgsfield workflow replaces it, and only `subtitles` is borrowed, for burning captions.

## How the user is involved

- **Questions:** only for the reference video and the product, and only when the request did not give them. Nothing else is ever asked; it is derived.
- **Checkpoints:** the plan with its cost, the portraits, the first frames, the clean master, the finished ad. Each is one short message in plain words: what was made, the recommendation, and that one word ("OK" in the user's language) continues. Anything can be changed at a checkpoint. Takes are reported, not approved one by one.
- **Go-ahead:** when the user says to go ahead alone, the checkpoints after the cost are skipped; the cost is confirmed in every mode.
- **Changes mid-run:** applied from that point on; reported at the next checkpoint when within the accepted budget, re-quoted first when beyond it.

## Requirements

All from the Higgsfield MCP server. Check that they are callable before the first message; if one is missing, stop and ask the user to connect the server or enable the tool. Never substitute.

| Tool | Used for |
|---|---|
| `models_explore` | The latest Kling and Seedance video models, the two image models, and their parameters. |
| `generate_video`, `generate_image`, each with `get_cost: true` first | Credit preflight, then one take, portrait or frame per call. |
| `video_analysis_create`, `video_analysis_status` | Scene analysis of the reference, as a supplement. |
| `media_import_url`, `media_upload`, `media_confirm`, `media_upload_widget` | Reference, product images and finished files in and out. |
| `sandbox_exec` | Frames, speech-to-text, the product page's images and type, cutting, text, captions, muxing. |
| `jobs_wait`, `show_generation_by_ids` | Collecting a finished job. |
| `balance` | Credits before the cost is presented. |

Optional: `get_workflow_instructions` with `subtitles` for the bundled burner; any web-reading tool for the product page's text. No text-to-speech. In a client without the upload widget everything comes in as links. The references this skill links come with it when the server returns them; when only their list came, read each with `read_file` before the phase that links it. How these tools behaved in real runs is in [tool-notes.md](references/tool-notes.md); know it before phase 2.

## Inputs

| Input | Source |
|---|---|
| Reference video | Required. A link straight to a media file, or a local file through the widget. Asked for only when missing. |
| Product | Required. A link to its site or page, or a name with a sentence. Asked for only when missing. |
| Everything else | Derived, never asked: language (the product page's, else the reference's), length (the reference's), medium and look (the reference's: live action or animation, and its style in words), what changes (everything but the mechanism, the medium and the look), typography and colors (the brand's, see [design.md](references/design.md)), product images (logo, one product image, the site's own people if cast), budget (quoted at the cost checkpoint). Stated at the plan checkpoint, changed on request. |

## Workflow

Each phase produces a named artifact. Phases stop only at the checkpoints above.

### Phase 1: Intake

Produces the **intake record**.

1. Both inputs in the request: ask nothing, say in a line what happens next, go on. One or both missing: ask for what is missing as [analysis-brief.md](references/analysis-brief.md) "Intake" shows, and stop.
2. Read the product page as "Product brief" there: name, what it is, tagline, claims (only these may be spoken), language, images, and its type and colors ([design.md](references/design.md)). The site's assets are the advertiser's and may be used.
3. Derive the rest and record it.

### Phase 2: Analyze the reference

Produces the **analysis brief** ([template](references/analysis-brief.md)).

1. Import the reference; start the scene analysis and never wait for it. Run the sandbox pass in the background: probe, frames, contact sheet, transcript.
2. Fill the brief from frames and transcript: the medium and the look (live action or animation, and the style in words an image model can follow), mood, shots with their beats, dialogue, on-screen text and its look, cast, sound, and above all **why it works**: the hook in the first two seconds, the tension and the turn, the payoff, the call to action, the pacing that carries them.
3. Mark build routes (generate, edit, drop) by [editing-decisions.md](references/editing-decisions.md).
4. Nothing of the reference becomes a model input or a piece of the output. Open decisions go to the plan checkpoint; there is no checkpoint here.

### Phase 3: Concept and plan

Produces the **concept**, the **cast list**, the **shot list** ([example](assets/shot-list.example.json)) and the **edit plan**.

1. **Concept.** From "why it works", write a new idea for the product: a different situation, setting, cast and lines that deliver the same hook mechanism, arc and payoff, in the reference's medium and look. The reference's surface (its scenes, its jokes, its wording, its cast) is not reused. Write one alternative concept in one line for the checkpoint. Only when the user asks for a close remake is the reference followed scene by scene, and the plan says so.
2. **Style line.** One sentence from the brief's medium and look that fixes the style for every image and take prompt: the medium, line, color and shading, backgrounds, light, camera. Repeated verbatim in every portrait, frame and take prompt, so they match ([cast.md](references/cast.md)).
3. **Cast.** One description per character: age range, build, hair, skin tone, clothing, baseline expression, role. Never the reference's people; the product site's own people may be cast ([cast.md](references/cast.md)).
4. **Lines.** Every spoken line is an **intended line**, short and speakable ([regeneration.md](references/regeneration.md) "Pronunciation"), made only of what the product page or the user claims, spoken by the video model in the take.
5. **Shots.** One shot is one generation, merged only for continuity. Each records duration, cast, the first-frame description, the **performance** (emotion at the start, the turn, emotion at the end, delivery, eye line, the action), the intended line, the product image if any, audio on for a line. Total length matches the reference within the model's durations.
6. **Edit plan and design.** Cut order, inserts, on-screen text, effects, music, captions and the end card, in the brand's type and colors by [design.md](references/design.md).

### Phase 4: Cost and the plan checkpoint

Produces the **estimate**, the **model choice** and the approved plan ([model-selection.md](references/model-selection.md)).

1. Find the latest general model of each family with `models_explore`; lock the lowest tier (`480p`, else `std`); read its roles and aspect ratios.
2. Preflight once per family and parameter set for the takes, and the two image models for portraits and frames. Reserve: one take per three shots at the dearest shots, one portrait per cast member, one frame per three shots. Read `balance`.
3. Recommend one family with its reason in one line.
4. Checkpoint, in plain words: the concept and its alternative, what the ad will be, the lines with who says them, the cast, what the edit adds, the derived settings and open decisions, the recommended model's total with reserve and the balance, the other family's total. "OK" proceeds; the user may pick the alternative, the other family, or change anything. A changed plan is preflighted again.

### Phase 5: Cast portraits

Produces the **approved portraits** ([cast.md](references/cast.md)). One per cast member, in the style line, one call each, cheapest setting, `use_unlim` explicit, in the ledger. Checkpoint: links and one line each; "OK" approves all, a change regenerates that one from the edited description (one retry per member in the reserve). Where a portrait differs from its description, the portrait wins and the prompts follow it.

### Phase 6: First frames

Produces one **approved first frame** per generated shot ([cast.md](references/cast.md)). A 9:16 still from the portrait as reference, the style line and the shot's first-frame description, carrying the shot's starting emotion; made back to back, one call each, looked at as a set (right person, clothing, setting, framing, expression, the style held; no text, no artifacts), one failed frame regenerated from the reserve. Checkpoint: all frames in order with one line each on what the shot does from there.

### Phase 7: Takes, one at a time

Produces one **take** per shot and the **budget ledger**.

1. One shot per call: the frame as `start_image`, the portrait in the identity role where one exists, audio on, `count` 1, `use_unlim` explicit, and a prompt made of the style line, the performance line and the intended line in quotes, with the instruction that the character speaks exactly these words in the dialogue language with natural standard pronunciation and nothing else; a word the model is known to get wrong is respelled as "Pronunciation" says. Never the batch tool. Poll `jobs_wait`; use the wait to warm up Whisper, fetch the font and prepare the assembly.
2. Review from a 2 fps sheet, the word-timed transcript and a loudness curve: the same person, setting and style as the frame (no drift toward photoreal or another drawing style), the mouth moving in the speech window and still outside it, the performance matching the beat (the emotion and its turn visible), no text or artifacts, speech only where it should be. Verdict by [regeneration.md](references/regeneration.md): accept, accept with edit, or regenerate.
3. Ledger row and a one-line report per take; act on the verdict without stopping (one retry per shot from the reserve). Stop only for a second retry or when the ledger reaches the accepted estimate.

### Phase 8: Assemble and edit in code

Produces the **clean master**. One self-contained script in the background: takes, cuts, inserts, on-screen text, effects, music with ducking, the end card and the logo by [design.md](references/design.md), verified by [editing-decisions.md](references/editing-decisions.md); output reserved with `media_upload` and PUT at the end; a take made without audio gets an audio track first. Checkpoint: the master's link, the take reports, what was added and dropped; "OK" continues, or any shot may be retried here.

### Phase 9: Captions

Produces the **captioned master** ([captions.md](references/captions.md)): word timestamps from the master, cues aligned to the intended lines starting at their own first word, burned in the brand's type by [design.md](references/design.md), verified (every word present, no cue early or spread across a pause, frames at cue midpoints), uploaded. Shown in the delivery.

### Phase 10: Regenerate

[regeneration.md](references/regeneration.md) decides during phase 7 and at the clean-master checkpoint: ambiguous, broken, flat or drifted takes only, same frame and portrait, one retry from the reserve, the failed word respelled, a second retry only with consent.

### Phase 11: Deliver

One message in plain words: the captioned master and the clean master as links; the portraits and frames for reuse; the lines as captioned; the ledger, estimated versus spent, per item, retries called out; what was generated, edited in code, and left out of the reference and why.

## Hard rules

1. Only the reference and the product are asked for; everything else is derived, shown at the plan checkpoint, and changed on request.
2. Every checkpoint stops for the user unless the user gave the go-ahead; the cost is confirmed in every mode. No generation before the plan and the cost are approved.
3. The ad is an original concept built on what makes the reference work, in the reference's medium and look; the reference is followed scene by scene only when the user asks. Nothing of the reference (frame, clip, sound, person, line) is a model input or part of the output.
4. The agent recommends a model family from a side-by-side estimate; the user confirms or picks the other. The latest general model of the family, found in the catalog at run time, never pinned.
5. Lowest tier only; cheapest image settings; one take per call, one shot at a time, `count` 1, no batch tool.
6. The cast is new: approved portraits, or the product site's own photos when the plan casts someone the site presents.
7. Every shot is animated from an approved still first frame, every shot carries a performance direction, and every image and take prompt carries the style line.
8. Every spoken word comes from the video model's native audio. No text-to-speech, dubbing or voice tools.
9. Overlays are code: captions, text, logos, end cards, inserts, in the brand's type and colors. Never asked of the video model.
10. Captions show the intended line; speech-to-text supplies timing only.
11. Regenerate only ambiguous, broken, flat or drifted takes, or what the user asks for; close enough is accepted, except on the brand's own words.
12. Every credit is preflighted, recorded, and never exceeds what the user accepted.
13. Free-trial unlimited generations only when the user asks; `use_unlim` set explicitly on every call.

## Terminology

| Term | Meaning |
|---|---|
| Reference video | The example the user supplies. Analyzed for what makes it work; never reused, never a model input. |
| Why it works | The brief's account of the reference's hook, tension, turn, payoff, call to action and pacing. |
| Concept | The new idea for the product that delivers the same mechanism with a different surface. |
| Style line | The one sentence that fixes the medium and the look; repeated verbatim in every portrait, frame and take prompt. |
| Derived setting | A choice taken from the inputs instead of asked; shown at the plan checkpoint. |
| Cast portrait | The approved image of a character; the identity input for frames and takes. |
| First frame | The approved 9:16 still a shot is animated from, carrying its starting emotion. |
| Performance | A shot's direction: emotion at the start, the turn, emotion at the end, delivery, eye line, action. |
| Intended line | The exact words a character says in a shot; the source of the captions. |
| Take | One generated video for a shot, from its first frame; one is accepted. |
| Lowest tier | The cheapest resolution or quality mode a model offers. |
| Preflight | A generation call with `get_cost: true`; a number, no job. |
| Budget ledger | Estimate, accepted budget and credits spent per item. |
| Checkpoint | The short plain-words message that ends a phase; one word continues. |
| Go-ahead | The user's word that checkpoints after the cost may be skipped. |
| Clean master, captioned master | The assembled ad without and with captions; the second is the deliverable. |

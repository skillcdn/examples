# Analysis brief

The artifact of phase 2. Fill every section; write "none" rather than leaving a section out, so the user can see what was looked for.

## Sandbox pass

Run in one `sandbox_exec` call, started with `background: true`, while `video_analysis_create` is processing. `<url>` is a link the sandbox can download: the original link when it points straight at a media file, otherwise the hosted URL of the confirmed upload or import (`show_medias` with type `video` lists it). Before the call, reserve an upload for the contact sheet with `media_upload` (filename `sheet.png`) and put its `upload_url` on the last line, so the sheet can be looked at by its hosted URL after `media_confirm`. The call returns a pid, a log path and a status path; poll them with a later `sandbox_exec` (`sleep 20; cat <status path>; tail -n 60 <log path>`). Keep each poll short: a `sleep` of at most 25 seconds and `timeout_seconds` of at most 45, because longer polls time out at the transport before the tool's own limit. Whisper downloads its model on first use, so allow one to three minutes.

If `video_analysis_status` still says queued after about five minutes, do not wait for it: build the brief from the frames and the transcript, poll it again between later phases, and fold the scene analysis in if it arrives. The frames are the ground truth for look and text in any case.

```sh
curl -fsSL -o ref.mp4 '<url>' \
&& ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of json ref.mp4 \
&& mkdir -p frames \
&& ffmpeg -v error -i ref.mp4 -vf fps=1,scale=270:-2 frames/f%03d.png \
&& ffmpeg -v error -i ref.mp4 -vf "fps=1,scale=180:-2,tile=6x6" sheet%02d.png \
&& ffmpeg -v error -i ref.mp4 -vn -ac 1 -ar 16000 ref.wav \
&& python3 - <<'PY'
from faster_whisper import WhisperModel
m = WhisperModel("small")
segs, info = m.transcribe("ref.wav", vad_filter=True, word_timestamps=True)
print("language:", info.language)
for s in segs:
    print(f"{s.start:6.2f} {s.end:6.2f} {s.text.strip()}")
PY
curl -f -X PUT -H 'Content-Type: image/png' --upload-file sheet01.png '<upload_url>'
```

The `tile` filter needs both dimensions on the sandbox's ffmpeg (`6x0` is rejected, and because the command is one chain, everything after it would be skipped). A 6x6 sheet holds 36 seconds; a longer reference produces `sheet02.png` and so on, looked at as files. The PUT carries the `Content-Type` the `media_upload` result names, because the presigned URL is signed with it.

Look at the contact sheet (by its hosted URL, or downloaded where the client can view images) and at individual frames for cast appearance and on-screen text. Frames are the ground truth for text, look and structure; the transcript is the ground truth for dialogue; the scene analysis, when it arrives, adds scene boundaries and descriptions to check the shot list against.

The frames, the sheet, the audio and the imported reference are for looking and listening only. None of them is ever passed to a model as a start frame, a reference, a motion source or an audio source, and none appears in the output. The cast section below is the source of the cast list and the portraits ([cast.md](cast.md)); it describes, it never copies.

## Template

```markdown
# Analysis brief: <reference name>

Duration: <s> · Frame: <w>x<h> (<aspect>) · Language: <code> · Shots: <n>

## Why it works
<The mechanism, not the content. Hook: what stops the thumb in the first two seconds and how (a question, a shock, a face, a claim). Tension: what the viewer wants resolved. Turn: the moment the ad changes direction. Payoff: what the product delivers and how it is shown. Call to action: its wording and timing. Pacing: how cut rhythm carries these. Keep: the mechanism. Reinvent: the situation, the setting, the cast, the lines.>

## Mood and pacing
<Two or three sentences: tone, energy, color, camera style, cut rhythm.>

## Shot list
| # | In–out | What is on screen | Beat (what the viewer feels, and why) | Camera | Cut or move | Build route |
|---|---|---|---|---|---|---|
| 1 | 0.0–2.1 | ... | discomfort: a question the viewer has heard too | handheld close-up | hard cut | generate |

## Dialogue (as spoken)
| # | In–out | Speaker | Transcript |
|---|---|---|---|

## On-screen text and captions
| In–out | Text | Kind (caption / title / sticker / price / CTA) | Position | Look (family class, weight, case, outline, color, motion) | Build route |
|---|---|---|---|---|---|

## Cast
<One entry per person: apparent age range, build, hair, skin tone, clothing, expression, role. Descriptive only; never identify a real person.>

## Sound design
<Music: yes/no, genre, where it starts. Effects: list with timing. Silence or room tone. Voice: on-camera, voice-over, or none.>

## Inserts and effects
<Picture-in-picture, product shots cut in, zooms, freeze frames, transitions. Each with a build route.>

## Build routes summary
Generate: <shots>. Edit: <elements>. Drop: <elements, with why>.
```

## Intake

Ask only for what the request did not give, and only these two:

1. The reference video: a link straight to a media file, or a local file through the upload widget where the client has one. A YouTube link alone is not enough: it feeds the scene analysis but not the frames or the transcript. Short is better; analysis accuracy drops with length.
2. The product: a link to its site or page, or a name and one sentence about it.

The message is short: the one or two things needed, one line on what happens next (the reference is analyzed, then a plan with its cost is shown), and nothing else. Never ask about language, length, captions, cast, setting, images or budget. Those are derived and shown at the plan checkpoint, where the user can change any of them. When the request already has both, there is no intake message at all.

## Product brief

From the product page (or the user's sentence), record:

- Name, what it is, who it is for: one line each.
- The tagline, if any, verbatim.
- The claims the page makes, as a short list. Only these, or what the user states, may be spoken in the ad.
- The page's language, which becomes the dialogue and caption language.
- The page's type and colors: font families from its stylesheet, the ground, text and accent colors, the logo's clear space ([design.md](design.md)).
- Images: the logo, one product image, and the photo of any person the site presents as the brand's own (a founder, a face of the brand, a mascot). Fetch the page in the sandbox (`curl -sL '<url>'`), read the `og:image` tag and the `img` sources whose path, alt or class mentions logo, product, hero, portrait or the product's name; download the candidates, look at them, and keep what serves: a logo for the end card and overlays, a product image for overlays and as a product reference where the video model takes one, a person's photo for casting ([cast.md](cast.md)). Import them with `media_import_url`. They are the advertiser's own assets and may be used as they are or as references; nothing is taken from any other site.

A text-only web tool gives the words; the images need the sandbox. Without either, ask the user for two lines about the product and go on without images.

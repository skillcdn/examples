# Analysis brief

The artifact of phase 2. Fill every section; write "none" rather than leaving a section out, so the user can see what was looked for.

## Sandbox pass

Run in one `sandbox_exec` call, started with `background: true`, while `video_analysis_create` is processing. `<url>` is a link the sandbox can download: the original link when it points straight at a media file, otherwise the hosted URL of the confirmed upload or import (`show_medias` with type `video` lists it). Before the call, reserve an upload for the contact sheet with `media_upload` (filename `sheet.png`) and put its `upload_url` on the last line, so the sheet can be looked at by its hosted URL after `media_confirm`. The call returns a pid, a log path and a status path; poll them with a later `sandbox_exec` (`sleep 20; cat <status path>; tail -n 60 <log path>`). Keep each poll short: a `sleep` of at most 25 seconds and `timeout_seconds` of at most 45, because longer polls time out at the transport before the tool's own limit. The pass takes about a minute, the Whisper model download included.

If `video_analysis_status` still says queued after about five minutes, do not wait for it: build the brief from the frames and the transcript, poll it again between later phases, and fold the scene analysis in if it arrives. The frames are the ground truth for look and text in any case.

```sh
curl -fsSL -o ref.mp4 '<url>' \
&& ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of json ref.mp4 \
&& mkdir -p frames \
&& ffmpeg -v error -i ref.mp4 -vf fps=1,scale=270:-2 frames/f%03d.png \
&& ROWS=$(( ($(ffprobe -v error -show_entries format=duration -of csv=p=0 ref.mp4 | cut -d. -f1) + 5) / 6 )) \
&& ffmpeg -v error -i ref.mp4 -vf "fps=1,scale=180:-2,tile=6x${ROWS}" sheet.png \
&& ffmpeg -v error -i ref.mp4 -vn -ac 1 -ar 16000 ref.wav \
&& ffmpeg -v error -i ref.wav -af "asetnsamples=16000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=loudness.txt" -f null - \
&& python3 - <<'PY'
from faster_whisper import WhisperModel
m = WhisperModel("small")
segs, info = m.transcribe("ref.wav", vad_filter=False, word_timestamps=True, language=None)
print("language:", info.language)
for s in segs:
    print(f"{s.start:6.2f} {s.end:6.2f} {s.text.strip()}")
PY
curl -f -X PUT -H 'Content-Type: image/png' --upload-file sheet.png '<upload_url>'
```

The `tile` filter needs both dimensions on the sandbox's ffmpeg (`6x0` is rejected, and because the command is one chain, everything after it would be skipped); the rows are computed from the duration so that one sheet holds the whole reference. The PUT carries the `Content-Type` the `media_upload` result names, because the presigned URL is signed with it. Voice detection is off for the reference: under a music bed it dropped whole lines and returned fragments with impossible timestamps, with the default split and with a 300-millisecond one; set `language` when the product page gave it. The takes are clean speech and are decoded with detection on, as [captions.md](captions.md) says. The per-second loudness in `loudness.txt` shows where speech, music and silence are, which the transcript alone cannot.

To look at frames larger than the sheet, zip the `frames` directory and upload it as a general file (`media_upload` with a `.zip` filename, PUT with `Content-Type: application/octet-stream`, `media_confirm` with type `file`); the client downloads it and views the images.

Look at the contact sheet (by its hosted URL, or downloaded where the client can view images) and at individual frames for cast appearance and on-screen text. Frames are the ground truth for text, look and structure; the transcript is the ground truth for dialogue; the scene analysis, when it arrives, adds scene boundaries and descriptions to check the shot list against.

The frames, the sheet, the audio and the imported reference are for looking and listening only. None of them is ever passed to a model as a start frame, a reference, a motion source or an audio source, and none appears in the output. The cast section below is the source of the cast list and the portraits ([cast.md](cast.md)); it describes, it never copies.

## Template

```markdown
# Analysis brief: <reference name>

Duration: <s> · Frame: <w>x<h> (<aspect>) · Language: <code> · Shots: <n>

## Why it works
<The mechanism, not the content. Hook: what stops the thumb in the first two seconds and how (a question, a shock, a face, a claim). Tension: what the viewer wants resolved. Turn: the moment the ad changes direction. Payoff: what the product delivers and how it is shown. Call to action: its wording and timing. Pacing: how cut rhythm carries these. Keep: the mechanism, the medium and the look. Reinvent: the situation, the setting, the cast, the lines.>

## Medium and look
<Live action, 2D animation, 3D animation, stop motion or mixed, and the style in the words an image model follows: line (clean, sketchy, none), color and shading (flat, cel, painterly), backgrounds (painted, photographic), light, camera (static, slow pans, handheld), how faces are drawn, and how flat or rich the finish is (say "flat cel shading, no painterly rendering" when the reference is flat: image models default to a richer finish). This becomes the style line of phase 3.>

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
<One entry per person: apparent age range, build, hair, skin tone, clothing, expression, role; in an animated reference, how the style draws people (proportions, line, eyes). Descriptive only; never identify a real person.>

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

The message is short: the one or two things needed (for the reference, that the link must lead straight to a media file), one line on what happens next (the reference is analyzed, then a plan with its cost is shown), and nothing else. Never ask about language, length, captions, cast, setting, images or budget. Those are derived and shown at the plan checkpoint, where the user can change any of them. When the request already has both, there is no intake message at all.

## Product brief

From the product page (or the user's sentence), record:

- Name, what it is, who it is for: one line each.
- The tagline, if any, verbatim.
- The claims the page makes, as a short list. Only these, or what the user states, may be spoken in the ad.
- The page's language, which becomes the dialogue and caption language.
- The page's type and colors: font families from its stylesheet, the ground, text and accent colors, the logo's clear space ([design.md](design.md)).
- Images: the logo, one product image, and the photo of any person the site presents as the brand's own (a founder, a face of the brand, a mascot). Fetch the page in the sandbox (`curl -sL '<url>'`), read the `og:image` tag and the `img` sources whose path, alt or class mentions logo, product, hero, portrait or the product's name; download the candidates, look at them, and keep what serves: a logo for the end card and overlays, a product image for overlays and as a product reference where the video model takes one, a person's photo for casting ([cast.md](cast.md)). Import them with `media_import_url`. They are the advertiser's own assets and may be used as they are or as references; nothing is taken from any other site.

A text-only web tool gives the words; the images need the sandbox. Without either, ask the user for two lines about the product and go on without images.

# Analysis brief

The artifact of phase 2. Fill every section; write "none" rather than leaving a section out, so the user can see what was looked for.

## Sandbox pass

Run in one `sandbox_exec` call, started with `background: true`, while `video_analysis_create` is processing. `<url>` is a link the sandbox can download: the original link when it points straight at a media file, otherwise the hosted URL of the confirmed upload or import (`show_medias` with type `video` lists it). Before the call, reserve an upload for the contact sheet with `media_upload` (filename `sheet.png`) and put its `upload_url` on the last line, so the sheet can be looked at by its hosted URL after `media_confirm`. The call returns a pid, a log path and a status path; poll them with a later `sandbox_exec` (`cat <status path>; tail -n 60 <log path>`) every 30 seconds or so. Whisper downloads its model on first use, so allow one to three minutes.

```sh
curl -fsSL -o ref.mp4 '<url>' \
&& ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of json ref.mp4 \
&& mkdir -p frames \
&& ffmpeg -v error -i ref.mp4 -vf fps=1,scale=270:-2 frames/f%03d.png \
&& ffmpeg -v error -i ref.mp4 -vf "fps=1,scale=180:-2,tile=6x0" sheet.png \
&& ffmpeg -v error -i ref.mp4 -vn -ac 1 -ar 16000 ref.wav \
&& python3 - <<'PY'
from faster_whisper import WhisperModel
m = WhisperModel("small")
segs, info = m.transcribe("ref.wav", vad_filter=True, word_timestamps=True)
print("language:", info.language)
for s in segs:
    print(f"{s.start:6.2f} {s.end:6.2f} {s.text.strip()}")
PY
curl -f -X PUT --upload-file sheet.png '<upload_url>'
```

Look at the contact sheet (by its hosted URL, or downloaded where the client can view images) and at individual frames for cast appearance and on-screen text. Frames are the ground truth for text and look; the scene analysis is the ground truth for structure; the transcript is the ground truth for dialogue.

The frames, the sheet, the audio and the imported reference are for looking and listening only. None of them is ever passed to a model as a start frame, a reference, a motion source or an audio source, and none appears in the output. The cast section below is the source of the cast list and the portraits ([cast.md](cast.md)); it describes, it never copies.

## Template

```markdown
# Analysis brief: <reference name>

Duration: <s> · Frame: <w>x<h> (<aspect>) · Language: <code> · Shots: <n>

## Mood and pacing
<Two or three sentences: tone, energy, color, camera style, cut rhythm. Name the hook in the first two seconds.>

## Shot list
| # | In–out | What is on screen | Camera | Cut or move | Build route |
|---|---|---|---|---|---|
| 1 | 0.0–2.1 | ... | handheld close-up | hard cut | generate |

## Dialogue (as spoken)
| # | In–out | Speaker | Transcript |
|---|---|---|---|

## On-screen text and captions
| In–out | Text | Kind (caption / title / sticker / price / CTA) | Position | Look (font weight, case, outline, color) | Build route |
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

Ask these together, in one message, only where the request did not already answer. When the request names no reference or no product, this message is the first thing the user sees.

1. Which video is the reference? A file (uploaded through the widget) or a link straight to a media file. A YouTube link alone is not enough: it feeds the scene analysis but not the frames or the transcript. Short is better: analysis accuracy drops with length.
2. Which product or brand is this ad for, and what may it claim? With a link, say what was read from the page and ask only for corrections and for the claims.
3. What must be different from the reference: the product, the people, the words, the setting?
4. What language should the dialogue and captions be in? (Default: the language of the product's site or brief, else the reference's.)
5. Should the ad be the same length as the reference? (Default: yes.)
6. Keep the caption look of the reference, or use a specific style? (Default: the reference's.)
7. Do you have product images the video should match? (Upload if yes.)

State the defaults in the message, so that silence on a question means the default. Close by saying that each step will be shown for review before the next one starts, and that the user may say to go ahead alone once the estimate is accepted. The budget and the model are not asked here. They are asked in phase 4, with numbers in front of the user.

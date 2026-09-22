# Analysis brief

The artifact of phase 1. Fill every section; write "none" rather than leaving a section out, so the user can see what was looked for.

## Sandbox pass

Run in one `sandbox_exec` call while `video_analysis_create` is processing. Replace `<url>` with the hosted URL of the confirmed upload or import. Keep the timeout at the maximum and use `background: true` for a reference longer than about a minute.

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
```

Look at the contact sheet and at individual frames for cast appearance and on-screen text. Frames are the ground truth for text and look; the scene analysis is the ground truth for structure; the transcript is the ground truth for dialogue.

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

Ask these together, once, only where the input did not already answer:

1. Which product or brand is this ad for, and what may it claim?
2. What must be different from the reference: the product, the people, the words, the setting?
3. What language should the dialogue and captions be in? (Default: the reference's language.)
4. Should the ad be the same length as the reference? (Default: yes.)
5. Keep the caption look of the reference, or use a specific style?
6. Do you have product images the video should match? (Upload if yes.)

The budget and the model are not asked here. They are asked in phase 3, with numbers in front of the user.

# Regeneration

When a take's dialogue is ambiguous, regenerate that shot only. This page defines ambiguous, the retry budget, and the cheaper alternatives to try first. The agent applies it on its own as the takes come in; the user sees every verdict at the clean-master checkpoint and can ask for a retry there.

## What counts as ambiguous

Judge each take right after it is generated, from watching it and from its Whisper transcript compared with the intended line.

| Verdict | Definition | Action |
|---|---|---|
| Clear | The transcript matches the intended line, or differs only in filler, contraction or punctuation. Meaning identical, no wrong word a listener would notice. | Accept. |
| Close enough | One ordinary word differs but the meaning is the same, and the brand name and every signature phrase are exact. Delivery is natural. | Accept. The caption still shows the intended line. |
| Ambiguous | A wrong or missing word changes the meaning; the brand or product name, or a signature phrase such as the tagline, is wrong, slurred or a near-homophone; the line is cut off, mumbled, overlapped by another voice, or in the wrong language. | Fix in code if possible, otherwise regenerate. |
| Broken | No speech where there should be, or speech where there should be none, judged from loudness and Whisper's no-speech probability, not from the transcript alone. | Regenerate. |

Do not chase a perfect match. Two takes with the same meaning are both fine; the credits are better kept for a shot that is actually wrong. The exception is the brand's own words: a tagline said almost right is said wrong, because the audience knows it.

## What the transcript cannot decide

- On near-silence, Whisper invents stock phrases. Before calling a silent shot "speech where there should be none", measure: a stretch more than about 12 dB under the take's real speech, with a no-speech probability above 0.5, is silence whatever the transcript says. Frames showing a closed, still mouth confirm it.
- Whisper normalizes dialect and homophones to standard spellings (a regional "you" becomes the standard one, two words that sound like one are written as one), and the medium model does the same as the small one, so the transcript cannot arbitrate a pronunciation question. Two free checks in the sandbox can: a 10-millisecond RMS envelope over the disputed word, where a closure gap of about 100 milliseconds means two words and its depth and length compare takes; and a second decode with the intended line as Whisper's `initial_prompt`, which shows whether the audio supports the intended reading. When the checks tie, prefer the take made with the explicit pronunciation instruction, and say in the delivery that the machine check is not conclusive.

## Try code first

Before spending credits, check whether the edit can absorb the problem:

- A bad word at the end of a line: trim the take there and cut to the next shot early.
- A bad word in the middle: cut around it on a beat, cover with a sound effect, or cut to an insert (product shot, title card) over the bad part while keeping the good audio.
- A line that is fine but too quiet or too loud: normalize in the mix.
- A line that is right but the caption is off: fix the caption alignment, not the take.

If none of these keeps the meaning and the delivery natural, regenerate.

## How to regenerate

- Same model, same tier, same duration, same aspect ratio. Regeneration is not the moment to upgrade quality.
- Put the intended line in the prompt verbatim, in quotes, and state explicitly that the character says exactly these words, in which language, and nothing else. Keep the visual prompt unchanged so the take still cuts with its neighbors.
- Aim the retry at the word that failed. When the user rejects a take, quote their complaint word for word and check that word in the review; a retry that fixes a different word is a wasted take.
- Fix the word as "Pronunciation" below says, before spending the take.

## Pronunciation

Video models with native dialogue have no pronunciation dictionary, and the transcript often cannot even show the fault. This is the procedure; do not research it again.

1. **Write the line so it can be said.** Five to ten words per line, moderate speed, one language per line, the face front-on or three-quarter with the mouth unobstructed, no head turn while speaking. Put the line in quotes and say that the character speaks exactly these words in that language with natural standard pronunciation and nothing else. Longer speeches are split across shots.
2. **Respell a word the model gets wrong, in the prompt only.** Write it the way it should sound, in the language's own script: for Korean, the standard pronunciation in Hangul (an aspirated cluster such as ㄱ, ㄷ, ㅂ or ㅈ before ㅎ becomes ㅋ, ㅌ, ㅍ or ㅊ, so "적혔다" is prompted as "저켰다"); for English, hyphenated syllables with the stressed one in capitals. The intended line and the caption keep the correct spelling. This is the dictionary trick of text-to-speech tools, and it is the first retry.
3. **Change the word if the respelling fails.** A synonym without the difficult sound, chosen with the user, is cheaper than another take.
4. **Check the word, not the sentence.** Whisper normalizes spellings, so decode once plainly and once with the intended line as `initial_prompt`, listen to the envelope of that syllable (an aspirated consonant shows a burst and a noisy onset before the vowel; a dropped one does not), and compare with the rejected take.
5. **Record the outcome** in tool-notes.md: the word, the respelling, whether it worked, the model and the date.
- Start from the same approved first frame and pass the same portrait as identity input, exactly as in the first take ([cast](cast.md)), so the cast and the composition stay consistent. Nothing from the reference video, ever.
- Generate one take. Judge it by the same table.

## Retry budget

- One retry per shot comes out of the reserve the user accepted and is taken without asking.
- A second retry for the same shot needs the user's consent, with the ledger shown: what was spent, what is left, and what the alternative in code would look like.
- When the reserve is gone, every retry needs consent.
- Never regenerate a shot that was already accepted to make it "better". Only ambiguous or broken takes are retried.

## Record it

Each retry is a row in the budget ledger with the reason (ambiguous: which word; broken: what happened) and the verdict of the new take. The ledger is part of the delivery.

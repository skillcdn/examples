# Regeneration

When a take's dialogue is ambiguous, regenerate that shot only. This page defines ambiguous, the retry budget, and the cheaper alternatives to try first.

## What counts as ambiguous

Judge each take right after it is generated, from watching it and from its Whisper transcript compared with the intended line.

| Verdict | Definition | Action |
|---|---|---|
| Clear | The transcript matches the intended line, or differs only in filler, contraction or punctuation. Meaning identical, no wrong word a listener would notice. | Accept. |
| Close enough | One word differs but the meaning is the same and the brand or product name is right. Delivery is natural. | Accept. The caption still shows the intended line. |
| Ambiguous | A wrong or missing word changes the meaning, the brand or product name is wrong or slurred, the line is cut off, mumbled, overlapped by another voice, or in the wrong language. | Fix in code if possible, otherwise regenerate. |
| Broken | No speech where there should be, or speech where there should be none. | Regenerate. |

Do not chase a perfect match. Two takes with the same meaning are both fine; the credits are better kept for a shot that is actually wrong.

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
- Where the model accepts a reference image or the previous take as identity input, pass it so the cast stays consistent.
- Generate one take. Judge it by the same table.

## Retry budget

- One retry per shot without asking; it comes out of the reserve the user accepted.
- A second retry for the same shot needs the user's consent, with the ledger shown: what was spent, what is left, and what the alternative in code would look like.
- When the reserve is gone, every retry needs consent.
- Never regenerate a shot that was already accepted to make it "better". Only ambiguous or broken takes are retried.

## Record it

Each retry is a row in the budget ledger with the reason (ambiguous: which word; broken: what happened) and the verdict of the new take. The ledger is part of the delivery.

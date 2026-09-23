# Model selection and credit estimate

The user chooses between the Kling and Seedance families. The skill never picks for them, and never pins a version: the latest general model of each family is discovered at run time.

## Finding the latest model

```
models_explore  action: search  type: video  query: kling
models_explore  action: search  type: video  query: seedance
```

From each result, pick the model that is:

- the highest generation number in the family,
- a general text-to-video or image-to-video model, not a turbo, edit, extension or legacy variant, not a product wrapper around one of these,
- able to produce 9:16 and native audio when the brief has spoken lines.

Then read its parameters with `models_explore action: get`. Two things matter: the duration range or options, and how quality is selected.

## Lowest tier

| The model exposes | Lock |
|---|---|
| A `resolution` parameter that includes `480p` | `480p` |
| No resolution parameter, but a quality `mode` | The lowest mode, `std` |
| Both | `480p` and the lowest mode |
| Neither | The model's default; say so in the estimate |

Do not use a higher tier for drafts, even when the difference in credits looks small. The user can upscale an accepted cut later with `upscale_video` if they want; that is a separate, quoted step.

Audio: keep native audio on for shots with dialogue or diegetic sound, off for shots that get music or a voice-over in the edit. Turning audio off is usually cheaper, so it shows in the preflight.

## Preflight

For each shot and each family, call `generate_video` with the shot's exact parameters and `get_cost: true`. Nothing is submitted and nothing is charged. Do it for every shot, because cost depends on duration and audio and shots differ. Because it is free, it is done before the user sees the plan (phase 4), and again for any shot the user changes.

```
generate_video  params: { model: <id>, prompt: <shot prompt>, duration: <s>, aspect_ratio: "9:16", <tier parameters>, get_cost: true }
```

Images are preflighted the same way, with `generate_image` and `get_cost: true`: one portrait per cast member, and, for a family whose video model takes only a start frame, one first frame per shot with a character. Which route each family needs, and how to find the image model, is in [cast.md](cast.md). The image reserve is one extra portrait per cast member.

## The estimate

```
Family     Model      Tier   Video per shot        Images                              Reserve            Total
Kling      <latest>   std    10, 10, 20, 10 = 50   2 portraits 4 + 4 first frames 8    +20 video, +4 img  86
Seedance   <latest>   480p   15, 15, 30, 15 = 75   2 portraits 4                       +30 video, +4 img  113
Balance: <credits> · Free-trial unlimited generations: <available or not>
```

The numbers above are illustrative, shaped like preflights for 5- and 10-second 9:16 shots with audio and 1k portraits. They are not current prices. Present only numbers that came back from `get_cost` in this run.

With the table, give the user the qualitative difference for this brief in two or three lines, drawn from the catalog: which family takes the approved portrait as an identity reference and which needs a first frame per shot (that is where the image cost differs), which one handles multi-shot continuity, which one supports the longer durations the shot list needs. Then ask:

1. Are the cast list and the shot list right, or what should change?
2. Kling or Seedance?
3. Is the total, including the reserve, accepted as the budget for this run?

All three answers stand for the rest of the run. If the user later asks for more shots or more retries, re-quote and re-ask.

## Free-trial unlimited generations

If the catalog reports that the user's account can spend free-trial unlimited generations on a model, say so in the estimate. Use `use_unlim: true` only when the user explicitly asks for it; never add it to save credits on their behalf, and never drop it once they asked. A rejected unlimited request comes back as an error, never as a silent charge.

Set `use_unlim` explicitly on every generation call: `false` unless the user asked, `true` when they did. Left out, the server may withhold the job and return a question (`unlim_choice`) instead of a take. If that happens anyway, put the question to the user once and call again with their answer.

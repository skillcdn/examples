# Cast images

Every person in the ad has an approved portrait. The portrait keeps the character the same from shot to shot, and it is what the user approves before any video credit is spent. Nothing from the reference video is used for it: not a frame, not a crop, not a description that names one of its people.

## Who needs a portrait

One portrait per cast member in the shot list: the people named in the brief's "Cast" section, rewritten in phase 3 for the user's product and for what must differ. A voice-over with nobody on screen needs no portrait. A product is not a cast member; it appears through the product site's images, a user-supplied image or an overlay, as [editing-decisions.md](editing-decisions.md) says.

A person the product's own site presents (its founder, its face, a mascot) is the advertiser's own asset and may be cast when the composition calls for it. Their site photo, imported with `media_import_url`, is then the portrait itself; when the plan wants a different look (period clothing, a setting), the image model makes the portrait with that photo as its reference input, and the user approves it like any other. The plan checkpoint says whether a site person appears.

## Which image model

Find it at run time, never pin it:

```
models_explore  action: recommend  type: image  query: photoreal portrait of a fictional person from a text description, identity reference for video generation, text-only input
```

Take the recommendation for character identity that works from a text prompt alone, and read its parameters with `action: get`. Lock the cheapest setting it exposes: the lowest `resolution` or `quality`, a `budget` parameter at its minimum. A 1k image is more than the video model needs. Preflight with `generate_image` and `get_cost: true`, once per model and setting, and put the sum in the estimate.

The identity model may output a single aspect ratio and take no reference input; that is fine for a portrait. First frames (below) need a different kind of model, one with an image-reference role: find it with a second `models_explore` query (`recommend`, type `image`, "photoreal scene from a reference portrait, image reference input"), lock its cheapest setting, and preflight it too. Read the video model's `aspect_ratios` and `medias[].roles` in phase 4 so that every image is made in a ratio the role accepts.

## Two routes into the video model

| The video model exposes | Route | Images needed |
|---|---|---|
| An identity role (`image_references` or similar) | The approved portrait goes into every shot of that character as the identity input | One portrait per cast member |
| Only a `start_image` role | The portrait is turned into a 9:16 first frame for each shot, by the reference-capable image model with the portrait as its reference input and the shot's setting and pose in the prompt; that frame is the shot's `start_image` | One portrait per cast member, plus one first frame per shot with that character |

Both routes are quoted in the estimate, and the difference is part of why the user picks one family over the other. First frames are shown to the user with the take they open, not approved separately, unless the user asks.

## The portrait prompt

One paragraph, in this order, built from the brief's cast description as rewritten in phase 3:

1. Framing: photo, head-and-shoulders portrait, three-quarter view, eyes to camera. (A first frame instead describes the shot's opening framing, setting and pose.)
2. The person: apparent age range, build, hair (color, length, style), skin tone, the facial features that matter, expression, one line on how they carry themselves.
3. Clothing and accessories, exactly. They are repeated word for word in every video prompt for that character.
4. Setting and light matching the ad's mood; for a pure identity portrait, a plain neutral background in soft daylight.
5. Style: photoreal, unretouched, natural skin texture, unless the reference is animated or stylized, then its style in words.
6. Never: a person from the reference, a celebrity likeness, a logo on clothing, text anywhere in the image. A person from the product's site is cast from that site's photo as a reference input, not described from memory.

## Approval loop

1. Generate one portrait per cast member, one at a time, `count` 1, `use_unlim` set explicitly.
2. Show each portrait with its hosted link and the description it was made from. Ask: approve, or what to change (age, hair, clothing, expression, setting, style).
3. A change is a new generation from the edited description, preflighted and recorded in the ledger. The reserve covers one retry per cast member; beyond that, ask before generating.
4. The approved portrait's media id or job id goes into the shot list. Every video prompt for that character repeats the clothing and the two or three most identifying traits, so the model has the words as well as the picture.

When the user has said to go ahead without reviews, judge each portrait against its description yourself (age, hair, clothing, expression; no text; no artifacts) and regenerate at most once.

## Reuse

Keep the portrait media ids in the shot list and in the ledger. A later run for the same brand can reuse an approved portrait instead of generating a new one; offer it, and let the user decide.

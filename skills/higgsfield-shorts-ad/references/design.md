# Design: type, color, on-screen text and the end card

The text in the ad is part of the brand. Nothing is left to a burner's default, and the end card is designed, not typed.

## Where the look comes from

1. **The product's site.** Read its stylesheet in the sandbox (`curl -sL` the page, then the linked CSS): the `font-family` stacks for headings and body, any Google Fonts link, the CSS color variables or the three dominant colors (ground, text, accent), the logo's clear space. Record them in the intake record.
2. **The reference.** Where its captions sit, their size relative to the frame, weight, case, whether text pops or holds, and how on-screen text is used (thoughts, labels, stickers).
3. **The product.** What the ad must feel like: premium, playful, urgent, traditional. The type follows the feeling when the site's own type cannot be used.

## Choosing the type

- Use the site's own family when it is an open-license font that can be downloaded (most Google Fonts, SIL Open Font License). Otherwise the closest open-license family in the same classification: serif for serif, geometric sans for geometric sans, display for display, hand for hand. Two weights at most, one family for captions and text, a second only for the brand name if the site does so.
- Check glyph coverage for the dialogue language before anything is rendered; the sandbox's preinstalled caption fonts cover Latin only ([captions.md](captions.md) says where to fetch others).
- Never the "default subtitle" look (bold white sans, black outline, bottom center) unless the reference itself is UGC-style and the brand has no type of its own.

## Type system

Sizes are for a 1080x1920 frame and scale with the output.

| Element | Size | Style | Placement |
|---|---|---|---|
| Captions | 4.5 to 5.5 percent of frame height | Brand text color when it reads against the footage, else white; a soft shadow or a 2 px outline; sentence case unless the reference uses caps | Where the reference puts them, inside safe zones, never over a face |
| On-screen text (thoughts, labels) | 6 to 8 percent | The brand's display style; the accent color for one word at most | Near the subject, inside safe zones |
| End card | Three sizes at most: brand name 9 to 11 percent, tagline 5 to 6, body or address 3.5 to 4 | Brand ground color or a darkened still under it; text color and one accent; letter-spacing for uppercase Latin; line height 1.3 | Logo above or left of the name, 8 percent margins, a column no wider than 84 percent |

Contrast of body text against its ground at least 4.5:1. One accent color. A slow move (zoom or fade) on the end card, on screen for four to six seconds. The address and the call to action are the last things to fade.

## Building it in the sandbox

- Compose the end card and any multi-line text as a PNG with Pillow (kerning, line height and alignment are controllable there), then overlay it with ffmpeg; use `drawtext` from a file with `expansion=none` for single lines.
- Rasterize the logo from its SVG at the size needed (`rsvg-convert`), keeping the brand's clear space.
- Verify at output size: a frame at the end card's midpoint and one per text moment, read at 480p; strokes not thinner than 2 px at 480p, text inside safe zones, nothing over a face, colors as specified.

## What to show the user

At the plan checkpoint, one line: "Type: <family>, from the site; colors: <ground>, <text>, <accent>." At the clean-master checkpoint, the end card's frame is in the check strip. A user who wants another look names it there.

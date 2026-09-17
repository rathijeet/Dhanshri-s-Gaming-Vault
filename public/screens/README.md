# Monitor footage

The 3D test drive plays a real clip on the monitor so the customer sees the
machine doing the thing they asked about, rather than an illustration of it.

Drop clips here, named exactly. `.mp4` is tried first, then `.webm` — either
works, and you only need one per row.

| File          | What it should show                                              |
|---------------|------------------------------------------------------------------|
| `gaming.mp4`  | A game actually running — first-person movement reads best        |
| `creator.mp4` | A video editor with a timeline being scrubbed, preview playing    |
| `ai.mp4`      | A terminal training or prompting a model, tokens streaming        |
| `office.mp4`  | A spreadsheet or doc being worked on                              |

Any row with no file falls back to the hand-drawn scene in
`src/systems/screenContent.js`, so the viewer never breaks on a missing clip.
The same clips play on every monitor in the lab view, one workload per desk.

## Rules for the footage

- **It must be ours or licensed for commercial use.** This plays on a page that
  sells machines. Captured gameplay of a commercial title, a YouTube rip, or a
  stock clip without a commercial licence is not usable here. Record it on a
  shop machine, or buy a licence.
- No faces, no customer data, no visible account names or licence keys.

## Encoding

Short loops, no audio, small files — this is a texture, not a video player:

    ffmpeg -i source.mov -t 12 -an -vf "scale=1280:-2,fps=30" \
      -c:v libx264 -crf 30 -preset slow -movflags +faststart gaming.mp4

Aim for **under 2 MB each**. They load on the test drive, which is already the
heaviest thing on the page.

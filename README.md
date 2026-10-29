# Self-Measure Kit

**A 6-step wizard that lets a customer measure their own kitchen, closet or mudroom — and hands the shop a quote-ready summary.**

Live demo: **https://marksong0917.github.io/measure-kit/**

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![No build step](https://img.shields.io/badge/build-none-blue.svg)
![Runs in the browser](https://img.shields.io/badge/runs-100%25%20in%20the%20browser-blue.svg)

## Why

The first site visit is the most expensive free thing a cabinet or closet shop does: drive out, measure, drive back, then quote. Most of those visits never needed a truck — the customer can measure a room with a tape measure if you ask the right questions in the right order.

This kit asks them. The customer ends with a clean, structured summary; the shop quotes from it and only rolls a truck for jobs that are real.

## How the wizard works

1. **Space** — kitchen, closet, mudroom or other.
2. **Room size** — length, width and ceiling height in centimetres (with a feet/inches helper note), each field validated as it's entered.
3. **Wall by wall** — the customer ticks the walls that get cabinets and counts doors, windows and obstacles on each. The cabinet run total comes from these walls.
4. **Photos** — one per wall, previewed on-device (in this demo nothing uploads).
5. **Style** — finish level (which drives the price range), door style, finish and hardware.
6. **Contact** — name and email, validated inline.

The result is a plain-text summary: room dimensions, each selected wall with its run and obstacle counts, total cabinet run, style picks, finish level, a rough budget range, and contact details — with **Copy summary** and **Download (.txt)** buttons.

## The rate card (CONFIG)

Everything price-related lives in **one `CONFIG` object at the top of `script.js`**. The demo ships with sample rates aligned with the companion [Trade Estimator demo](https://marksong0917.github.io/estimator/), so the two tell one consistent story:

| Space | Base rate (CAD / metre of run) | Finish-level multipliers |
|---|---|---|
| Kitchen | $1,800 – $2,600 | Standard ×1 · Premium ×1.5 · Luxury ×2.2 |
| Closet | $900 – $1,400 | Standard ×1 · Premium ×1.4 · Luxury ×1.9 |
| Mudroom | $1,100 – $1,600 | Standard ×1 · Premium ×1.4 · Luxury ×1.9 |
| Other | $1,000 – $1,500 | Standard ×1 · Premium ×1.4 · Luxury ×1.9 |

Budget range = metres of cabinet run × base rate × finish-level multiplier.

**These are sample demo numbers — not any real shop's pricing.** They exist so the demo produces a believable range. The page says so in the footer, and the code says so in the CONFIG comment.

## Make it yours

A shop adopting the kit edits `CONFIG` and nothing else to start:

1. `shopName` — your shop's name (appears in the summary header).
2. `rates` — your real per-metre base rates and finish-level multipliers, per space.
3. `sizeLimits` — sane min/max room dimensions for your work.
4. Point the result step at your own intake: the live version of this kit delivers the summary (with photos attached) into [Foxuma](https://foxuma.com), the shop system this demo family was built around — but the summary is plain text, so email or any CRM inbox works too.

No build step, no dependencies: open `index.html`, or drop the three files (`index.html`, `styles.css`, `script.js`) on any static host.

## Files

| File | What it is |
|---|---|
| `index.html` | The wizard markup — six steps plus the result panel |
| `styles.css` | All styling (light, shop-friendly, mobile-first) |
| `script.js` | CONFIG + wizard logic: navigation, validation, wall builder, summary math |

## Credits

By **Ze (Mark) Song** — [portfolio](https://marksong0917.github.io/) · companion demos: [Trade Estimator](https://marksong0917.github.io/estimator/) · [Foxuma demo](https://marksong0917.github.io/demo/)

## License

[MIT](LICENSE) — use it, adapt it, sell the service around it. Keep the sample-price honesty note if you ship the demo rates.

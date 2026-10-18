# Fluorescence Spot Detection

Open `showcases/flurescene-spot-detection/index.html` from the site's static `docs/` root. The homepage and gallery
include this case in Scientist-aligned problems, with the existing return-to-demo
navigation. No model, training job or evaluator runs in the browser.

## Presentation contract

This is an extension of the existing Scientific Co-working showcase, using its
actual `workflows.css` and the site's `website-shell.css`. The navigation,
1160px page width, system font, blue/white/slate palette, 6–10px corner radii,
hero, workbench, playback controls, result metrics, evidence disclosure and
footer follow that page. `flurescene-spot-detection.css` only adapts the chart, eight-step sequence
and microscopy comparison. Existing showcase styles and behavior are unchanged.

Design read: scientific evidence for the existing model-site audience; extension
mode. Visual variance 3, motion 3, information density 7, asset dependence 8,
brand fidelity 10. Native microscopy imagery supplies the visual; typography,
spacing and component states come from the existing showcase. Playback is
explicit, pauses off screen/in hidden tabs, and honors reduced motion. All
controls are keyboard accessible; the score table is the text equivalent of the
chart. Layouts reuse the existing tablet and phone breakpoints.

## Evidence and the requested correction

The provided `refined-showcase/figure-data.json` supplies the `spots` records,
sample image and coordinates. The `spots-comparison*` files supply the matching
indices, metrics and original comparison figure. Per-submission labels and
trace references are preserved. The 72 original F1 values were also checked
against the supplied full-run `submissions.jsonl`.

The user corrected **aggregate_improvement from -0.0469 to 0.1158**; the absolute
increase is **0.1627**, not a percentage or relative growth rate. No corrected
intermediate values or recalculation formula were supplied. Therefore the
aggregate result is presented as endpoints and the eight-submission trajectory
plots original per-instance F1. Original aggregate plots and evaluation receipts
containing superseded aggregate values are not republished. No interpolation,
rescaling, best-so-far smoothing or new aggregate computation is used.

The optimization trajectory is the supplied recorded run. Its model attribution
is omitted following the user's correction; no replacement model is assumed.
The prediction
comparison is the supplied **separate** 20261015 seed-1 run, not any point on the
optimization curve. Both origins are identified in the page. Its fixed first
DNA-FISH field has 99 reference spots, 109 predictions, 96 matches, 13 unmatched
predictions and 3 missed reference spots. Matching uses the supplied Hungarian
assignment with a 3-pixel cutoff. Original F1, precision and recall remain at
full precision in JSON; the UI rounds only their presentation.

The displayed PNG is decoded byte-for-byte from the supplied image data URI.
Coordinates, image dimensions, full-frame extent and contrast are unchanged.
`field.svg` overlays matched detection rings at their original coordinates.
The cover is a separate, hand-authored SVG illustration of fluorescence spot
detection: translucent cells, puncta, detection rings and a magnified localization
view. Its blue/slate palette, transparent 800 × 488 canvas and right-positioned
composition match the neighboring scientific covers. It contains no raster
image or experimental score and is not overwritten by the data export script.
The original comparison SVG, PDF and metrics are copied byte-for-byte. The
caption uses model-neutral wording for the optimization submissions.
`source-manifest.json` records source hashes and the presentation corrections.

## Regeneration and checks

Run `python scripts/build_flurescene_spot_detection.py` from the repository root, or pass a different
path to the supplied `refined-showcase` directory. The script exports the local
display assets, CSV and JSON; it does not edit the research source data or any
other showcase. If `index.html` changes, refresh its SHA-256 entry in
`docs/site-manifest.json`, following the site's maintenance convention.

Check JavaScript syntax, relative links and anchors, the site manifest, all F1
values against source and full-run records, original-file hashes, matching
counts and the 3-pixel assignment before delivery. Browser acceptance is not
part of the recorded verification unless explicitly requested.

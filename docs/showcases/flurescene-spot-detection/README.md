# Fluorescence Spot Detection

Open `showcases/flurescene-spot-detection/index.html` from the site's static `docs/` root. The homepage and gallery
include this case in Scientist-aligned problems, with the existing return-to-demo
navigation. No model, training job or evaluator runs in the browser.

## Presentation contract

This directly follows the existing Computational Chemistry showcase, loading
its actual `index-0-bb0da56d112e.css`, local Showcase font, and the same site
shell, light theme and integration styles. The question-led hero and finding,
research-value cards, workspace browser and process player, three findings,
tabbed evidence, research brief and footer follow that page's structure and
writing style. Page width, typography, spacing, colors and component shapes
come from the reference. `flurescene-spot-detection.css` only adapts the original
score chart, research records and microscopy comparison. The reference files
and all other showcase styles and behavior remain unchanged.

Design read: scientific evidence for the existing model-site audience; extension
mode. Visual variance 3, motion 3, information density 7, asset dependence 8,
brand fidelity 10. Native microscopy imagery supplies the visual; typography,
spacing and component states come from the reference showcase. Playback starts
only on request and suspends off screen/in hidden tabs; a reduced-motion
preference change pauses it. Controls support keyboard input, evidence tabs
support arrow-key navigation, and the score table is the text equivalent of
the chart. Layouts reuse the reference tablet and phone breakpoints.

## Process animation

`process-animation.js` draws a 32-second Canvas reconstruction, following the
reference page's process-film pattern. It includes the nine-dataset task,
eight recorded method changes and the final results: detector selection,
test-time augmentation, peak tuning, the DNA-FISH method switch, retraining,
shared preprocessing, spot-weighted loss and final inference tuning.
The player supports play, pause, seek, replay and supported full-screen mode.
Selecting a research record opens its scene; selecting a dataset changes the
original score readout. The evidence chart remains independently inspectable.

This is a schematic, time-compressed animation, not a screen recording or a new
training run. No intermediate microscopy images or aggregate scores are
invented. The separate retained DNA-FISH image is shown only in the hero and
comparison evidence, never as an optimization output in the process film.

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

The DNA-FISH PNG is decoded byte-for-byte from the supplied image data URI.
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

## Additional microscopy comparisons

The Spot comparison tab adds Telomeres, HybISS and MERFISH beside DNA-FISH,
using the first test image in filename order for each dataset (`img_001.tif`
for all three additions). Selection precedes reading scores; this is one fixed
field per dataset, not an exhaustive image browser or a selection of the best
predictions. All four fields use saved predictions from the same separate
20261015 seed-1 run. Switching the microscopy field does not change the selected
optimization dataset or submission.

`spot-gallery-data.json` and its script companion contain the three new fields,
original coordinates, source-file hashes, matching indices and image metrics.
Matching uses the existing visualizer's squared-distance Hungarian assignment,
3-pixel cutoff and F1 epsilon. These newly calculated image metrics describe
the stored coordinates; they do not replace any original optimization score.
Both panels use the same full-frame PNG, with linear contrast from the raw
TIFF minimum to its 99.8th percentile and no spatial resizing or cropping.
Marker sizes adapt to image dimensions so dense fields remain inspectable.

The picker updates both images, all four annotation layers, spot counts, F1,
precision, recall and download links together. Layer visibility persists across
datasets. Images load before swapping; a failed load retains the previous field
and supports retry. Full-resolution SVG comparisons, unannotated PNGs and
unchanged source coordinate CSVs are exported under `assets/gallery/`.

## Regeneration and checks

Run `python scripts/build_flurescene_spot_detection.py` from the repository root, or pass a different
path to the supplied `refined-showcase` directory. The script exports the local
display assets, CSV and JSON; it does not edit the research source data or any
other showcase. If `index.html` changes, refresh its SHA-256 entry in
`docs/site-manifest.json`, following the site's maintenance convention.

The export also calls `build_flurescene_spot_gallery.py`, which requires NumPy,
Pillow and SciPy, plus read access to the raw TIFF, ground-truth CSV and retained
prediction paths recorded by the supplied DNA-FISH source. To regenerate only
the added gallery, run `python scripts/build_flurescene_spot_gallery.py` from the
repository root. Neither export trains a model or generates new predictions.

Check JavaScript syntax, relative links and anchors, the site manifest, all F1
values against source and full-run records, original-file hashes, matching
counts and the 3-pixel assignment before delivery. Browser acceptance is not
part of the recorded verification unless explicitly requested.

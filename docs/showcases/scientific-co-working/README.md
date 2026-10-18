# Scientific Co-working

Ten selected professional workflows, integrated into the A1.5 homepage. The
collection uses the shared light blue shell, illustrated case navigation, a
native-data scene and five edited execution chapters. No model or solver runs
in the browser.

## Cases and links

Open `index.html?study=<slug>` or use the task ID. RISC-V FPGA implementation is the
default case; all ten cases have the same presentation weight. Their order follows Figure 8
of the A1.5 technical report.

| Task | URL slug | Recorded evidence |
| --- | --- | --- |
| t124 | riscv-fpga | Native configuration tiles and post-route timing |
| t101 | chip-eco | Native placement, clock routes and routed ECO |
| t093 | aerodynamics | Three profiles, native mesh and K17 steady flow |
| t115 | thermal-model | 48 native temperature frames and steady load curve |
| t188 | emergency-response | Three GeoPackage deployments and primary routes |
| t141 | quantum-compilation | 150 field comparisons and three discrepancies |
| t134 | materials-audit | Host lattice and recorded defect energy curves |
| t026 | financial-data | 18 selected/rejected publication requests |
| t030 | dns-forensics | Corrected probe observations and ordered fragments |
| t100 | document-security | Released PDF page and object cleanup schematic |

The original aerodynamics and quantum detail views remain available at
`two-study-evidence.html?study=<slug>#evidence`, linked through "View detailed
results" in "About this case". Existing `index.html?study=aerodynamics` and
`index.html?study=quantum-compilation` links open the corresponding new case.

## Source and interpretation

The data and rendering foundation come from the colleague-provided
`Agents-A1.5-main` ten-case handoff and its `candidate/final_v1018_001` package.
`assets/professional/` retains the public display exports byte-for-byte. Scores
and run statuses agree with the final catalog. Raw trajectories, private
reasoning, credentials, evaluator files and sensitive PDF source material are
not part of this addition.

`casebook.js` contains edited operation summaries, not verbatim agent dialogue.
Each case has `background`, `approach` and `deliverables` fields for the
collapsed "About this case" section. It introduces the task, summarizes the
method and explains the outputs in two columns. Scores and run metadata remain
in the display data but are not rendered in this section. The hero caption
follows the same narrative: "TASK → APPROACH → OUTCOME".

Emergency deployment counts are 17, 19 and 23 units, taken from the native
GeoPackages. K17 and K88 are both feasible; K17 wins the prescribed comparison.
Quantum and materials cases show discrepancies found by the audit. Thermal
frames share a fixed 22–48 °C scale. Illustrative movement is not solver time,
vehicle telemetry, electrical activity or a new simulation.

## Implementation and preview

- `workflows.js`: case selection, lazy loading, playback and keyboard controls.
- `visuals.js`, `quantum.js`, `systems.js`: native-data scene renderers.
- `readouts.js`: readable text equivalents of the selected data.
- `thumbnails.js`, `workbench.svg`: illustrative navigation and hero artwork.
- `workflows.css`: desktop, tablet and phone layout.

Serve the repository's `docs/` directory with a static HTTP server. All runtime
assets are local. The walkthrough is 12 seconds with pause, seek, chapter,
speed and full-screen controls. Playback pauses off-screen and in hidden tabs.
Reduced-motion preferences show the final state without autoplay. Phones use
a case selector and scrollable cards; exact selected values remain ordinary
HTML text beneath the visualization.

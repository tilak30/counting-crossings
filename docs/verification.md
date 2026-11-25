# Counting Crossings verification

This record separates prior checks, observed revision checks and work still needed. Revision review: November 18, 2026. The student approved this revision for GitHub publication after reviewing the private preview. Public deployment is verified separately during release.

## Final release checks

November 25, 2026. The final release keeps native JavaScript/SVG and the existing data model and encodings. Project-specific motion logic lives in `dist/chart-motion.js`; all generated HTML copies are built by `scripts/build_standalone.py`.

- All 13 Node tests passed; checked both JavaScript entry files for syntax errors.
- Chromium opened the final standalone file directly with 813 records and no console or page errors. Fair + Poor produced 526 records; Manhattan narrowed the selected subset to 138 and 3,441,070.5 sq ft while the condition and borough denominators remained 189 and 526, respectively.
- Fair group statistics matched the expected table (PED-coded: n=103, 1,500 sq ft, 3 spans; other codes: n=415, 6,517 sq ft, 2 spans).
- Exercised point selection, rectangle brushing from the structure chart, clearing, Reset, no-match search, tooltips, CSV export and keyboard row activation/focus. The test brush selected 85 records and updated both summaries.
- Verified that the short cue appears on affected views, expires, and does not supersede the active row/chip. With reduced motion enabled, the cue remains available without fading or mark motion.
- Checked layout from 320 to 1440 px without page-level horizontal overflow; the detailed plot/table may scroll inside their panel on small screens. Inspected a greyscale rendering for redundant labels, hatching, symbols and lane positions.
- Peer evidence is written task feedback from two reviewers on the pre-revision live build. Final screenshots and checks are developer verification, not a peer retest. No observer timing, touch-device study or screen-reader certification is claimed.

## Revision checks completed

- Thirteen automated Node tests pass. They cover the complete unique inventory, condition totals, selected-cohort aggregation, separate condition/borough comparison contexts, preservation of other filters and explicit point selections, fixed full-inventory baseline values, exact medians for both groups, absent/single/even-sized groups, non-mutation, rating/PED filters, identifiers, empty results and search/minimum area/reset.
- Browser checks observed 813 records initially, 526 after selecting Fair + Poor, and 138 after adding Manhattan. The condition chart retained all 189 Manhattan records as its comparison population; the borough chart retained all 526 Fair/Poor records. Manhattan remained 138 / 526 = 26.24% instead of becoming 100%.
- The full-inventory borough reference values remained unchanged while filters changed. Selected comparison marks and full-inventory marks are separate encodings; tooltip differences use percentage points, not within-borough condition rates.
- Browser checks exercised the bridge-group and rating-basis filters: 133 PED-coded records and 11 legacy exceptions. A minimum area of 100,000 sq ft returned 28 records. A no-match search produced an empty result and could be cleared.
- Point selection, pinned details and clearing were exercised. A box selection returned 84 records in the observed browser rectangle; this count describes that particular rectangle, not every brush. Clearing and Reset restored the broader population.
- Exact median expectations were checked against the full CSV. For Fair, PED-coded n = 103 has median area 1,500 sq ft and median spans 3; other codes n = 415 has median area 6,517 sq ft and median spans 2. Empty groups are represented by null medians, not zero.
- Code definitions were checked against the bundled report legend (printed p. 28 / PDF p. 30), NBI-W against its rating discussion (printed p. 20 / PDF p. 22), and legacy BINs against the eleven-item exception table (printed p. 21 / PDF p. 23).
- The source CSV contains BIN 2232120 with an inspection date of 2019-10-18 and an NBI-W basis. It is not a report-listed legacy exception. No dates were removed or updated to make the inventory appear newer.

- Revision browser export produced 813 CSV records totaling 15,754,558.3 sq ft. Keyboard Enter/Space activation and the multiple-borough dropdown state were checked. The data disclosure opened and closed.
- The rebuilt standalone page loaded 813 records over the preview server; Fair + Poor and Manhattan reproduced 526 then 138, with preserved summary context. A direct local file-open check remains the student's responsibility.

The revision's private preview, deployment status and final rendered output are checked separately before handoff. This document does not turn planned checks into completed checks.

## Prior baseline checks, November 12, 2026

These record the original prototype and are not substitutes for checking changed code:

- Re-extracted the bundled 77-page NYC DOT PDF using Python 3.12 and pdfplumber 0.11.9. All 813 resulting records exactly matched the bundled JSON; condition counts agreed with the report summary.
- Seven original automated Node tests and JavaScript syntax checks passed.
- The browser loaded 813 records and 15,754,558.3 sq ft. Fair + Poor produced 526 records and 11,313,772.3 sq ft. Adding Manhattan produced 138 records and 3,441,070.5 sq ft. The old version fed those same selected rows to all views; this has deliberately changed for the two summary charts.
- NBI-W selected 802 records; NBI-W plus PED-coded selected 122. Unknown borough remained available.
- Minimum area 100,000 sq ft selected 28 records and 7,639,056 sq ft. No-match search, checked keyboard activation, point details, rectangular selection and Reset worked.
- Full CSV export was checked through the browser: 813 records and the correct 15,754,558.3 sq ft total.
- The generated standalone HTML loaded over the preview server with no external script or stylesheet dependencies. Direct file-opening on the student's own computer remained a local check.
- Two original screenshots were captured. Good + Very good selected 277 records and 4,340,505 sq ft. Those original screenshots show the old interaction design and should not be used as evidence of the revised context behavior.
- On November 12, the GitHub Pages URL opened without sign-in and its filters worked. This establishes access at that time, not publication of this review revision.

## Remaining checks and responsibilities

- Student approval was received on November 18, 2026. Verify the approved revision on the public Pages URL after deployment and replace outdated screenshots or submission descriptions as needed.
- The private preview passed the reported desktop visual and interaction checks and was reviewed by the student. Public Pages verification remains a separate release check.
- Actual in-class attendance, live demonstration, peer identities and session observations must come from the student. The professor feedback supplied for this revision is genuine input, but does not establish a separate peer session or replace its required log.
- At that prototype checkpoint, two-peer testing, mobile/touch testing, cross-browser testing, screen-reader testing and a complete accessibility audit had not been claimed.
- Direct offline file-opening should be checked on the student's computer.

## Readiness and limitations

The revisions address comparison context, evidence for RQ3, terminology and date visibility. Borough reference marks add useful context beyond the original contribution question. Existing controls should be demonstrated using `demo-walkthrough.md`; their presence does not prove they were shown in the earlier presentation.

This is a verification record, not an awarded grade. Any final grading requirements, genuine feedback log and accessible submission link still apply. No later deadline or requirement is inferred from the midterm rubric.


## Independent review and visual refinement, November 18

Four separate reviewers examined color/contrast, interaction behavior, statistical interpretation and usability. They found no material arithmetic or filtering errors. The original condition-color hex values are unchanged. The extra gray appearance came from intentionally muted unselected rows, not a replacement palette.

Refinements preserve those hues: selected summary rows now have a clearer teal boundary; Very good bars retain their yellow fill with a darker outline and hatch; unselected marks remain gray but their labels are not faded. Chart labels, legends and controls are modestly larger. The borough subtitle now describes comparison rather than implying the headline total is its denominator. Status guidance changes with selection, so Fair's native gray is not mistaken for an excluded row. The median table is titled Group medians and sample sizes.

Median values display up to two decimal places. A browser search for POND produced a Good/PED-coded group with n=2 and median deck area 271.25 sq ft, correctly preserving the quarter-square-foot midpoint. Keyboard removal of successive filter chips moved focus to the next chip, then Reset when none remained. Browser checks again confirmed 813 -> 526 -> 138 records with Manhattan's borough contribution retained at 26.24%. All 13 automated data tests still pass.

These are focused desktop-browser and contrast checks, not a full accessibility, mobile, or cross-browser certification. The student subsequently approved GitHub publication.

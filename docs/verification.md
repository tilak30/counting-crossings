# Prototype verification

Checked on November 12, 2026. This record separates observed results from checks still needed.

## Completed

- Re-extracted the bundled 77-page NYC DOT PDF using Python 3.12 and pdfplumber 0.11.9. Every one of the 813 resulting records exactly matched the bundled JSON. Condition counts agree with the report summary.
- Seven automated Node tests passed: complete/unique/valid inventory, condition totals and shares, selected-cohort/borough aggregation, rating and PED filters, unknown/alphanumeric identifiers, empty results, and search/minimum-area/reset logic.
- JavaScript syntax checks passed for both source files.
- In the browser, the default view loaded 813 records and 15,754,558.3 sq ft. All three charts used the same selected record count, and the individual view contained 813 marks.
- Selecting Fair and Poor produced 526 records and 11,313,772.3 sq ft. Selecting Manhattan as well produced 138 records and 3,441,070.5 sq ft. All three views updated in both cases.
- NBI-W filtered to 802 records. NBI-W plus PED-coded filtered to 122 records. Unknown borough remained available.
- A minimum area of 100,000 sq ft produced 28 records and 7,639,056 sq ft.
- A search with no matches showed a clear empty state, zero selected records, no marks, and no invalid percentages.
- Point selection showed exact spans, inspection date, rating basis, BIN and source page. Focus details and keyboard Enter/Space activation worked for checked controls.
- A rectangular selection in the individual view updated all three charts. Reset restored all 813 records.
- Exported the complete inventory through the browser. The downloaded CSV had 813 records and the correct 15,754,558.3 sq ft total.
- Opened the generated standalone HTML in the browser. It loaded all 813 records, had no external script or stylesheet dependencies, and selecting Good updated all three views to 223 records. This checked the embedded app over the preview server; direct file-opening on the student's computer still needs a local check.
- Captured two real dashboard screenshots. The second selects Good and Very good, giving 277 records and 4,340,505 sq ft.

## Not yet verified or performed

- Live in-class attendance and demonstration, peer names, observations, and planned changes based on actual peer feedback. These must come from the student and session.
- Anonymous access to the final production link. The new hosted site starts private; its audience must be changed deliberately before grader use.
- Formal usability testing with two peers from the proposal, mobile/touch testing, cross-browser testing, screen-reader testing and a complete accessibility audit.

## Rubric interpretation

The observed implementation supports the excellent descriptions for criteria 1-4 (16 possible points). This is a readiness assessment, not a grade. Criterion 5 depends on the actual demo and a genuine feedback log. A private or inaccessible link is not a submission-ready hosted link; address access before submitting to avoid the run-check caps.

## Later work, draft only

Prioritize real peer feedback, then check whether overlapping points, keyboard navigation through many records, mobile brushing, or the share denominator need improvement. Full linked highlighting and lasso selection are possible refinements, not claimed requirements for this checkpoint. No later deadline is inferred from the rubric.

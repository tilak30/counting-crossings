# Review of the supplied midterm feedback

Reviewed November 18, 2026 against the GitHub baseline, the full 813-record CSV and the bundled NYC DOT report. This records the professor's feedback supplied by the student; it does not invent a peer-feedback session, attendance or participant names.

| Feedback | Assessment | Decision |
| --- | --- | --- |
| Selecting a category filters its own view to zero or 100% | The old shares were mathematically correct for the selected records, but removed the comparison context. This is a usability issue. | The condition chart ignores its own condition filter; the borough chart ignores its own borough filter, including the dropdown. Other filters remain active. Preserve values, highlight selected rows and gray unselected rows. Explain each comparison population. |
| Add borough full-inventory references | An enhancement rather than a correction to the existing RQ2 calculation. It supports a new, useful over-representation comparison. | Add separate fixed full-inventory references for count and deck area. Show percentage-point differences in tooltips. Do not call these within-borough condition rates. |
| PED comparison is not visible; add medians with n | Valid evidence gap: overlapping points and span-size bands do not clearly establish exact group medians. | Retain the individual plot and add a table of exact median area, median spans and n for both groups within each condition. Apply all active filters. Show absent groups as dashes. |
| Define codes and show inspection year | Code meanings were unclear. The full inspection date already existed, so the date issue is visibility and explanation, not a missing field. | Expand source-code components, add a glossary, show year prominently, retain full date and legacy flag. Keep older records. |
| Dropdowns, search, box selection and data panel not demonstrated | Valid gap in the submitted demonstration; it does not establish that those features are missing or broken. | Check the existing controls and include them in the revised demo. No replacement controls are needed. |

## Boundaries of this revision

- Keep the research questions, paired solid/hatched bars, ordered condition colors, separate Closed status, log deck-area scale, type shapes, span bands and complete inventory.
- Keep point/box selection filtering the individual plot. The context fix targets the two summary charts identified in the feedback. Clear structure selection restores the wider view.
- Headline totals, points, medians and CSV export use every active filter. Summary charts intentionally use their stated comparison populations, so their denominators may differ from the headline total.
- Full-inventory borough references always use all 813 rows, even when bridge type, inspection rating basis, minimum area, search or structure selection is active. They are labeled accordingly.
- Median results are descriptive. For Fair, Good and Very good, PED-coded records have lower median deck area and higher median spans in the complete inventory. Poor has only two PED-coded records, and Closed has a different pattern. Do not present the pattern as a universal rule or causal effect.

## Source terminology and dates

The report legend (printed p. 28 / PDF p. 30) defines PED as Pedestrian, A as Arterial, R as Ramp and O as Off-System. Composite labels identify those components without inventing a further functional definition of Off-System. The report's rating discussion (printed p. 20 / PDF p. 22) defines National Bridge Inventory Weighted (NBI-W). The eleven legacy cases follow its exception list (printed p. 21 / PDF p. 23), not an inspection-year rule.

Recorded dates range from November 29, 2017 through December 23, 2024. BIN 2232120, E 71ST ST PED BRIDGE, has an October 18, 2019 date and is not in the report's legacy list. Inspection age is not a live safety verdict.

## Release status

Implementation and observed checks are described in `verification.md`. The student approved the private preview on November 18, 2026 for publication to the existing GitHub repository and Pages URL. Existing hosting filenames are preserved.

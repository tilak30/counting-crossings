# Counting Crossings

**Tilak Bhansali | NYU Tandon | Information Visualization | Mini-Project 2**

A working prototype for exploring the 2024 NYC DOT bridge inventory. The starting view includes every record. Linked selections narrow the records while condition and borough charts retain their own comparison context.

## Open it

The simplest option is to double-click **Counting_Crossings.html**. It contains the code, styles and all 813 records in one file. It needs a browser with JavaScript enabled, but no installation or internet connection. The link to the original report needs internet access.

To work on the separate source files, open a terminal in this folder and run:

```bash
python3 -m http.server 8000 --directory dist
```

On Windows, use `py` instead of `python3`. Open **http://localhost:8000** in a browser. Leave the terminal open; press Ctrl+C to stop the server. No `npm install` is needed.

## Research questions and views

1. **How does the reported condition breakdown change when I compare structure counts with total deck area?** The condition view uses paired solid and hatched bars on a common 0-100% scale.
2. **Which borough groups account for the largest shares of Fair and Poor structures by count and by deck area, and does the leading group change between measures?** Select Fair and Poor in the first chart, then compare the filled count circles and open area squares in the borough view. The default view is broader so visitors can explore other condition groups too.
3. **Within each condition, how do PED-coded structures compare with other structures in deck area and number of spans?** The structure view uses log deck area, ordered condition lanes, shape for the bridge group, and five ordered sizes for span bands. A comparison table gives exact median deck area, median spans and sample size for each condition and bridge-code group. Exact record values are available on hover or focus.

The intended audience is students and New Yorkers interested in infrastructure. The dashboard supports comparison and exploration; reported condition is not a live assessment of safety.

## How the selections work

- Click condition rows or borough rows to toggle them. You can select more than one. The active chips show every filter.
- Filters intersect. For example, Fair + Poor, Manhattan and PED-coded means Manhattan records in either of those two conditions whose bridge code contains PED.
- Click a point to select its BIN, or drag a rectangular box from empty space inside the structure plot. All three views update. Clear the structure selection to expand the view again.
- Hover over a mark, or reach it with Tab, to see details. Enter or Space activates chart rows and points. Escape dismisses a tooltip. A clicked structure remains in the details panel.
- Reset all filters restores 813 records. Empty results show a message, not a misleading zero-percentage comparison.
- Download selected records exports the current subset. Reset first to export all records. BIN is a string identifier, including some alphanumeric values.

The comparison population is stated under each chart:

| Display | Filters used |
| --- | --- |
| Headline totals, individual structures, medians and CSV export | All active filters |
| Condition chart | All filters except the condition selection; selected conditions are highlighted and other conditions are gray |
| Borough chart | All filters except the borough selection, whether made in the chart or dropdown; selected boroughs are highlighted and other boroughs are gray |
| Light borough reference marks | Fixed full inventory of 813 records, regardless of filters |

For either summary chart, count share divides a group's count by its comparison population's count. Area share divides the group's deck area by that comparison population's deck area. Empty populations show a dash, not a fabricated percentage.

For example, Fair + Poor selects 526 records. Adding Manhattan selects 138, but the borough chart still compares all 526 Fair/Poor records. Manhattan therefore remains 138 / 526 = 26.24%, rather than becoming 100%. The condition chart now compares all 189 Manhattan records, retaining the conditions outside Fair/Poor as gray context.

Borough tooltip differences are **percentage-point** differences from each borough's full-inventory count or area share. A greater contribution than the baseline is over-representation in that selected population; it is not the percentage of that borough's inventory in a particular condition. Count and area have separate reference values.

Point and box selections still filter the individual plot itself. Clear the structure-selection chip or use Reset to recover the broader view. This focused revision changes the two summary charts, not the brush interaction.

## Data and preparation

**Original source:** NYC Department of Transportation, *Bridges & Tunnels Annual Condition Report, 2024 Edition*.

https://www.nyc.gov/html/dot/downloads/pdf/dot_bridgereport24.pdf

The frozen report was retrieved on October 14, 2026. It is a publicly downloadable PDF; no account or API key is needed. This project does not claim an open-data license for the PDF. Keep the source attribution with reused records.

- Inventory: printed pages 32-64 (PDF pages 34-66).
- Condition summary: printed page 22. Legacy-rating exceptions: printed page 21.
- Extract all table records, join wrapped cell text, remove the non-record footer, parse numeric values, and convert dates to ISO text.
- Retain all 813 unique BINs. Do not merge similarly named bridges: one bridge name can refer to several structures.
- Keep cross-borough codes in one disjoint group. Preserve the one unknown borough record, BIN 2269600.
- Preserve the report's verbal rating labels. Closed is unranked, below a separate divider. No average condition score is calculated.
- Flag the 11 report-listed legacy exceptions. The rating filter can exclude them; it does not recalculate ratings.
- PED-coded means the source bridge-type text contains `PED`, including `PED-O`. This is a code grouping, not a claim about every structure's current permitted use.
- Derive span bands 1, 2-4, 5-9, 10-49 and 50+.
- Expand bridge-code components from the report legend (printed p. 28): PED Pedestrian, A Arterial, R Ramp, O Off-System, W Waterway, M Movable and E East River. Composite codes retain their source spelling; for example PED-A displays Pedestrian / Arterial and AR displays Arterial / Ramp.
- NBI-W means National Bridge Inventory Weighted (printed p. 20). Legacy exceptions follow the report's explicit list, not an inferred inspection-year cutoff. BIN 2232120 has a recorded 2019 inspection and is not a listed legacy exception.
- Tooltips show inspection year prominently and preserve the full recorded date. A 2024 report does not imply every inspection took place in 2024.

**Audit totals:** 813 structures; 15,754,558.3 sq ft; Poor 8, Fair 518, Good 223, Very good 54, Closed 10. Inspection dates range from 2017-11-29 to 2024-12-23. There are 802 NBI-W records and 11 legacy exceptions.

The source footer gives 15,700,477 sq ft for open structures; the sum of non-Closed rows is 15,654,277.3, a difference of 46,199.7. Charts use row sums and disclose this discrepancy. The data covers this DOT inventory, not every agency's structures in New York City. Replacement cost is retained in the source data but is not presented as a maintenance budget.

Source PDF SHA-256:

```text
e458da9224e3b4ae45c6d0e45d9f7c70dda9d341c501fb1388b50a3f54149c03
```

## Encodings and changes from the proposal

| Dimension | Type | Encoding | Reason |
| --- | --- | --- | --- |
| Deck area | Quantitative | Fixed log x-position in structure view | Positive areas span several orders of magnitude; position supports comparison. Ticks explicitly explain powers of ten. |
| Condition | Ordinal; Closed is a separate status | Ordered rows and four cividis colors; Closed uses gray | Position and lightness convey order. Labels and a separate Closed lane avoid treating closure as a fifth rank. |
| Span band, derived from exact span count | Ordinal | Five increasing marker areas | Shows ordered groups without implying proportional raw span counts. Exact spans appear in details. |
| PED-coded / other | Nominal | Triangle / circle | Distinguishes groups without suggesting an order. The same span band has equal geometric area for either shape. |
| Borough group | Nominal | Labeled rows | Seven disjoint categories, with no implied ranking. |
| Count / area share | Derived quantitative | Paired lengths or aligned positions, always 0-100% | Common scales allow comparisons; fill, hatch and point shape distinguish the measures. |

The original condition fill colors are preserved. A darker outline and hatch make the lightest bars legible; teal row boundaries indicate selection, and gray context marks retain readable labels. Median values display up to two decimal places.

The four cividis colors were sampled at 0.10, 0.36, 0.62 and 0.90. See Matplotlib's cividis colormap: https://matplotlib.org/stable/users/explain/colors/colormaps.html. The app bundles the color values and does not depend on Matplotlib.

The proposal's encodings and three-view layout are retained. Implementation changes are:

- Plain HTML, CSS, JavaScript and SVG replace the planned Python/Plotly Dash runtime. Python remains the data-preparation tool. This allows static hosting and a self-contained offline copy.
- A rectangular brush is implemented; free-form lasso is deferred. A structure selection filters the plot, rather than retaining unselected points as a dim background. The two summary charts now retain their own facet context as described above; point selections remain explicit filters in that context.
- Updates are immediate, with no animated transitions. This removes the need for a motion preference at this stage.
- The initial view includes the complete inventory. The earlier preliminary findings are not preselected or used as the dashboard's headline.
- The post-midterm revision retains condition and borough comparison context, adds fixed inventory references and exact medians with n, and explains source codes and inspection dates. See `docs/feedback-review.md` for decisions and `docs/demo-walkthrough.md` for the revised demonstration.

The response to the instructor feedback is also available in `docs/Counting_Crossings_Peer_Review_and_Revisions.docx`.

## Folder map

| Path | Purpose |
| --- | --- |
| `Counting_Crossings.html` | Generated standalone copy; opens directly |
| `index.html` | Generated GitHub Pages entry point; kept in sync with the standalone copy |
| `dist/index.html` | Page structure and explanatory labels |
| `dist/styles.css` | Layout, typography and focus styles |
| `dist/model.js` | Selection, totals, grouped summaries and validation |
| `dist/app.js` | SVG rendering, tooltips, clicks, brushing and CSV export |
| `dist/data/` | Complete browser-ready CSV, JSON and embedded JavaScript data |
| `data/raw/dot_bridgereport24.pdf` | Frozen source report |
| `data/processed/` | Re-extracted data and audit report |
| `src/data_model.py` | Preparation rules and report-listed exceptions |
| `scripts/prepare_data.py` | PDF extraction and checks |
| `scripts/publish_data.py` | Copy validated records into the browser bundle |
| `scripts/build_standalone.py` | Inline browser assets into the offline HTML |
| `tests/data.test.js` | Thirteen data, aggregation, comparison-context and median checks |
| `docs/verification.md` | What was checked and what remains unverified |

Edit the separate source files, not either generated root HTML file. After rebuilding, verify that the GitHub Pages entry point and offline copy contain the same app.

## Rebuild the browser copies

After editing the HTML, CSS or JavaScript:

```bash
python3 scripts/build_standalone.py
```

## Reproduce the extraction (optional)

The app already includes the prepared data. This step is only needed to reproduce or inspect preparation. Python 3.12 and pdfplumber 0.11.9 were used for verification.

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/prepare_data.py
python scripts/publish_data.py
```

Windows PowerShell, using the virtual environment directly:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe scripts\prepare_data.py
.\.venv\Scripts\python.exe scripts\publish_data.py
```

The frozen PDF is included. If it is missing, `python scripts/download_source.py` can request it from NYC DOT, but downloading depends on network access. A changed report must be reviewed rather than forcing old assertions to pass.

## Check the data logic

With Node.js 18 or newer installed:

```bash
node --test tests/data.test.js
```

This has no npm dependencies. Report totals in the tests are independent audit expectations; the charts calculate their values from the full records.

## Troubleshooting

- If a browser displays source text, check that the standalone filename ends in `.html`, then open it with Chrome, Firefox, Edge or Safari.
- If the separate-source page shows a load error, keep `index.html`, `app.js`, `model.js`, `styles.css` and `data/` together. The standalone file avoids missing-asset problems.
- If port 8000 is busy, use `python3 -m http.server 8001 --directory dist` and open http://localhost:8001.
- If `python3` is not found on Windows, use `py`. You can still use the standalone file without Python.
- If a filter gives no results, clear its chip or reset. Multiple filters narrow the data together.
- Start a box selection on blank space inside the structure plot. Clicking a mark selects that individual record instead.
- Open CSV files using UTF-8 and treat BIN as text. Excel may otherwise change identifiers. The selected export includes a UTF-8 BOM.
- GitHub Pages is the public submission host. The review preview is separate and private. Check the public URL in a signed-out/private window after an approved deployment; do not submit the private review link.

## Status and assistance

The data, all three views, cross-view filtering, comparison context, borough reference marks, median table, point/box selection, details and export are implemented. Detailed checks are in `docs/verification.md`. The supplied professor feedback is documented; this does not establish attendance, peer names or a completed peer session. Formal usability testing and a complete accessibility audit are not claimed. The revision is for private review before any GitHub push.

ChatGPT (Codex) assisted with implementation, data verification, testing and documentation. Source data is from NYC DOT. Review the code and practice the demo so you can explain the choices yourself; follow the course's assistance-disclosure requirements.

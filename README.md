# Counting Crossings

**Tilak Bhansali | NYU Tandon | Information Visualization | Mini-Project 2**

A working prototype for exploring the 2024 NYC DOT bridge inventory. The starting view includes every record. Selecting a condition, borough or structure recalculates all three charts.

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
3. **Within each condition, how do PED-coded structures compare with other structures in deck area and number of spans?** The structure view uses log deck area, ordered condition lanes, shape for the bridge group, and five ordered sizes for span bands. Exact values are available on hover or focus.

The intended audience is students and New Yorkers interested in infrastructure. The dashboard supports comparison and exploration; reported condition is not a live assessment of safety.

## How the selections work

- Click condition rows or borough rows to toggle them. You can select more than one. The active chips show every filter.
- Filters intersect. For example, Fair + Poor, Manhattan and PED-coded means Manhattan records in either of those two conditions whose bridge code contains PED.
- Click a point to select its BIN, or drag a rectangular box from empty space inside the structure plot. All three views update. Clear the structure selection to expand the view again.
- Hover over a mark, or reach it with Tab, to see details. Enter or Space activates chart rows and points. Escape dismisses a tooltip. A clicked structure remains in the details panel.
- Reset all filters restores 813 records. Empty results show a message, not a misleading zero-percentage comparison.
- Download selected records exports the current subset. Reset first to export all records. BIN is a string identifier, including some alphanumeric values.

Every displayed share uses the **current selection** as its denominator:

```text
count share = records in the displayed group / all selected records * 100
area share  = deck area in the displayed group / all selected deck area * 100
```

The borough chart shows contributions to a selected cohort. It does not show the percentage of each borough's complete inventory that is in a given condition.

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

The four cividis colors were sampled at 0.10, 0.36, 0.62 and 0.90. See Matplotlib's cividis colormap: https://matplotlib.org/stable/users/explain/colors/colormaps.html. The app bundles the color values and does not depend on Matplotlib.

The proposal's encodings and three-view layout are retained. Implementation changes are:

- Plain HTML, CSS, JavaScript and SVG replace the planned Python/Plotly Dash runtime. Python remains the data-preparation tool. This allows static hosting and a self-contained offline copy.
- A rectangular brush is implemented; free-form lasso is deferred. A structure selection filters the plot, rather than retaining unselected points as a dim background. This matches the denominator used in the other charts.
- Updates are immediate, with no animated transitions. This removes the need for a motion preference at this stage.
- The initial view includes the complete inventory. The earlier preliminary findings are not preselected or used as the dashboard's headline.

## Folder map

| Path | Purpose |
| --- | --- |
| `Counting_Crossings.html` | Generated standalone copy; opens directly |
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
| `tests/data.test.js` | Seven data and aggregation checks |
| `docs/verification.md` | What was checked and what remains unverified |

Edit the separate source files, not the generated standalone copy.

## Rebuild the offline copy

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
- A hosted link still needs viewer access enabled before it can be used by a grader. Check it in a signed-out/private window before submission.

## Status and assistance

The data, all three views, basic cross-view filtering, point/box selection, details and export are implemented. Detailed checks are in `docs/verification.md`. Formal usability testing, a full accessibility audit and the in-class peer-feedback session are not claimed as completed.

ChatGPT (Codex) assisted with implementation, data verification, testing and documentation. Source data is from NYC DOT. Review the code and practice the demo so you can explain the choices yourself; follow the course's assistance-disclosure requirements.

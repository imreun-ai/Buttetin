# ប្រព័ន្ធព្រឹត្តិបត្រពិន្ទុ (Report Card System)

Static web app (HTML/CSS/JS, no build step). Data is stored in the browser's Local Storage and can be synced to Google Sheets through Google Apps Script.

## Files
| File | Purpose |
|---|---|
| `index.html`, `style.css` | UI (8 tabs) and report card print layout |
| `app.js` | UI logic, Excel import/export, PDF, Google sync |
| `calc.js` | Score calculation (totals, averages, ranks, grades) |
| `Code.gs` | Google Apps Script (source of truth) |
| `gs-code.js` | `Code.gs` embedded for the "copy code" button — regenerate with `node build-gs.js` after editing `Code.gs` |

## Publish with GitHub Pages
1. Push this folder to a GitHub repository.
2. Repository **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
3. Open `https://<user>.github.io/<repo>/`.

## Connect Google Sheet
Open the app → tab **៨. Google Sheet** and follow the steps (copy the Apps Script, run `setup`, deploy as Web app, paste the `/exec` URL).

## Calculation rules
- Total = Σ(score × coefficient); average = total ÷ Σcoefficient (scores normalised to the full average `M`).
- Semester average = (exam average + monthly average) ÷ 2.
- Yearly values = (semester 1 + semester 2) ÷ 2.
- វិជ្ជាសម្បទា = yearly average × `skillPct`/100; total = វិជ្ជាសម្បទា + បំណិន + ចរិយា.
- Grade by percentage of `M`: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, E ≥ 50, F < 50.

# ANR Muse EEG Recorder

A lightweight browser-based Muse EEG acquisition tool developed for research use by the **African NeuroData Research Lab (ANR)**.

- Website: https://africanneurodataresearch.org/
- Research enquiries: anrlab.ng@gmail.com
GitHub: https://github.com/Duruhjunior77/ANR-Muse-EEG-Recorder

## Overview

ANR Muse EEG Recorder connects directly to a Muse headset through Web Bluetooth in Chrome or Microsoft Edge and records four EEG channels:

- TP9
- AF7
- AF8
- TP10

The recorder is intentionally focused on acquisition rather than clinical interpretation.

## Features

- Direct Muse connection through Web Bluetooth
- Live four-channel EEG visualization
- Distinct channel colors
- Electrode contact-status indicators
- Recording timer and live saved-sample counter
- Manual event markers
- Repeating automatic event markers
- Configurable recording duration
- Automatic raw CSV download when recording stops
- ANR research branding and contact information

## Automatic event markers

A repeated marker can be configured before or during a research session.

Example:

- Marker name: `Eyes closed`
- Interval: `30 seconds`

When enabled before acquisition begins, the recorder places the marker at approximately:

- 30 s
- 60 s
- 90 s
- 120 s
- ...

until recording ends.

Markers are labeled as either `AUTO` or `MANUAL` and are included in the exported CSV.

## Raw EEG export

When a recording stops, the browser automatically prepares a CSV containing:

```text
timestamp_ms
iso_time
sample_index
session_code
protocol
stop_reason
TP9_uV
AF7_uV
AF8_uV
TP10_uV
event_marker
```

The four EEG channels are synchronized into rows for straightforward downstream processing in Python, MATLAB, R, EEGLAB, MNE-Python, or similar research tools.

## Requirements

- Muse EEG headset
- Chrome or Microsoft Edge with Web Bluetooth support
- Node.js LTS
- Bluetooth-enabled computer

## Run locally

Clone the repository:

```bash
git clone https://github.com/Duruhjunior77/ANR-Muse-EEG-Recorder.git
cd ANR-Muse-EEG-Recorder
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

On Windows, you can also double-click:

```text
START_ANR_EEG.bat
```

## Recording workflow

1. Start the local ANR EEG Recorder.
2. Turn on the Muse headset.
3. Click **Connect Muse**.
4. Select the headset from the browser Bluetooth dialog.
5. Enter the session code and protocol.
6. Configure event markers if needed.
7. Press **Start recording**.
8. Confirm the saved-sample counter is increasing.
9. Press **Stop recording**, or allow a timed recording to finish automatically.
10. The raw EEG CSV downloads automatically.

## Research-use statement

This software is intended for **research EEG acquisition and data export only**.

It is not a medical device and is not intended to diagnose seizures, epilepsy, hydrocephalus, neurological disease, or any other clinical condition.

Researchers are responsible for obtaining appropriate ethical approval, participant consent, institutional authorization, and data-governance approval for their intended use.

## Data privacy

Participant EEG recordings are processed locally in the browser and are not automatically uploaded to ANR Lab or any external server by this application.

Avoid using personally identifying information in session codes when collecting human-participant research data.

## Technology

- JavaScript
- Vite
- muse-js
- RxJS
- Web Bluetooth API

## Project status

Active research prototype.

Contributions, reproducibility feedback, and research collaboration enquiries are welcome through ANR Lab.

---

**African NeuroData Research Lab (ANR)**  
https://africanneurodataresearch.org/  
anrlab.ng@gmail.com


## Live website

Once GitHub Pages is enabled for the repository, the public website is expected at:

https://duruhjunior77.github.io/ANR-Muse-EEG-Recorder/

The site should be opened in a Chromium-based browser such as Chrome or Microsoft Edge for Muse Web Bluetooth support.

### GitHub Pages deployment

This repository includes:

- `vite.config.js`
- `.github/workflows/deploy-pages.yml`

Every push to the `main` branch automatically builds the Vite application and deploys the `dist/` folder to GitHub Pages.

### Enable Pages once

On GitHub:

1. Open the repository.
2. Go to **Settings**.
3. Open **Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Push to `main` or run the workflow manually from the **Actions** tab.

After deployment completes, the website will be available over HTTPS.

### Data handling

EEG data remains in the user's browser during normal use. Recordings are downloaded locally as CSV files; this deployment does not include a backend database or automatic upload service.

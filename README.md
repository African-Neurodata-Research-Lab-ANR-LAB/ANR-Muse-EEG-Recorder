# ANR Muse EEG Recorder

**African NeuroData Research Lab (ANR)**

Browser-based Muse EEG acquisition with event markers and **MNE-ready research export**.

Website: https://africanneurodataresearch.org/  
Research enquiries: anrlab.ng@gmail.com

## What the recorder does

- Connects directly to Muse through Web Bluetooth.
- Displays four live EEG channels: TP9, AF7, AF8, TP10.
- Records raw EEG at 256 Hz.
- Supports manual and repeated automatic research event markers.
- Shows acquisition/contact-status indicators.
- Exports an MNE-ready ZIP immediately after recording stops.

## MNE-ready export

A completed session downloads as:

```text
ANR_<session>_<timestamp>_MNE_READY.zip
```

Containing:

```text
├── *_raw_eeg.csv
├── *_events.tsv
├── *_eeg_metadata.json
└── README.txt
```

The raw CSV includes deterministic `time_s`:

```text
time_s = sample_index / 256
```

This removes dependence on browser wall-clock timestamps when reconstructing the EEG in MNE.

### Raw CSV fields

```text
sample_index
time_s
timestamp_ms
iso_time
session_code
protocol
stop_reason
TP9_uV
AF7_uV
AF8_uV
TP10_uV
event_marker
```

The EEG values remain raw microvolt values in the browser export. The ANR analysis pipeline converts them to volts when creating an MNE Raw object.

## Events

The separate `events.tsv` file contains one event per row:

```text
onset    duration    description    source
```

This prevents repeated adjacent CSV marker rows from being interpreted as multiple experimental events.

## Analyze with MNE-Python

Use the companion repository:

**ANR EEG Analysis Pipeline**  
https://github.com/African-Neurodata-Research-Lab-ANR-LAB/ANR-EEG-Analysis-Pipeline

Its guided Google Colab notebook imports the ANR export, creates an MNE Raw object, runs technical QC and preprocessing, calculates PSD/band power, and exports a true `.fif` file and HTML report.

## Recording procedure

New users should read:

**[Research Recording Procedure](docs/RECORDING_PROCEDURE.md)**

For the exact MNE-ready file specification:

**[MNE Export Format](docs/MNE_EXPORT_FORMAT.md)**

## Run locally

Requirements:

- Muse EEG headset
- Chrome or Microsoft Edge
- Bluetooth-enabled computer
- Node.js LTS

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Development checks

```bash
npm test
npm run build
```

## Project team

See **[CONTRIBUTORS.md](CONTRIBUTORS.md)**.

### Collaborators

Duruh Joseph; Samuel Akingbulu; Deborah Eseurhobo; Christopher Ogbe; Angelic Charles; Esther Bassey; Smart Oparaugo; Barisua Nsaane; Goodness Naabie; Patrick Filima.

### Principal Investigator

**Dr. Eberechi Wogu**

## Data privacy

Recordings are processed locally in the browser. This application does not automatically upload EEG data to ANR Lab or an external server.

Do not use participant names or other identifying information as session codes.

## Research-use statement

The ANR Muse EEG Recorder is intended for research acquisition and data export. It is not a clinical EEG system and is not intended for diagnosis or medical interpretation.

# ANR Muse EEG Recorder — Research Recording Procedure

This guide describes the recommended workflow for collecting a Muse EEG recording with the **ANR Muse EEG Recorder** and preparing the output for the **ANR EEG Analysis Pipeline / MNE-Python**.

## 1. Before the recording

1. Use a current desktop version of **Google Chrome or Microsoft Edge**.
2. Turn on Bluetooth.
3. Charge the Muse headset sufficiently for the planned session.
4. Open the ANR Muse EEG Recorder website.
5. Use a **non-identifying participant/session code**. Do not enter participant names or medical record numbers.
6. Select the research protocol and planned duration.
7. If the study uses repeated event markers, enter the marker name and interval before recording.

## 2. Fit and connect Muse

1. Place the Muse headset according to the manufacturer's fitting guidance.
2. Click **Connect Muse**.
3. Select the correct Muse device in the browser Bluetooth dialog.
4. Confirm that live EEG appears for TP9, AF7, AF8, and TP10.
5. Review the electrode contact-status indicators before beginning acquisition.

The contact indicators are acquisition aids. They are not clinical impedance measurements.

## 3. Start the research recording

1. Confirm the session code and protocol.
2. Confirm that the live waveform is visible.
3. Click **Start recording**.
4. Verify that the saved-sample counter is increasing.
5. Add manual event markers when experimental events occur, or enable the repeated automatic marker if required by the protocol.

The raw samples saved for export are not the display-filtered waveform.

## 4. Stop the recording

Stop manually or allow the configured recording duration to finish.

The recorder creates one package:

```text
ANR_<session>_<timestamp>_MNE_READY.zip
```

The browser downloads this ZIP automatically.

## 5. What is inside the MNE-ready ZIP?

```text
ANR_<session>_<timestamp>_MNE_READY.zip
├── ANR_<session>_<timestamp>_raw_eeg.csv
├── ANR_<session>_<timestamp>_events.tsv
├── ANR_<session>_<timestamp>_eeg_metadata.json
└── README.txt
```

### Raw EEG CSV

Contains:

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

`time_s` is deterministic:

```text
time_s = sample_index / 256
```

The four EEG channels remain in **microvolts** so that the raw acquisition values remain transparent.

### Events TSV

One event per row:

```text
onset    duration    description    source
```

`onset` is measured in seconds from recording start. This file is suitable for conversion to MNE annotations and is close to the event-table style used in BIDS workflows.

### Metadata JSON

Contains:

- sampling rate;
- channel names;
- channel types;
- units;
- Muse device information;
- session/protocol metadata;
- start/stop times;
- recording duration;
- number of samples/events;
- MNE reconstruction guidance.

## 6. Analyze in ANR Google Colab

Open the ANR EEG Analysis Pipeline:

`https://github.com/African-Neurodata-Research-Lab-ANR-LAB/ANR-EEG-Analysis-Pipeline`

Then open the guided Colab notebook and follow the notebook step by step.

The analysis pipeline converts the Muse values from microvolts to volts, creates an MNE `RawArray`, imports events as annotations, performs technical QC, preprocessing, PSD/band-power analysis, and can export a true MNE FIF file.

## 7. Data governance

- Do not upload participant-identifying data to the public GitHub repositories.
- Keep raw participant recordings in approved research storage.
- Use non-identifying study/session codes.
- Follow the applicable ethics approval, consent, and institutional data-management procedures.

## Research-use boundary

The ANR Muse EEG Recorder is a research acquisition tool. It is not a clinical EEG system and does not diagnose neurological or medical conditions.

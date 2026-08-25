# ANR MNE-Ready EEG Export Format

Version: 1.0

The ANR Muse EEG Recorder uses a transparent browser-native export that can be reconstructed reliably in MNE-Python.

## Why the browser does not write FIF directly

MNE FIF is a structured neurophysiology format written by MNE-Python. The ANR recorder is a static JavaScript/Web Bluetooth application, so the recorder exports an explicit MNE-ready package and the ANR EEG Analysis Pipeline creates the true MNE object/FIF file.

## Sampling

Muse EEG sampling frequency:

```text
256 Hz
```

Deterministic analysis time:

```text
time_s = sample_index / 256
```

Browser/device timestamps are retained as provenance fields, but deterministic sample timing is the preferred MNE reconstruction source.

## Channels

| CSV column | MNE channel | Type | Input unit |
|---|---|---|---|
| TP9_uV | TP9 | EEG | µV |
| AF7_uV | AF7 | EEG | µV |
| AF8_uV | AF8 | EEG | µV |
| TP10_uV | TP10 | EEG | µV |

MNE stores EEG internally in volts, therefore conversion is:

```python
data_v = data_uv * 1e-6
```

## MNE reconstruction example

```python
import mne
import pandas as pd

FS = 256.0
CHANNELS = ["TP9", "AF7", "AF8", "TP10"]
CSV_COLUMNS = ["TP9_uV", "AF7_uV", "AF8_uV", "TP10_uV"]

df = pd.read_csv("raw_eeg.csv")
data_v = df[CSV_COLUMNS].to_numpy(float).T * 1e-6

info = mne.create_info(CHANNELS, sfreq=FS, ch_types="eeg")
raw = mne.io.RawArray(data_v, info)

events = pd.read_csv("events.tsv", sep="\t")
annotations = mne.Annotations(
    onset=events["onset"].to_numpy(float),
    duration=events["duration"].to_numpy(float),
    description=events["description"].astype(str).tolist(),
)
raw.set_annotations(annotations)
raw.save("ANR_session_raw.fif", overwrite=True)
```

The ANR EEG Analysis Pipeline automates these steps.

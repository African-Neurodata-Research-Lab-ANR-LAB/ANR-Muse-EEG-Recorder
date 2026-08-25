# ANR Muse EEG Recorder — MNE-Ready Export Format

The ANR Muse EEG Recorder exports a session package designed for deterministic reconstruction in MNE-Python.

## Package

A completed recording is distributed as:

```text
ANR_<session>_<timestamp>_MNE_READY.zip
├── <prefix>_raw_eeg.csv
├── <prefix>_events.tsv
├── <prefix>_eeg_metadata.json
└── README.txt
```

## Raw EEG CSV

The EEG table contains:

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

For MNE reconstruction, the authoritative sample time is:

```text
time_s = sample_index / sampling_frequency_hz
```

For Muse 2 recordings in the current ANR recorder:

```text
sampling_frequency_hz = 256
```

Browser timestamps are preserved as acquisition metadata, but they are not the primary MNE timing source.

## Events TSV

The event table uses one row per event:

```text
onset    duration    description    source
```

`onset` and `duration` are in seconds. ANR manual and automatic markers are preserved in `description`.

## Metadata JSON

The metadata declares the recording format, sampling frequency, channel names/types, input units, device, session information, file names, event count, and timing rule.

### Duration fields

From format version 1.1 onward the metadata distinguishes:

- `wall_clock_duration_seconds` — elapsed researcher/browser start-to-stop time.
- `eeg_duration_seconds` — synchronized sampled duration, calculated as `n_samples / sampling_frequency_hz`.
- `recording_duration_seconds` — retained for backward compatibility and currently mirrors wall-clock duration.

This prevents acquisition-control time from being confused with the actual sampled EEG duration.

## MNE conversion

The ANR EEG Analysis Pipeline:

1. reads the metadata;
2. validates `sample_index` and `time_s`;
3. reads TP9, AF7, AF8 and TP10 in microvolts;
4. converts microvolts to volts;
5. creates an MNE `RawArray`;
6. reads `events.tsv` as MNE annotations;
7. preserves technical source metadata in `raw.info["description"]`.

## Research-use statement

This is a research acquisition/export format. It is not a clinical EEG standard, diagnostic interpretation, or medical device output.

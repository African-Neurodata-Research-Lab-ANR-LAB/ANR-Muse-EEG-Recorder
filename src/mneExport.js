const CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10'];

function csvEscape(value) {
  if (value == null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function tsvEscape(value) {
  if (value == null) return '';
  return String(value).replace(/[\t\r\n]+/g, ' ').trim();
}

function eventDescription(event) {
  const prefix = event.source === 'auto' ? 'AUTO' : 'MANUAL';
  return `${prefix}: ${event.label}`;
}

function nearestEventLabel(events, timestampMs, fs) {
  let best = null;
  let bestDt = Infinity;
  const toleranceMs = (1000 / fs) * 3;

  for (const event of events) {
    const delta = Math.abs(event.timestamp - timestampMs);
    if (delta < bestDt && delta <= toleranceMs) {
      best = event;
      bestDt = delta;
    }
  }
  return best ? eventDescription(best) : '';
}

export function buildMneReadyFiles({
  fs = 256,
  sessionCode,
  protocol,
  stopReason,
  startedAt,
  stoppedAt,
  deviceName,
  recorded,
  events = [],
}) {
  if (!Number.isFinite(fs) || fs <= 0) throw new Error('fs must be a positive number');
  if (!Array.isArray(recorded) || recorded.length !== 4) throw new Error('recorded must contain four EEG channels');

  const n = Math.min(...recorded.map(channel => channel.values.length));
  if (!Number.isFinite(n) || n <= 0) throw new Error('No synchronized EEG samples were recorded');

  const rawHeader = [
    'sample_index', 'time_s', 'timestamp_ms', 'iso_time', 'session_code', 'protocol', 'stop_reason',
    'TP9_uV', 'AF7_uV', 'AF8_uV', 'TP10_uV', 'event_marker',
  ];
  const rawRows = [rawHeader.join(',')];

  for (let i = 0; i < n; i += 1) {
    const timestampMs = Number(recorded[0].times[i]);
    const timeS = i / fs;
    rawRows.push([
      i,
      timeS.toFixed(9),
      Number.isFinite(timestampMs) ? timestampMs : '',
      Number.isFinite(timestampMs) ? new Date(timestampMs).toISOString() : '',
      sessionCode,
      protocol,
      stopReason,
      recorded[0].values[i],
      recorded[1].values[i],
      recorded[2].values[i],
      recorded[3].values[i],
      Number.isFinite(timestampMs) ? nearestEventLabel(events, timestampMs, fs) : '',
    ].map(csvEscape).join(','));
  }

  const eventRows = ['onset\tduration\tdescription\tsource'];
  for (const event of events) {
    const onset = Number.isFinite(event.elapsed_s)
      ? event.elapsed_s
      : ((event.timestamp - startedAt) / 1000);
    eventRows.push([
      Number(onset).toFixed(6),
      '0.000000',
      tsvEscape(eventDescription(event)),
      tsvEscape(event.source || 'manual'),
    ].join('\t'));
  }

  const durationSeconds = Number.isFinite(startedAt) && Number.isFinite(stoppedAt)
    ? Math.max(0, (stoppedAt - startedAt) / 1000)
    : n / fs;

  const metadata = {
    format: 'ANR Muse EEG MNE-ready',
    format_version: '1.0',
    sampling_frequency_hz: fs,
    mne_time_source: 'sample_index / sampling_frequency_hz',
    channel_names: CHANNELS,
    channel_types: CHANNELS.map(() => 'eeg'),
    units: 'microvolts',
    device: 'Muse 2',
    device_name: deviceName || null,
    manufacturer: 'InteraXon',
    session_code: sessionCode || null,
    protocol: protocol || null,
    stop_reason: stopReason || null,
    recording_start_utc: Number.isFinite(startedAt) ? new Date(startedAt).toISOString() : null,
    recording_stop_utc: Number.isFinite(stoppedAt) ? new Date(stoppedAt).toISOString() : null,
    recording_duration_seconds: durationSeconds,
    n_samples: n,
    n_events: events.length,
    eeg_file: 'raw_eeg.csv',
    events_file: 'events.tsv',
    research_use_only: true,
    mne_reconstruction_note: 'Convert microvolts to volts, create MNE RawArray at 256 Hz, and load events.tsv as annotations.',
  };

  return {
    rawCsv: rawRows.join('\n'),
    eventsTsv: eventRows.join('\n'),
    metadataJson: JSON.stringify(metadata, null, 2),
    nSamples: n,
    nEvents: events.length,
  };
}

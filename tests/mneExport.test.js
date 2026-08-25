import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMneReadyFiles } from '../src/mneExport.js';

function fixture(){
  return {
    fs: 256,
    sessionCode: 'ANR-001',
    protocol: 'Resting state',
    stopReason: 'stopped by researcher',
    startedAt: Date.parse('2026-08-25T13:39:41.370Z'),
    stoppedAt: Date.parse('2026-08-25T13:39:43.370Z'),
    deviceName: 'Muse-2E53',
    recorded: [
      {values:[1,2,3],times:[1000,1003.9,1007.8]},
      {values:[4,5,6],times:[1000,1003.9,1007.8]},
      {values:[7,8,9],times:[1000,1003.9,1007.8]},
      {values:[10,11,12],times:[1000,1003.9,1007.8]},
    ],
    events:[
      {timestamp: Date.parse('2026-08-25T13:39:42.370Z'), elapsed_s:1, label:'Blinking', source:'auto'},
    ],
  };
}

test('raw CSV contains deterministic MNE-ready time_s at 256 Hz', () => {
  const out = buildMneReadyFiles(fixture());
  const lines = out.rawCsv.trim().split('\n');
  assert.equal(lines[0], 'sample_index,time_s,timestamp_ms,iso_time,session_code,protocol,stop_reason,TP9_uV,AF7_uV,AF8_uV,TP10_uV,event_marker');
  assert.match(lines[1], /^0,0\.000000000,/);
  assert.match(lines[2], /^1,0\.003906250,/);
  assert.match(lines[3], /^2,0\.007812500,/);
});

test('events export contains one row per research event', () => {
  const out = buildMneReadyFiles(fixture());
  const lines = out.eventsTsv.trim().split('\n');
  assert.equal(lines[0], 'onset\tduration\tdescription\tsource');
  assert.equal(lines.length, 2);
  assert.equal(lines[1], '1.000000\t0.000000\tAUTO: Blinking\tauto');
});

test('metadata describes Muse EEG for MNE reconstruction', () => {
  const meta = JSON.parse(buildMneReadyFiles(fixture()).metadataJson);
  assert.equal(meta.format, 'ANR Muse EEG MNE-ready');
  assert.equal(meta.format_version, '1.1');
  assert.equal(meta.sampling_frequency_hz, 256);
  assert.deepEqual(meta.channel_names, ['TP9','AF7','AF8','TP10']);
  assert.equal(meta.units, 'microvolts');
  assert.equal(meta.mne_time_source, 'sample_index / sampling_frequency_hz');
  assert.equal(meta.n_samples, 3);
});

test('metadata distinguishes wall-clock and sampled EEG durations', () => {
  const meta = JSON.parse(buildMneReadyFiles(fixture()).metadataJson);
  assert.equal(meta.recording_duration_seconds, 2);
  assert.equal(meta.wall_clock_duration_seconds, 2);
  assert.equal(meta.eeg_duration_seconds, 3 / 256);
});

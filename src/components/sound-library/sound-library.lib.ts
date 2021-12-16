import { SoundLibraryItem } from './sound-library.d';

export const instruments: SoundLibraryItem[] = [
  { id: 'synth', name: 'Synth', type: 'instrument' },
  { id: 'sampler', name: 'Sampler', type: 'instrument' },
]

export const effects: SoundLibraryItem[] = [
  { id: 'auto-filter', name: 'AutoFilter', type: 'effect' },
  { id: 'auto-panner', name: 'AutoPanner', type: 'effect' },
  { id: 'auto-wah', name: 'AutoWah', type: 'effect' },
  { id: 'bit-crusher', name: 'BitCrusher', type: 'effect' },
  { id: 'chebyshev', name: 'Chebyshev', type: 'effect' },
  { id: 'chorus', name: 'Chorus', type: 'effect' },
  { id: 'distortion', name: 'Distortion', type: 'effect' },
  { id: 'feedback-delay', name: 'FeedbackDelay', type: 'effect' },
  { id: 'freeverb', name: 'Freeverb', type: 'effect' },
  { id: 'frequency-shifter', name: 'FrequencyShifter', type: 'effect' },
  { id: 'jc-reverb', name: 'JCReverb', type: 'effect' },
  { id: 'mid-side-effect', name: 'MidSideEffect', type: 'effect' },
  { id: 'phaser', name: 'Phaser', type: 'effect' },
  { id: 'ping-pong-delay', name: 'PingPongDelay', type: 'effect' },
  { id: 'pitch-shift', name: 'PitchShift', type: 'effect' },
  { id: 'reverb', name: 'Reverb', type: 'effect' },
  { id: 'stereo-widener', name: 'StereoWidener', type: 'effect' },
  { id: 'tremolo', name: 'Tremolo', type: 'effect' },
  { id: 'vibrato', name: 'Vibrato', type: 'effect' },

  { id: 'compressor', name: 'Compressor', type: 'effect' },
  { id: 'eq3', name: 'EQ3', type: 'effect' },
  { id: 'limiter', name: 'Limiter', type: 'effect' },

  { id: 'analyser', name: 'Analyser', type: 'utility' },
]

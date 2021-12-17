import * as Tone from 'tone';

export interface Track {
  id: number,
  name: string,
  midiInputId: string,
  midiOutputId: string,
  channel: Tone.Channel,
  instrument: TrackInstrument,
  effects: TrackEffect[],
  patterns: TrackPattern[],
}

export interface TrackInstrument {
  id: string,
  name: string,
  toneInstrument: any,
}

export interface TrackEffect {
  id: string,
  name: string,
  toneEffect: any,
}

export interface TrackPattern {
  id: number,
  name: string,
}

export interface TrackSelectedEvent extends CustomEvent {
  detail: number,
}

export interface TrackUpdatedEvent extends CustomEvent {
  detail: {
    id: number,
    attributes: {
      name?: string,
      midiInputId?: string,
      midiOutputId?: string,
      channel?: any,
      instrument?: any,
      effects?: any[],
    },
  },
}

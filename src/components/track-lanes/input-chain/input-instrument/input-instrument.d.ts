import { TrackInstrument } from '../../track-lane';

export interface AddInstrumentEvent extends CustomEvent {
  detail: {
    instrument: TrackInstrument,
  },
}

export interface RemoveInstrumentEvent extends CustomEvent {
  detail: {
    instrument: TrackInstrument,
  },
}

export interface KnobValueChangedEvent extends CustomEvent {
  detail: {
    name: string,
    value: string,
  },
}

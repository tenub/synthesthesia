
export interface AddInstrumentEvent extends CustomEvent {
  detail: {
    instrument: {
      id: string,
      name: string,
      toneInstrument: any,
    },
  },
}

export interface RemoveInstrumentEvent extends CustomEvent {
  detail: {
    instrument: any,
  },
}

export interface KnobValueChangedEvent extends CustomEvent {
  detail: {
    name: string,
    value: string,
  },
}

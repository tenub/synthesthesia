export interface InstrumentRemovedEvent extends CustomEvent {
  detail: any,
}

export interface KnobValueChangedEvent extends CustomEvent {
  detail: {
    name: string,
    value: string,
  },
}

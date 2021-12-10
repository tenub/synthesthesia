export interface EffectRemovedEvent extends CustomEvent {
  detail: number,
}

export interface KnobValueChangedEvent extends CustomEvent {
  detail: {
    name: string,
    value: string,
  },
}

export interface AddEffectEvent extends CustomEvent {
  detail: {
    index: number,
    effect: {
      id: string,
      name: string,
      toneEffect: any,
    },
  },
}

export interface RemoveEffectEvent extends CustomEvent {
  detail: {
    index: number,
  }
}

export interface KnobValueChangedEvent extends CustomEvent {
  detail: {
    name: string,
    value: string,
  },
}

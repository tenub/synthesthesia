export interface Track {
  id: number,
  name: string,
  inputId: string,
  outputId: string,
  instrument: any,
  effects: any[],
  utilities: any[]
}

export interface TrackSelectedEvent extends CustomEvent {
  detail: number,
}

export interface TrackUpdatedEvent extends CustomEvent {
  detail: {
    id: number,
    attributes: {
      name?: string,
      inputId?: string,
      outputId?: string,
      instrument?: any,
      effects?: any[],
      utilities?: any[],
    },
  },
}

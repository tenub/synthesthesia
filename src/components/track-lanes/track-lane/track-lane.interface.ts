export interface Track {
  id: number,
  name: string,
  generators: Array<any>,
  effects: Array<any>,
  utilities: Array<any>
}

export interface TrackSelectedEvent extends CustomEvent {
  detail: number,
}

export interface TrackUpdatedEvent extends CustomEvent {
  detail: {
    id: number,
    attributes: {
      name?: string,
      generators?: Array<any>,
      effects?: Array<any>,
    },
  },
}

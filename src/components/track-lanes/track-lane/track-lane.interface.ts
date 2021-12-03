export interface Track {
  id: number,
  name: string,
  generators: Array<TrackGenerator>,
  effects: Array<TrackEffect>,
}

export interface TrackGenerator {
  id: number,
  name: string,
}

export interface TrackEffect {
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
      generators?: Array<TrackGenerator>,
      effects?: Array<TrackEffect>,
    },
  },
}

export interface ToneType {
  isPlaying: boolean,
  frequency: number,
  oscillator: object,
  velocity: number,
}

export interface ToneHash {
  [frequency: number]: {
    isPlaying: boolean,
    velocity: number
  },
}

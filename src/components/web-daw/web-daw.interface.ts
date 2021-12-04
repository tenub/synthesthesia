export interface ToneType {
  isPlaying: boolean,
  velocity: number,
}

export interface ToneHash {
  [frequency: string]: ToneType,
}

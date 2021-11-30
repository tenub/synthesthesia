export interface ToneEvent extends CustomEvent {
  detail: {
    frequency: number,
    velocity: number,
  },
}

export interface GeneratorNode {
  oscillator: OscillatorNode,
  gain: GainNode,
}

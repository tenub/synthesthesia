import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import './components/keyboard-controller/index.js';

import { GeneratorNode, ToneEvent } from './app.interface';

@customElement('synthesizer-app')
export class Synthesizer extends LitElement {
  @state()
  private _audioContext: AudioContext | null = null;

  @state()
  private _generators: { [key: number]: GeneratorNode } = {};

  constructor() {
    super();

    this.addEventListener('tonestarted', this._startTone);
    this.addEventListener('toneended', this._endTone);
  }

  /**
   * Store initial audio context
   */
  private _initAudioContext() {
    if (!window.AudioContext) {
      return;
    }

    const audioContext = new window.AudioContext();
    this._audioContext = audioContext;
  }

  private _startTone = (event: ToneEvent) => {
    const { frequency, velocity } = event.detail;
    this._addGenerator(frequency, velocity);
  }

  private _endTone = (event: ToneEvent) => {
    const { frequency } = event.detail;
    this._removeGenerator(frequency);
  }

  private _addGenerator = (frequency: number, gain: number) => {
    if (!this._audioContext) {
      this._initAudioContext();
    } else if (this._audioContext.state !== 'running') {
      this._audioContext.resume();
    }

    const audioContext = this._audioContext as AudioContext;
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
    gainNode.connect(audioContext.destination);

    const oscillatorNode = audioContext.createOscillator();
    oscillatorNode.type = 'sawtooth';
    oscillatorNode.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillatorNode.connect(gainNode);
    oscillatorNode.start();

    this._generators = {
      ...this._generators,
      [frequency]: {
        oscillator: oscillatorNode,
        gain: gainNode,
      },
    };
  }

  private _removeGenerator = (frequency: number) => {
    const generator = this._generators[frequency] as GeneratorNode;
    if (!generator) {
      return;
    }

    generator.oscillator.stop();
    generator.oscillator.disconnect(generator.gain);

    const generators = { ...this._generators };
    delete generators[frequency];
    this._generators = generators;
  }

  override render() {
    return html`
      <div class="synthesizer">
        <keyboard-controller size="49"></keyboard-controller>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'synthesizer-app': Synthesizer;
  }
}

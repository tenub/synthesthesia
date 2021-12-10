import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Tone from 'tone';

import { Track } from '../track-lane/track-lane.interface';

import './input-instrument';
import './input-effect';

@customElement('input-chain')
export class InputChain extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      box-shadow: 0 0 1em var(--background-color-1);
      box-sizing: var(--box-sizing);
      display: flex;
      grid-column: 1 / 1;
      grid-row: 2 / 2;
      padding: 0.5em 1em;
      position: relative;
      z-index: 2;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    .input-chain {
      display: grid;
      gap: 0 0.5em;
      grid-template-columns: [instrument-col] auto
                             [effects-col] auto
                             [utilities-col] auto ;
      grid-template-rows: [title-row] 20px [chain-row] auto;
      overflow: auto;
    }

    .input-chain__label {
      grid-column: 1 / 3;
      grid-row: 1 / 1;
    }

    .input-chain__instrument,
    .input-chain__effects,
    .input-chain__utilities {
      background-color: var(--background-color-3);
      border-top: 1px solid var(--background-color-1);
      border-radius: 0.5em;
      box-shadow: inset 0 1px 0.25em var(--background-color-1);
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      height: 100%;
      min-width: 64px;
      padding: 0.5em 0;
    }

    .input-chain__instrument {
      grid-column: 1 / 1;
      grid-row: 2 / 2;
    }

    .input-chain__effects {
      grid-column: 2 / 2;
      grid-row: 2 / 2;
    }

    .input-chain__utilities {
      grid-column: 3 / 3;
      grid-row: 2 / 2;
    }
  `;

  @property({ type: Object })
  track: Track;

  constructor() {
    super();

    this.addEventListener('dragover', this._allowDrop);
    this.addEventListener('drop', this._handleDrop);
    this.addEventListener('trackselected', this._handleTrackSelected);
  }

  private _defineInstrument(id: string, name: string): any {
    const [firstEffect] = this.track.effects;

    let toneInstrument;
    switch (id) {
      case 'synth': {
        toneInstrument = new Tone.PolySynth();

        if (firstEffect) {
          toneInstrument.disconnect().connect(firstEffect.toneEffect);
        } else {
          toneInstrument.toDestination();
        }

        break;
      }
      case 'sampler':
        toneInstrument = new Tone.Sampler().toDestination();
        break;
      default:
        return;
    }

    return {
      id,
      name,
      generators: [],
      toneInstrument,
    };
  }

  private _defineEffect(id: string, name: string): any {
    const instrument = this.track.instrument;

    let toneEffect;
    switch (id) {
      case 'reverb': {
        toneEffect = new Tone.Reverb({
          decay: 10,
          wet: 0.5,
        }).toDestination();

        if (instrument) {
          instrument.toneInstrument.disconnect().connect(toneEffect);
        }

        break;
      }

      default:
        return;
    }

    return {
      id,
      name,
      toneEffect,
    };
  }

  private _allowDrop = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  private _handleDrop = (event: DragEvent) => {
    const data = event.dataTransfer.getData('text/plain');
    const { type, id, name } = JSON.parse(data);
    switch (type) {
      case 'instrument': {
        const instrument = this._defineInstrument(id, name);
        if (!instrument) {
          return;
        }

        const event = new CustomEvent('trackupdated', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            id: this.track.id,
            attributes: { instrument },
          },
        });
        this.dispatchEvent(event);
        break;
      }

      case 'effect': {
        const effect = this._defineEffect(id, name);
        if (!effect) {
          return;
        }

        const event = new CustomEvent('trackupdated', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            id: this.track.id,
            attributes: {
              effects: [
                ...this.track.effects,
                effect,
              ],
            },
          },
        });
        this.dispatchEvent(event);
        break;
      }

      default: break;
    }
  }

  private _handleTrackSelected = (event: CustomEvent) => {
    const selectedTrack = event.detail;
    this.track = selectedTrack;
  }

  private _renderInstrument() {
    if (!this.track.instrument) {
      return null;
    }

    return html`
      <input-instrument .instrument=${this.track.instrument}></input-instrument>
    `;
  }

  private _renderEffect(effect: any, index: number) {
    return html`
      <input-effect
        effectIndex=${index}
        .effect=${effect}
      ></input-effect>
    `;
  }

  override render() {
    return html`
      <div class="input-chain">
        <div class="input-chain__label">
          ${this.track.name}
        </div>

        <div class="input-chain__instrument">
          ${this._renderInstrument()}
        </div>

        <div class="input-chain__effects">
          ${this.track.effects.map(this._renderEffect)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-chain': InputChain;
  }
}

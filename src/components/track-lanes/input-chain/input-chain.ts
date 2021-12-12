import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
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

  @state()
  _closestDropIndex = 0;

  _instrumentRef = createRef<HTMLDivElement>();

  _effectsRef = createRef<HTMLDivElement>();

  constructor() {
    super();

    this.addEventListener('dragover', this._allowDrop);
    this.addEventListener('drop', this._handleDrop);
    this.addEventListener('trackselected', this._handleTrackSelected);
  }

  private _defineInstrument(id: string, name: string): any {
    let toneInstrument;
    switch (id) {
      case 'synth': {
        toneInstrument = new Tone.PolySynth();

        break;
      }
      case 'sampler':
        toneInstrument = new Tone.Sampler();
        break;
      default:
        return;
    }

    return {
      id,
      name,
      toneInstrument,
    };
  }

  private _defineEffect(id: string, name: string): any {
    let toneEffect;
    switch (id) {
      case 'reverb': {
        toneEffect = new Tone.Reverb({
          decay: 10,
          wet: 0.5,
        });

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

    let closestDiffX;

    const effectsContainer = this._effectsRef.value!;
    const closestDropIndex = [...effectsContainer.children].reduce((
      closestIndex,
      element,
      index,
    ) => {
      const effectElement = element as HTMLElement;
      const midElementX = effectElement.offsetLeft + effectElement.offsetWidth / 2;
      const diffX =  event.offsetX - midElementX;
      const diffXMagnitude = Math.abs(diffX);
      if (typeof closestDiffX === 'undefined' || diffXMagnitude < closestDiffX) {
        closestDiffX = diffXMagnitude;
        closestIndex = index;
      }

      return diffX < 0 ? closestIndex : closestIndex + 1;
    }, 0);

    this._closestDropIndex = closestDropIndex;
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

        const event = new CustomEvent('instrumentadded', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            instrument,
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

        const event = new CustomEvent('effectadded', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            index: this._closestDropIndex,
            effect,
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

        <div
          ${ref(this._instrumentRef)}
          class="input-chain__instrument"
        >
          ${this._renderInstrument()}
        </div>

        <div
          ${ref(this._effectsRef)}
          class="input-chain__effects"
        >
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

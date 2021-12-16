import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import * as Tone from 'tone';

import { Track } from '../track-lane/track-lane.d';

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

    ::-webkit-scrollbar {
      background: none;
      height: 12px;
    }


    ::-webkit-scrollbar-thumb {
      background: var(--background-color-1);
      background-clip: content-box;
      border: 2px solid transparent;
      border-radius: 6px;
    }

    .input-chain {
      display: grid;
      gap: 0 0.5em;
      grid-template-columns: [instrument-col] auto [effects-col] auto;
      grid-template-rows: [chain-row] max-content;
    }

    .input-chain__instrument,
    .input-chain__effects {
      background-color: var(--background-color-3);
      border-top: 1px solid var(--background-color-1);
      border-radius: 0.5em;
      box-shadow: 0 0.125em 0.25em var(--background-color-1);
      display: flex;
      gap: 0.5em;
      height: 100%;
      min-width: 64px;
      padding: 0.5em 0;
      position: relative;
    }

    .input-chain__instrument {
      grid-column: 1 / 1;
      grid-row: 2 / 2;
    }

    .input-chain__effects {
      grid-column: 2 / 2;
      grid-row: 2 / 2;
      overflow: auto;
    }

    .input-chain__effect-placeholder {
      background-color: red;
      border-radius: 1px;
      height: calc(100% - --size-increment);
      margin: 0 var(--size-increment);
      width: 2px;
    }

    .chain-placeholder {
      font-size: 0.75em;
      left: 50%;
      position: absolute;
      bottom: 50%;
      transform: translateX(-50%) translateY(-50%) rotate(-90deg);
      width: 128px;
    }
  `;

  @property({ type: Object })
  track: Track;

  @state()
  _closestDropIndex = -1;

  _instrumentRef = createRef<HTMLDivElement>();

  _effectsRef = createRef<HTMLDivElement>();

  constructor() {
    super();

    this.addEventListener('dragover', this._handleDragOver);
    this.addEventListener('dragend', this._handleDragEnded);
    this.addEventListener('dragleave', this._handleDragEnded);
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
      case 'auto-filter':
        toneEffect = new Tone.AutoFilter();
        break;

      case 'chorus':
        toneEffect = new Tone.Chorus();
        break;

      case 'distortion':
        toneEffect = new Tone.Distortion();
        break;

      case 'ping-pong-delay':
        toneEffect = new Tone.PingPongDelay();
        break;

      case 'reverb':
        toneEffect = new Tone.Reverb();
        break;

      default:
        return;
    }

    return {
      id,
      name,
      toneEffect,
    };
  }

  private _handleDragOver = (event: DragEvent) => {
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
      const isFirstElement = typeof closestDiffX === 'undefined';
      if (isFirstElement || diffXMagnitude < closestDiffX) {
        closestDiffX = diffXMagnitude;
        closestIndex = index;
      }

      return (isFirstElement || (!isFirstElement && diffX < 0))
        ? closestIndex
        : closestIndex + 1;
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

    this._closestDropIndex = -1;
  }

  private _handleDragEnded = (event: DragEvent) => {
    this._closestDropIndex = -1;
  }

  private _handleTrackSelected = (event: CustomEvent) => {
    const selectedTrack = event.detail;
    this.track = selectedTrack;
  }

  private _renderInstrument() {
    if (!this.track.instrument) {
      return this._renderChainPlaceholder('instrument');
    }

    return html`
      <input-instrument .instrument=${this.track.instrument}></input-instrument>
    `;
  }

  private _renderEffect(effect: any, index: number) {
    if (effect.id === 'effect-placeholder') {
      return html`
        <div class="input-chain__effect-placeholder"></div>
      `;
    }

    return html`
      <input-effect
        effectIndex=${index}
        .effect=${effect}
      ></input-effect>
    `;
  }

  private _renderChainPlaceholder(type: string) {
    return html`
      <div class="chain-placeholder">
        Drag ${type} here
      </div>
    `;
  }

  override render() {
    const effects = this.track.effects.slice();
    /* if (this._closestDropIndex > -1) {
      effects.splice(this._closestDropIndex, 0, {
        id: 'effect-placeholder',
        name: 'Effect Placeholder',
        toneEffect: null,
      });
    } */

    return html`
      <div class="input-chain">
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
          ${effects.length > 0
            ? effects.map(this._renderEffect)
            : this._renderChainPlaceholder('effect')}
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

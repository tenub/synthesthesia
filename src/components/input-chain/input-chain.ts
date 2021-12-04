import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import * as Tone from 'tone';

import { Track } from '../track-lanes/track-lane/track-lane.interface';

import './input-generator';

@customElement('input-chain')
export class InputChain extends LitElement {
  static defineGenerator(name: string): any {
    switch (name) {
      case 'synth':
        return Tone.Synth;
      case 'polysynth':
        return Tone.PolySynth;
      default:
        return undefined;
    }
  }

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
      grid-template-columns: [generators-col] auto
                             [effects-col] auto
                             [utilities-col] auto ;
      grid-template-rows: [title-row] 20px [chain-row] auto;
      overflow: auto;
    }

    .input-chain__label {
      grid-column: 1 / 3;
      grid-row: 1 / 1;
    }

    .input-chain__generators,
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

    .input-chain__generators {
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

    /* .input-chain__generators,
    .input-chain__effects {
      transform: rotateZ(-90deg) translateX(-100%);
      transform-origin: top left;
    } */
  `;

  @property({ type: Object })
  track: Track;

  generatorsRef = createRef<HTMLDivElement>();

  constructor() {
    super();

    this.addEventListener('dragover', this._allowDrop);
    this.addEventListener('drop', this._handleDrop);
    this.addEventListener('trackselected', this._handleTrackSelected);
  }

  private _allowDrop = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  private _handleDrop = (event: DragEvent) => {
    const data = event.dataTransfer.getData('text/plain');
    const { type, name } = JSON.parse(data);
    switch (type) {
      case 'generator': {
        const ToneGenerator = InputChain.defineGenerator(name);
        if (!ToneGenerator) {
          return;
        }

        const toneGenerator = new ToneGenerator().toDestination();
        const event = new CustomEvent('trackupdated', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: {
            id: this.track.id,
            attributes: {
              generators: [
                ...this.track.generators,
                toneGenerator,
              ],
            },
          },
        });
        this.dispatchEvent(event);
      }
      break;

      case 'effect': {
        switch (name) {
          case 'autofilter': {
            
          }
          break;

          default: break;
        }
      }
      break;

      case 'utility': {
        switch (name) {
          case 'analyser': {
            
          }
          break;

          default: break;
        }
      }
      break;

      default: break;
    }
  }

  private _handleTrackSelected = (event: CustomEvent) => {
    const selectedTrack = event.detail;
    this.track = selectedTrack;
  }

  private _renderGenerator(generator: any) {
    return html`
      <input-generator .generator=${generator}></input-generator>
    `;
  }

  private _renderEffect(effect: any) {
    return html`
      <div class="input-chain__effect">${effect.name}</div>
    `;
  }

  private _renderUtility(utility: any) {
    return html`
      <div class="input-chain__utility">${utility.name}</div>
    `;
  }

  override render() {
    return html`
      <div class="input-chain">
        <div class="input-chain__label">
          ${this.track.name}
        </div>

        <div
          ${ref(this.generatorsRef)}
          class="input-chain__generators"
        >
          ${this.track.generators.map(this._renderGenerator)}
        </div>

        <div class="input-chain__effects">
          ${this.track.effects.map(this._renderEffect)}
        </div>

        <div class="input-chain__utilities">
          ${this.track.utilities.map(this._renderUtility)}
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

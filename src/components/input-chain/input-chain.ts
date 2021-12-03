import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Tone from 'tone';

import { Track } from '../track-lanes/track-lane/track-lane.interface';

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
      position: relative;
      z-index: 2;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    .input-chain {
      padding: 0.5em 1em;
    }
  `;

  @property({ type: Object })
  track: Track

  constructor() {
    super();

    this.addEventListener('dragover', this._allowDrop);
    this.addEventListener('drop', this._handleDrop);
    this.addEventListener('trackselected', this._handleTrackSelected);
  }

  private _handleTrackSelected = (event: CustomEvent) => {
    const selectedTrack = event.detail;
    this.track = selectedTrack;
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
        switch (name) {
          case 'synth': {
            const generatorToAdd = new Tone.Synth().toDestination();
            const event = new CustomEvent('trackupdated', {
              bubbles: true,
              composed: true,
              cancelable: true,
              detail: {
                id: this.track.id,
                attributes: {
                  generators: [
                    ...this.track.generators,
                    generatorToAdd,
                  ],
                },
              },
            });
            this.dispatchEvent(event);
          }
          break;

          default: break;
        }
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

  override render() {
    const {
      generators: activeGenerators,
      effects: activeEffects,
    } = this.track;
    return html`
      <div class="input-chain">
        ${this.track.name}
        <input-generators
          .generators=${activeGenerators}
        ></input-generators>

        <input-effects
          .effects=${activeEffects}
        ></input-effects>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-chain': InputChain;
  }
}

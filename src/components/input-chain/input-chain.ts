import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { Track } from '../track-lanes/track-lanes.interface';

@customElement('input-chain')
export class InputChain extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--main-background-color);
      box-shadow: 0 0 1em var(--shadow-background-color);
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
  `;

  @property({ type: Object })
  track: Track

  constructor() {
    super();
    this.addEventListener('trackselected', this._handleTrackSelected);
  }

  private _handleTrackSelected = (event: CustomEvent) => {
    const selectedTrack = event.detail;
    this.track = selectedTrack;
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

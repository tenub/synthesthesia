import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '../shared/custom-icon';

@customElement('global-controls')
export class GlobalControls extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      background-image: linear-gradient(
        var(--background-color-3),
        var(--background-color-2)
      );
      border-bottom: 1px solid var(--background-color-1);
      box-shadow: 0 0 1em var(--background-color-1);
      grid-column: 1 / 3;
      grid-row: 1 / auto;
      position: relative;
      z-index: 4;
    }

    .controls--left {
      align-items: center;
      display: flex;
      height: 100%;
      left: 1em;
      position: absolute;
      top: 0;
    }

    .controls--center {
      align-items: center;
      display: flex;
      height: 100%;
      justify-content: center;
    }

    .controls--right {
      align-items: center;
      display: flex;
      height: 100%;
      right: 1em;
      position: absolute;
      top: 0;
    }

    button {
      background: none;
      border: none;
      color: var(--main-color);
      font-family: var(--main-font-family);
      font-size: var(--main-font-size);
      height: 100%;
      margin: 0;
      padding: 0.25em;
    }

    .bpm {
      align-items: center;
      display: flex;
    }
  `;

  @state()
  bpm = 120;

  override render() {
    return html`
      <div class="controls--left">
        <button class="bpm">
          <custom-icon size="small">hdr_strong</custom-icon>&nbsp;${this.bpm}
        </button>
      </div>

      <div class="controls--center">
        <button>
          <custom-icon>
            play_arrow
          </custom-icon>
        </button>

        <button>
          <custom-icon>
            stop
          </custom-icon>
        </button>

        <button>
          <custom-icon>
            fiber_manual_record
          </custom-icon>
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'global-controls': GlobalControls;
  }
}

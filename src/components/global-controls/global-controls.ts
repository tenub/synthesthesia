import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '../custom-icon';

@customElement('global-controls')
export class GlobalControls extends LitElement {
  static override styles = css`
    :host {
      align-items: center;
      background-color: var(--main-background-color);
      background-image: linear-gradient(
        var(--highlight-background-color),
        var(--main-background-color)
      );
      border-bottom: 1px solid var(--shadow-background-color);
      box-shadow: 0 0 1em var(--shadow-background-color);
      display: flex;
      grid-column: 1 / 3;
      grid-row: 1 / auto;
      justify-content: center;
      position: relative;
      z-index: 4;
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
      margin-right: 2em;
    }
  `;

  @state()
  bpm = 120;

  override render() {
    return html`
      <button class="bpm">
        ${this.bpm}
      </button>

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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'global-controls': GlobalControls;
  }
}

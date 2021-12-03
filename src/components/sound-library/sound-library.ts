import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import './chain-element';

@customElement('sound-library')
export class SoundLibrary extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      box-shadow: 0 0 1em var(--background-color-1);
      display: flex;
      grid-column: 1 / 1;
      grid-row: 2 / 2;
      position: relative;
      z-index: 3;
    }

    ul {
      margin: 0;
      padding-left: 1em;
    }

    .sound-library {
      padding: 0.5em 1em;
    }
  `;

  override render() {
    return html`
      <div class="sound-library">
        <ul>
          <li>
            Generators
            <ul>
              <li>
                <chain-element
                  draggable="true"
                  type="generator"
                  name="synth"
                >
                  Synth
                </chain-element>
              </li>
            </ul>
          </li>
          <li>
            Effects
            <ul>
              <li>
                <chain-element
                  draggable="true"
                  type="effect"
                  name="autofilter"
                >
                  Auto Filter
                </chain-element>
              </li>
            </ul>
          </li>
          <li>
            Utilities
            <ul>
              <li>
                <chain-element
                  draggable="true"
                  type="utility"
                  name="analyser"
                >
                  Analyser
                </chain-element>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sound-library': SoundLibrary;
  }
}

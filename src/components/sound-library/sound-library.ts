import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('sound-library')
export class SoundLibrary extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--main-background-color);
      box-shadow: 0 0 1em var(--shadow-background-color);
      display: flex;
      grid-column: 1 / 1;
      grid-row: 2 / 2;
      position: relative;
      z-index: 3;
    }
  `;

  override render() {
    return html`
      <div class="sound-library">
        <ul>
          <li>
            Generators
            <ul>
              <li>Audio Buffer</li>
              <li>Oscillator</li>
            </ul>
          </li>
          <li>
            Effects
            <ul>
              <li>Auto Filter</li>
              <li>Convolver</li>
              <li>Delay</li>
              <li>Dynamics Compressor</li>
              <li>Gain</li>
              <li>IIR Filter</li>
              <li>Panner</li>
              <li>Stereo Panner</li>
              <li>Wave Shaper</li>
            </ul>
          </li>
          <li>
            Utilities
            <ul>
              <li>Analyser</li>
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

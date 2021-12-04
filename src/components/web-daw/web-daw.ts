import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '../global-controls';
import '../sound-library';
import '../track-lanes';

import {
  ToneEvent,
} from '../keyboard-controller/keyboard-controller.interface';
import {
  ToneHash,
} from './web-daw.interface';

@customElement('web-daw')
export class WebDAW extends LitElement {
  static override styles = css`
    :host {
      --box-sizing: border-box;
      --hsl-increment: 6.25%;
      --background-color-1: hsl(0, 0%, var(--hsl-increment));
      --background-color-2: hsl(0, 0%, calc(2 * var(--hsl-increment)));
      --background-color-3: hsl(0, 0%, calc(3 * var(--hsl-increment)));
      --background-color-4: hsl(0, 0%, calc(4 * var(--hsl-increment)));
      --background-color-5: hsl(0, 0%, calc(5 * var(--hsl-increment)));
      --main-color: white;
      --main-font-family: 'Roboto Condensed', sans-serif;
      --main-font-size: 16px;

      background-color: var(--background-color-2);
      box-sizing: var(--box-sizing);
      color: var(--main-color);
      display: grid;
      font-family: var(--main-font-family);
      grid-template-columns: [left-col] 320px [main-col] auto;
      grid-template-rows: [top-row] 64px [main-row] auto;
      height: 100vh;
      width: 100%;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }
  `;

  constructor() {
    super();

    this.addEventListener('tonestarted', this._startTone);
    this.addEventListener('toneended', this._endTone);
  }

  @state()
  tones: ToneHash = {}

  private _startTone(event: ToneEvent) {
    const { frequency, velocity } = event.detail;
    this.tones = {
      ...this.tones,
      [frequency]: {
        isPlaying: true,
        velocity,
      },
    };
  }

  private _endTone(event: ToneEvent) {
    const { frequency, velocity } = event.detail;
    this.tones = {
      ...this.tones,
      [frequency]: {
        isPlaying: false,
        velocity,
      },
    };
  }

  override render() {
    return html`
      <global-controls></global-controls>
      <sound-library></sound-library>
      <track-lanes .tones=${this.tones}></track-lanes>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'web-daw': WebDAW;
  }
}

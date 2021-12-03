import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


import '../../custom-icon';

import { Track } from './track-lane.interface';

@customElement('track-lane')
export class TrackLane extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--background-color-3);
      box-shadow: 0 0 1em var(--background-color-1);
      box-sizing: var(--box-sizing);
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    .track {
      background-color: var(--background-color-3);
      border-bottom: 1px solid var(--background-color-2);
      border-top: 1px solid hsl(0, 0%, 25%);
      display: flex;
      height: 96px;
      justify-content: flex-end;
      width: 100%;
    }

    .track__controls {
      background-color: var(--background-color-4);
      padding: 0.5em 1em;
    }

    .track__label {
      background: none;
      border: none;
      color: var(--main-color);
      display: block;
      font-size: 12px;
      height: 100%;
      margin: 0;
      padding: 0;
      resize: none;
      width: 64px;
    }

    .track__label:hover {
      color: hsl(0, 0%, calc(100% - 2 * var(--hsl-increment)));
      cursor: pointer;
    }

    .track__label:focus {
      border-width: 0 0 1px;
      outline: none;
    }
  `;

  trackLabelRef = createRef<HTMLDivElement>();

  @property({ type: Object })
  track: Track;

  private _selectTrack = () => {
    const event = new CustomEvent('trackselected', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: this.track.id,
    });
    this.dispatchEvent(event);
  }

  private _selectTrackLabel = () => {
    const trackLabel = this.trackLabelRef.value! as HTMLInputElement;
    trackLabel.select();
  }

  private _updateTrackName = () => {
    const trackLabel = this.trackLabelRef.value! as HTMLInputElement;
    const newTrackName = trackLabel.value;
    const event = new CustomEvent('trackupdated', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        id: this.track.id,
        attributes: {
          name: newTrackName,
        },
      },
    });
    this.dispatchEvent(event);
  }

  private _blurTrackLabel = (event: KeyboardEvent) => {
    const { key } = event;
    if (key !== 'Enter') {
      return;
    }

    const trackLabel = this.trackLabelRef.value! as HTMLInputElement;
    trackLabel.blur();
  }

  override render() {
    return html`
      <div
        class="track"
        @click=${this._selectTrack}
      >
        <div class="track__controls">
          <textarea
            ${ref(this.trackLabelRef)}
            class="track__label"
            @focus=${this._selectTrackLabel}
            @input=${this._updateTrackName}
            @keydown=${this._blurTrackLabel}
          >${this.track.name}</textarea>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'track-lane': TrackLane;
  }
}

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


import '../../shared/custom-icon';

import { MIDIInput, MIDIOutput } from '../../../web-daw/web-daw.interface';
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

    .track__midi {
      margin-top: calc(-1 / 6 * 1em);
      padding: 0.5em 1em;
    }

    .track__midi-input {
      background: none;
      border: none;
      color: var(--main-color);
      font-size: 12px;
    }

    .track__midi-input:focus {
      outline: none;
    }

    .track__midi-input option {
      color: black;
    }
  `;

  @property({ type: Array })
  midiInputs: MIDIInput[];

  @property({ type: Array })
  midiOutputs: MIDIOutput[];

  @property({ type: Object })
  track: Track;

  trackLabelRef = createRef<HTMLDivElement>();

  trackMidiInputRef = createRef<HTMLSelectElement>();

  private _dispatchSelectTrack = () => {
    const detail = this.track.id;
    const event = new CustomEvent('trackselected', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    this.dispatchEvent(event);
  }

  private _dispatchUpdateTrack = (attributes: object) => {
    const detail = { id: this.track.id, attributes };
    const event = new CustomEvent('trackupdated', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    this.dispatchEvent(event);
  }

  private _updateTrackName = () => {
    const trackLabel = this.trackLabelRef.value! as HTMLInputElement;
    const newTrackName = trackLabel.value;
    this._dispatchUpdateTrack({ name: newTrackName });
  }

  private _updateTrackInput = () => {
    const midiInput = this.trackMidiInputRef.value! as HTMLSelectElement;
    const newTrackInputId = midiInput.value;
    this._dispatchUpdateTrack({ inputId: newTrackInputId });
  }

  private _selectTrackLabel = () => {
    const trackLabel = this.trackLabelRef.value! as HTMLInputElement;
    trackLabel.select();
  }

  private _blurTrackLabel = (event: KeyboardEvent) => {
    const { key } = event;
    if (key !== 'Enter') {
      return;
    }

    const trackLabel = this.trackLabelRef.value! as HTMLInputElement;
    trackLabel.blur();
  }

  private _renderMidiInputs(input: MIDIInput) {
    return html`
      <option
        name=${input.name}
        value=${input.id}
      >
        ${input.name}
      </option>
    `;
  }

  override render() {
    return html`
      <div
        class="track"
        @click=${this._dispatchSelectTrack}
      >
        <div class="track__controls">
          <textarea
            ${ref(this.trackLabelRef)}
            class="track__label"
            .value=${this.track.name}
            @focus=${this._selectTrackLabel}
            @input=${this._updateTrackName}
            @keydown=${this._blurTrackLabel}
          ></textarea>
        </div>

        <div class="track__midi">
          <select
            ${ref(this.trackMidiInputRef)}
            class="track__midi-input"
            @change=${this._updateTrackInput}
          >
            ${this.midiInputs.map(this._renderMidiInputs)}
          </select>
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
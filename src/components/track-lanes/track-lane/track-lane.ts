import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import * as Tone from 'tone';

import '../../shared/custom-icon';
import '../../shared/input-meter';

import { MIDIInput, MIDIOutput } from '../../../web-daw/web-daw.d';
import { Track, TrackPattern } from './track-lane.d';

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
      display: flex;
      height: 96px;
      justify-content: flex-end;
      width: 100%;
    }

    .track__controls {
      background-color: var(--background-color-4);
      padding: 0.5em 1em;
    }

    .track__timeline {
      padding: 0.5em 1em;
      width: 100%;
    }

    .track__patterns {
      align-items: flex-start;
      display: inline-flex;
      flex-direction: column;
      flex-wrap: wrap;
      gap: 0.5em;
      height: 100%;
    }

    .track__pattern {
      background-color: var(--background-color-4);
      border: 1px dashed var(--background-color-2);
      border-radius: var(--size-increment);
      box-shadow: 0 0.125em 0.5em var(--background-color-2);
      font-size: 0.75em;
      padding: 0.5em 1em;
    }

    .track__pattern:hover {
      background-color: var(--background-color-5);
    }

    .add-pattern {
      align-items: center;
      background: none;
      border: none;
      color: var(--main-color);
      display: flex;
      font-family: var(--main-font-family);
      font-size: var(--main-font-size);
      margin: 0;
      padding: 0.25em;
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
      padding: 0.5em 1em;
    }

    .track__midi-input {
      background: none;
      border: none;
      color: var(--main-color);
      display: block;
      font-size: 0.75em;
    }

    .track__midi-input:focus {
      outline: none;
    }

    .track__midi-input option {
      color: black;
    }

    .track__output {
      background-color: var(--background-color-4);
      padding: 0.5em 0.5em 0.5em 1em;
    }
  `;

  @property({ type: Array })
  midiInputs: MIDIInput[];

  @property({ type: Array })
  midiOutputs: MIDIOutput[];

  @property({ type: Object })
  track: Track;

  @state()
  meter = null;

  @state()
  channelVolume = [-Infinity, -Infinity];

  _trackLabelRef = createRef<HTMLDivElement>();

  _trackMidiInputRef = createRef<HTMLSelectElement>();

  override connectedCallback() {
    super.connectedCallback();

    this.meter = new Tone.Meter({
      channels: 2,
      normalRange: true,
    });
    this.track.channel.connect(this.meter);

    window.requestAnimationFrame(this._getChannelVolume);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.track.channel.disconnect(this.meter);
    this.meter.dispose();
  }

  private _getChannelVolume = () => {
    this.channelVolume = this.meter.getValue();
    window.requestAnimationFrame(this._getChannelVolume);
  }

  private _dispatchSelectTrack = () => {
    const event = new CustomEvent('trackselected', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { id: this.track.id },
    });
    this.dispatchEvent(event);
  }

  private _dispatchUpdateTrack = (attributes: object) => {
    const event = new CustomEvent('trackupdated', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { id: this.track.id, attributes },
    });
    this.dispatchEvent(event);
  }

  private _dispatchSelectPattern = (id: number) => {
    this._dispatchSelectTrack();

    const event = new CustomEvent('patternselected', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { id },
    });
    this.dispatchEvent(event);
  }

  private _updateTrackName = () => {
    const trackLabel = this._trackLabelRef.value! as HTMLInputElement;
    const newTrackName = trackLabel.value;
    this._dispatchUpdateTrack({ name: newTrackName });
  }

  private _updateTrackInput = () => {
    const midiInput = this._trackMidiInputRef.value! as HTMLSelectElement;
    const newTrackMidiInputId = midiInput.value;
    this._dispatchUpdateTrack({ midiInputId: newTrackMidiInputId });
  }

  private _selectTrackLabel = () => {
    const trackLabel = this._trackLabelRef.value! as HTMLInputElement;
    trackLabel.select();
  }

  private _blurTrackLabel = (event: KeyboardEvent) => {
    const { key } = event;
    if (key !== 'Enter') {
      return;
    }

    const trackLabel = this._trackLabelRef.value! as HTMLInputElement;
    trackLabel.blur();
  }

  private _addPattern = () => {
    const track = { ...this.track };
    const newPatternId = track.patterns.length;
    const newPatternName = `Pattern ${newPatternId + 1}`;
    const newPattern = {
      id: newPatternId,
      name: newPatternName,
      notes: [],
    } as TrackPattern;
    this._dispatchUpdateTrack({
      patterns: [
        ...track.patterns,
        newPattern,
      ],
    });
  }

  private _renderPattern = (pattern: TrackPattern) => {
    return html`
      <div
        class="track__pattern"
        @click=${(event: Event) => {
          event.stopPropagation();
          this._dispatchSelectPattern(pattern.id);
        }}
      >
        ${pattern.name}
      </div>
    `;
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
        <div class="track__timeline">
          <div class="track__patterns">
            ${this.track.patterns.map(this._renderPattern)}

            <button
              class="add-pattern"
              @click=${this._addPattern}
            >
              <custom-icon>add</custom-icon>
              Add Pattern
            </button>
          </div>
        </div>

        <div class="track__controls">
          <textarea
            ${ref(this._trackLabelRef)}
            class="track__label"
            .value=${this.track.name}
            @focus=${this._selectTrackLabel}
            @input=${this._updateTrackName}
            @keydown=${this._blurTrackLabel}
          ></textarea>
        </div>

        <div class="track__midi">
          <select
            ${ref(this._trackMidiInputRef)}
            class="track__midi-input"
            @change=${this._updateTrackInput}
          >
            ${this.midiInputs.map(this._renderMidiInputs)}
          </select>
        </div>

        <div class="track__output">
          <input-meter .value=${this.channelVolume}></input-meter>
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

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

import '../shared/custom-icon';
import './input-chain';
import './track-lane';

import {
  Track,
  TrackSelectedEvent,
  TrackUpdatedEvent,
} from './track-lane/track-lane.interface';
import {
  EffectRemovedEvent,
} from './input-chain/input-effect/input.effect.interface';
import {
  MIDIInput,
  MIDIOutput,
  MIDINoteInput,
} from '../../web-daw/web-daw.interface';

@customElement('track-lanes')
export class TrackLanes extends LitElement {
  static TUNING_FREQUENCY = 440;

  static MIDI_NOTE_ON = 144;

  static MIDI_NOTE_OFF = 128;

  static midiNumberToFrequency(m: number): number {
    const f2 = TrackLanes.TUNING_FREQUENCY;
    const f1 = Math.pow(2, (m - 69) / 12) * f2;
    return f1 + Number.EPSILON;
  }

  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      box-shadow: 0 0 1em var(--background-color-1);
      box-sizing: var(--box-sizing);
      display: grid;
      grid-column: 2 / 2;
      grid-row: 2 / 2;
      grid-template-rows: [tracks] calc(100vh - 384px) [chain] 320px;
      position: relative;
      z-index: 1;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    .track-lanes {
      overflow: auto;
    }

    .add-track {
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
  `;

  @property({ type: Array })
  midiInputs: MIDIInput[];

  @property({ type: Array })
  midiOutputs: MIDIOutput[];

  @property({ type: Object })
  midiNotes: MIDINoteInput;

  @state()
  tracks: Track[] = [{
    id: 0,
    name: 'Track 1',
    inputId: null,
    outputId: null,
    instrument: null,
    effects: [],
    utilities: [],
  }];

  @state()
  selectedTrackIndex = 0;

  trackLanesRef = createRef<HTMLDivElement>();

  constructor() {
    super();

    this.addEventListener('trackselected', this._handleSelectTrack);
    this.addEventListener('trackupdated', this._handleUpdateTrack);
    this.addEventListener('instrumentremoved', this._handleRemoveInstrument);
    this.addEventListener('effectremoved', this._handleRemoveEffect);
  }

  override willUpdate(changedProperties: Map<string, any>) {
    const prevMidiNotes = changedProperties.get('midiNotes') ?? {};
    this.tracks.forEach((track: Track) => {
      if (!track.inputId) {
        return;
      }

      const prevNotes = prevMidiNotes[track.inputId] ?? {};
      const notes = this.midiNotes[track.inputId] ?? {};
      Object.entries(notes).forEach(([key, velocity]) => {
        const note = Number(key);
        const frequency = TrackLanes.midiNumberToFrequency(note);
        const gain = velocity / 127;
        if (!prevNotes[key]) {
          this._startInstrument(track.instrument, { frequency, gain });
        }
      });

      Object.entries(prevNotes).forEach(([key]) => {
        if (!notes[key]) {
          const note = Number(key);
          const frequency = TrackLanes.midiNumberToFrequency(note);
          this._stopInstrument(track.instrument, { frequency });
        }
      });
    });
  }

  private _startInstrument(
    instrument: { id: string, name: string, toneInstrument: any },
    attributes: { frequency: number, gain: number },
  ) {
    switch (instrument.id) {
      case 'synth':
        instrument.toneInstrument.triggerAttack(attributes.frequency, 0, attributes.gain);
        break;
      default:
        break;
    }
  }

  private _stopInstrument(
    instrument: { id: string, name: string, toneInstrument: any },
    attributes: { frequency: number },
  ) {
    switch (instrument.id) {
      case 'synth':
      case 'sampler':
        instrument.toneInstrument.triggerRelease(attributes.frequency);
        break;
      default:
        break;
    }
  }

  private _handleRemoveInstrument = () => {
    const tracks = this.tracks.slice();
    const selectedTrack = tracks[this.selectedTrackIndex];
    this.dispatchEvent(new CustomEvent('trackupdated', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        id: selectedTrack.id,
        attributes: {
          instrument: null,
        },
      },
    }));
  }

  private _handleRemoveEffect = (event: EffectRemovedEvent) => {
    const tracks = this.tracks.slice();
    const selectedTrack = tracks[this.selectedTrackIndex];
    const effectIndex = event.detail;
    const updatedEffects = selectedTrack.effects.splice(effectIndex, 1);
    this.dispatchEvent(new CustomEvent('trackupdated', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        id: selectedTrack.id,
        attributes: {
          effects: updatedEffects,
        },
      },
    }));
  }

  private _addTrack = () => {
    const newTrackId = this.tracks.length;
    const newTrack = {
      id: newTrackId,
      name: `Track ${newTrackId + 1}`,
      inputId: null,
      outputId: null,
      instrument: null,
      effects: [],
      utilities: [],
    } as Track;
    this.tracks = [
      ...this.tracks,
      newTrack,
    ];

    setTimeout(() => {
      const trackLane = this.trackLanesRef.value!;
      trackLane.scrollTop = trackLane.offsetHeight;
    });
  }

  private _handleSelectTrack(event: TrackSelectedEvent) {
    const id = event.detail;
    const trackIndex = this.tracks.findIndex(track => track.id === id);
    if (trackIndex === -1) {
      return;
    }

    this.selectedTrackIndex = trackIndex;
  }

  private _handleUpdateTrack(event: TrackUpdatedEvent) {
    const { id, attributes } = event.detail;
    const trackIndex = this.tracks.findIndex(track => track.id === id);
    if (trackIndex === -1) {
      return;
    }

    const updatedTracks = this.tracks.slice();
    const trackToUpdate = updatedTracks[trackIndex];
    updatedTracks[trackIndex] = { ...trackToUpdate, ...attributes };
    this.tracks = updatedTracks;
  }

  private _renderTrack = (track: Track) => {
    return html`
      <track-lane
        .midiInputs=${this.midiInputs}
        .midiOutputs=${this.midiOutputs}
        .track=${track}
      ></track-lane>
    `;
  }

  override render() {
    const selectedTrack = this.tracks[this.selectedTrackIndex];
    return html`
      <div
        class="track-lanes"
        ${ref(this.trackLanesRef)}
      >
        ${this.tracks.map(this._renderTrack)}

        <button
          class="add-track"
          @click=${this._addTrack}
        >
          <custom-icon>add</custom-icon>
          Add Track
        </button>
      </div>

      <input-chain .track=${selectedTrack}></input-chain>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'track-lanes': TrackLanes;
  }
}

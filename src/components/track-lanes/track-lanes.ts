import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import * as Tone from 'tone';

import '../shared/custom-icon';
import './input-chain';
import './track-lane';

import {
  Track,
  TrackInstrument,
  TrackEffect,
  TrackSelectedEvent,
  TrackUpdatedEvent,
} from './track-lane/track-lane.d';
import {
  AddInstrumentEvent,
  RemoveInstrumentEvent,
} from './input-chain/input-instrument/input-instrument.d';
import {
  AddEffectEvent,
  RemoveEffectEvent,
} from './input-chain/input-effect/input-effect.d';
import {
  MIDIInput,
  MIDIOutput,
  MIDINoteInput,
} from '../../web-daw/web-daw.d';

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

    .track-lanes--empty {
      align-items: center;
      display: flex;
      justify-content: center;
    }

    .track-lanes--empty .add-track {
      color: grey;
      font-size: 2em;
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
  tracks: Track[] = [];

  @state()
  selectedTrackIndex = 0;

  _trackLanesRef = createRef<HTMLDivElement>();

  constructor() {
    super();

    this.addEventListener('trackselected', this._handleSelectTrack);
    this.addEventListener('trackupdated', this._handleUpdateTrack);
    this.addEventListener('instrumentadded', this._handleAddInstrument);
    this.addEventListener('instrumentremoved', this._handleRemoveInstrument);
    this.addEventListener('effectadded', this._handleAddEffect);
    this.addEventListener('effectremoved', this._handleRemoveEffect);
  }

  override willUpdate(changedProperties: Map<string, any>) {
    const prevMidiNotes = changedProperties.get('midiNotes') ?? {};
    this.tracks.forEach((track: Track) => {
      if (!track.midiInputId) {
        return;
      }

      const prevNotes = prevMidiNotes[track.midiInputId] ?? {};
      const notes = this.midiNotes[track.midiInputId] ?? {};
      Object.entries(notes).forEach(([key, velocity]) => {
        const note = Number(key);
        const frequency = TrackLanes.midiNumberToFrequency(note);
        const gain = velocity / 127;
        if (!prevNotes[key] ) {
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
    instrument: TrackInstrument,
    attributes: { frequency: number, gain: number },
  ) {
    if (!instrument) {
      return;
    }

    switch (instrument.id) {
      case 'synth':
        instrument.toneInstrument.triggerAttack(attributes.frequency, 0, attributes.gain);
        break;
      default:
        break;
    }
  }

  private _stopInstrument(
    instrument: TrackInstrument,
    attributes: { frequency: number },
  ) {
    if (!instrument) {
      return;
    }

    switch (instrument.id) {
      case 'synth':
      case 'sampler':
        instrument.toneInstrument.triggerRelease(attributes.frequency);
        break;
      default:
        break;
    }
  }

  private _handleAddInstrument = (event: AddInstrumentEvent) => {
    const { instrument: instrumentToAdd } = event.detail;
    const updatedTracks = this.tracks.slice();

    if (updatedTracks[this.selectedTrackIndex].instrument) {
      updatedTracks[this.selectedTrackIndex].instrument.toneInstrument.dispose();
    }

    updatedTracks[this.selectedTrackIndex].instrument = instrumentToAdd;
    this.tracks = updatedTracks;

    const selectedTrack = updatedTracks[this.selectedTrackIndex];
    this._validateAudioChain(selectedTrack);
  }

  private _handleRemoveInstrument = (event: RemoveInstrumentEvent) => {
    const updatedTracks = this.tracks.slice();
    updatedTracks[this.selectedTrackIndex].instrument.toneInstrument.dispose();
    updatedTracks[this.selectedTrackIndex].instrument = null;
    this.tracks = updatedTracks;

    const selectedTrack = updatedTracks[this.selectedTrackIndex];
    this._validateAudioChain(selectedTrack);
  }

  private _handleAddEffect = (event: AddEffectEvent) => {
    const { index: effectToAddIndex, effect: effectToAdd } = event.detail;
    const updatedTracks = this.tracks.slice();
    updatedTracks[this.selectedTrackIndex].effects.splice(effectToAddIndex, 0, effectToAdd);
    this.tracks = updatedTracks;

    const selectedTrack = updatedTracks[this.selectedTrackIndex];
    this._validateAudioChain(selectedTrack);
  }

  private _handleRemoveEffect = (event: RemoveEffectEvent) => {
    const { index: effectIndex } = event.detail;
    const updatedTracks = this.tracks.slice();
    updatedTracks[this.selectedTrackIndex].effects[effectIndex].toneEffect.dispose();
    updatedTracks[this.selectedTrackIndex].effects.splice(effectIndex, 1);
    this.tracks = updatedTracks;

    const selectedTrack = updatedTracks[this.selectedTrackIndex];
    this._validateAudioChain(selectedTrack);
  }

  private _validateAudioChain(track: Track) {
    const { channel, instrument, effects } = track;

    const toneEffects = [];
    effects.forEach((effect) => {
      effect.toneEffect.disconnect();
      toneEffects.push(effect.toneEffect);
    });

    if (instrument && effects.length === 0) {
      instrument.toneInstrument.disconnect().connect(channel);
    } else if (instrument && effects.length > 0) {
      instrument.toneInstrument.disconnect().chain(...toneEffects, channel);
    }
  }

  private _addTrack = () => {
    const newTrackId = this.tracks.length;
    const newTrackName = `Track ${newTrackId + 1}`;
    const newTrackChannel = new Tone.Channel().toDestination();
    const newTrack = {
      id: newTrackId,
      name: newTrackName,
      midiInputId: null,
      midiOutputId: null,
      channel: newTrackChannel,
      instrument: null,
      effects: [],
    } as Track;
    this.tracks = [
      ...this.tracks,
      newTrack,
    ];

    setTimeout(() => {
      const trackLane = this._trackLanesRef.value!;
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

  private _renderInputChain() {
    const selectedTrack = this.tracks[this.selectedTrackIndex];
    if (!selectedTrack) {
      return null;
    }

    return html`
      <input-chain .track=${selectedTrack}></input-chain>
    `;
  }

  override render() {
    const trackCount = this.tracks.length;
    const isTracksEmpty = trackCount === 0;
    const trackLaneClasses = {
      'track-lanes': true,
      'track-lanes--empty': isTracksEmpty,
    };

    return html`
      <div
        class=${classMap(trackLaneClasses)}
        ${ref(this._trackLanesRef)}
      >
        ${this.tracks.map(this._renderTrack)}

        <button
          class="add-track"
          @click=${this._addTrack}
        >
          <custom-icon size=${isTracksEmpty ? 'huge' : 'medium'}>add</custom-icon>
          Add Track
        </button>
      </div>

      ${this._renderInputChain()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'track-lanes': TrackLanes;
  }
}

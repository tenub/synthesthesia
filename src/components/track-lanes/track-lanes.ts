import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import * as Tone from 'tone';

import { midiNumberToFrequency } from '../../helpers';

import '../shared/custom-icon';

import './piano-roll';
import './input-chain';
import './track-lane';

import {
  Track,
  TrackInstrument,
  TrackSelectedEvent,
  TrackUpdatedEvent,
  PatternSelectedEvent,
  PatternUpdatedEvent,
} from './track-lane/track-lane.d';
import {
  AddInstrumentEvent,
} from './input-chain/input-instrument/input-instrument.d';
import {
  AddEffectEvent,
  RemoveEffectEvent,
} from './input-chain/input-effect/input-effect.d';
import {
  MIDIInput,
  MIDIOutput,
  MIDINoteInput,
  DragData,
} from '../../web-daw/web-daw.d';

@customElement('track-lanes')
export class TrackLanes extends LitElement {
  static MIDI_NOTE_ON = 144;

  static MIDI_NOTE_OFF = 128;

  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      box-shadow: 0 0 1em var(--background-color-1);
      box-sizing: var(--box-sizing);
      display: grid;
      grid-column: 2 / 2;
      grid-row: 2 / 2;
      grid-template-columns: [main-area] 100%;
      grid-template-rows: [tracks] calc(100vh - 832px) [piano-roll] 512px [chain] 256px;
      overflow: hidden;
      position: relative;
      width: calc(100vw - 320px);
      z-index: 1;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    .track-lanes {
      display: flex;
      flex-direction: column;
      gap: 1px;
      grid-column: 1 / 1;
      grid-row: 1 / 1;
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
      white-space: nowrap;
    }
  `;

  @property({ type: Array })
  midiInputs: MIDIInput[];

  @property({ type: Array })
  midiOutputs: MIDIOutput[];

  @property({ type: Object })
  inputNotes: MIDINoteInput;

  @property({ type: Object })
  dragData: DragData;

  @state()
  tracks: Track[] = [];

  @state()
  selectedTrackIndex = -1;

  @state()
  selectedPatternIndex = -1;

  _trackLanesRef = createRef<HTMLDivElement>();

  constructor() {
    super();

    this.addEventListener('trackselected', this._handleSelectTrack);
    this.addEventListener('trackupdated', this._handleUpdateTrack);
    this.addEventListener('instrumentadded', this._handleAddInstrument);
    this.addEventListener('instrumentremoved', this._handleRemoveInstrument);
    this.addEventListener('effectadded', this._handleAddEffect);
    this.addEventListener('effectremoved', this._handleRemoveEffect);
    this.addEventListener('patternselected', this._handleSelectPattern);
    this.addEventListener('patternupdated', this._handleUpdatePattern);
  }

  override willUpdate(changedProperties: Map<string, any>) {
    const prevInputNotes = changedProperties.get('inputNotes') ?? {};
    this.tracks.forEach((track: Track) => {
      const noteKey = track.midiInputId;
      const prevNotes = prevInputNotes[noteKey] ?? {};
      const notes = this.inputNotes[noteKey] ?? {};
      Object.entries(notes).forEach(([key, velocity]) => {
        const note = Number(key);
        const frequency = midiNumberToFrequency(note);
        const gain = velocity / 127;
        if (!prevNotes[key]) {
          this._startInstrument(track.instrument, { frequency, gain });
        }
      });

      Object.entries(prevNotes).forEach(([key]) => {
        if (!notes[key]) {
          const note = Number(key);
          const frequency = midiNumberToFrequency(note);
          this._stopInstrument(track.instrument, { frequency });
        }
      });

      const prevKeyboardNotes = prevInputNotes.keyboard ?? {};
      const keyboardNotes = this.inputNotes.keyboard ?? {};
      Object.entries(keyboardNotes).forEach(([key, velocity]) => {
        const note = Number(key);
        const frequency = midiNumberToFrequency(note);
        const gain = velocity / 127;
        if (!prevNotes[key]) {
          this._startInstrument(track.instrument, { frequency, gain });
        }
      });

      Object.entries(prevKeyboardNotes).forEach(([key]) => {
        if (!notes[key]) {
          const note = Number(key);
          const frequency = midiNumberToFrequency(note);
          this._stopInstrument(track.instrument, { frequency });
        }
      });
    });
  }

  get selectedTrack() {
    const track = this.tracks[this.selectedTrackIndex];
    if (!track) {
      return null;
    }

    return track;
  }

  get selectedPattern() {
    const track = this.selectedTrack;
    if (!track) {
      return null;
    }

    const pattern = track.patterns[this.selectedPatternIndex];
    if (!pattern) {
      return null;
    }

    return pattern;
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

    if (this.tracks[this.selectedTrackIndex].instrument?.toneInstrument) {
      this.tracks[this.selectedTrackIndex].instrument.toneInstrument.dispose();
    }

    this.tracks = [
      ...this.tracks.slice(0, this.selectedTrackIndex),
      {
        ...this.tracks[this.selectedTrackIndex],
        instrument: instrumentToAdd,
      },
      ...this.tracks.slice(this.selectedTrackIndex + 1),
    ];

    const selectedTrack = this.tracks[this.selectedTrackIndex];
    this._validateAudioChain(selectedTrack);
  }

  private _handleRemoveInstrument = () => {
    this.tracks[this.selectedTrackIndex].instrument?.toneInstrument.dispose();
    this.tracks = [
      ...this.tracks.slice(0, this.selectedTrackIndex),
      {
        ...this.tracks[this.selectedTrackIndex],
        instrument: null,
      },
      ...this.tracks.slice(this.selectedTrackIndex + 1),
    ];

    const selectedTrack = this.tracks[this.selectedTrackIndex];
    this._validateAudioChain(selectedTrack);
  }

  private _handleAddEffect = (event: AddEffectEvent) => {
    const { index: effectToAddIndex, effect: effectToAdd } = event.detail;
    const updatedTracks = [...this.tracks];
    updatedTracks[this.selectedTrackIndex].effects.splice(effectToAddIndex, 0, effectToAdd);
    this.tracks = updatedTracks;

    const selectedTrack = updatedTracks[this.selectedTrackIndex];
    this._validateAudioChain(selectedTrack);
  }

  private _handleRemoveEffect = (event: RemoveEffectEvent) => {
    const { index: effectIndex } = event.detail;

    this.tracks[this.selectedTrackIndex].effects[effectIndex].toneEffect.dispose();

    const clonedTracks = [...this.tracks];
    const trackToUpdate = clonedTracks[this.selectedTrackIndex];
    const effectsToUpdate = [...trackToUpdate.effects];
    effectsToUpdate.splice(effectIndex, 1);
    this.tracks = [
      ...this.tracks.slice(0, this.selectedTrackIndex),
      {
        ...this.tracks[this.selectedTrackIndex],
        effects: effectsToUpdate,
      },
      ...this.tracks.slice(this.selectedTrackIndex + 1),
    ];

    const selectedTrack = this.tracks[this.selectedTrackIndex];
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
      patterns: [],
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

  private _handleSelectTrack = (event: TrackSelectedEvent) => {
    const { id } = event.detail;
    const trackIndex = this.tracks.findIndex(track => track.id === id);
    if (trackIndex < 0) {
      return;
    }

    this.selectedTrackIndex = trackIndex;
  }

  private _handleDeselectTrack = (event: PointerEvent) => {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.closest('track-lane')) {
      this.selectedTrackIndex = -1;
      this.selectedPatternIndex = -1;
    }
  }

  private _handleUpdateTrack = (event: TrackUpdatedEvent) => {
    const { id, attributes } = event.detail;
    const trackIndex = this.tracks.findIndex(track => track.id === id);
    if (trackIndex < 0) {
      return;
    }

    const updatedTracks = [...this.tracks];
    const trackToUpdate = updatedTracks[trackIndex];
    updatedTracks[trackIndex] = { ...trackToUpdate, ...attributes };
    this.tracks = updatedTracks;
  }

  private _handleSelectPattern = (event: PatternSelectedEvent) => {
    const { id } = event.detail;
    const selectedTrack = this.tracks[this.selectedTrackIndex];
    if (!selectedTrack) {
      return;
    }

    const patternIndex = selectedTrack.patterns.findIndex(pattern => pattern.id === id);
    if (patternIndex < 0) {
      return;
    }

    this.selectedPatternIndex = patternIndex;
  }

  private _handleUpdatePattern = (event: PatternUpdatedEvent) => {
    const { id, attributes } = event.detail;
    const updatedTracks = [...this.tracks];
    const trackIndex = updatedTracks.findIndex(track => track.id === this.selectedTrack.id);
    const trackToUpdate = updatedTracks[trackIndex];
    const patternIndex = trackToUpdate.patterns.findIndex(pattern => pattern.id === id);
    const patternToUpdate = updatedTracks[trackIndex].patterns[patternIndex];
    updatedTracks[trackIndex].patterns[patternIndex] = {
      ...patternToUpdate,
      ...attributes,
    };
    this.tracks = updatedTracks;
  }

  private _renderTrackLanes = () => {
    const trackCount = this.tracks.length;
    const isTracksEmpty = trackCount === 0;
    const trackLaneClasses = {
      'track-lanes': true,
      'track-lanes--empty': isTracksEmpty,
    };

    return html`
      <div
        ${ref(this._trackLanesRef)}
        class=${classMap(trackLaneClasses)}
        @click=${this._handleDeselectTrack}
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
    `;
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
    return html`
      ${this._renderTrackLanes()}

      <piano-roll
        .inputNotes=${this.inputNotes}
        .track=${this.selectedTrack}
        .pattern=${this.selectedPattern}
      ></piano-roll>

      <input-chain
        .track=${this.selectedTrack}
        .dragData=${this.dragData}
      ></input-chain>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'track-lanes': TrackLanes;
  }
}

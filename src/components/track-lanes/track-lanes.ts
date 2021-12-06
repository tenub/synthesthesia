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
  MIDIInput,
  MIDIOutput,
  MIDINoteInput,
} from '../../web-daw/web-daw.interface';

@customElement('track-lanes')
export class TrackLanes extends LitElement {
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
    input: null,
    output: null,
    generators: [],
    effects: [],
    utilities: [],
  }];

  @state()
  selectedTrackIndex = 0;

  trackLanesRef = createRef<HTMLDivElement>();

  constructor() {
    super();

    this.addEventListener('trackselected', this._setSelectedTrack);
    this.addEventListener('trackupdated', this._updateTrack);
  }

  /* private _handleNoteChange(
    input: MIDIInput,
    status: string,
    note: number,
    velocity: number,
  ) {
    const selectedTrack = this.tracks[this.selectedTrackIndex];
    const { generators } = selectedTrack;
    if (!generators.length) {
      return;
    }
  }

  private _startGenerators(
    generators: any[],
    attributes: { frequency: number, velocity: number },
  ) {
    generators.forEach((generator: any) => {
      switch (generator.name) {
        case 'Synth':
        case 'PolySynth':
          generator.triggerAttack(attributes.frequency, 0, attributes.velocity);
          break;
        default:
          break;
      }
    });
  }

  private _stopGenerators(
    generators: any[],
    attributes: { frequency: number, velocity: number },
  ) {
    generators.forEach((generator: any) => {
      switch (generator.name) {
        case 'Synth':
          generator.triggerRelease();
          break;
        case 'PolySynth':
          generator.triggerRelease(attributes.frequency);
          break;
        default:
          break;
      }
    });
  } */

  private _addTrack = () => {
    const newTrackId = this.tracks.length;
    const newTrack = {
      id: newTrackId,
      name: `Track ${newTrackId + 1}`,
      input: null,
      output: null,
      generators: [],
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

  private _setSelectedTrack(event: TrackSelectedEvent) {
    const id = event.detail;
    const trackIndex = this.tracks.findIndex(track => track.id === id);
    if (trackIndex === -1) {
      return;
    }

    this.selectedTrackIndex = trackIndex;
  }

  private _updateTrack(event: TrackUpdatedEvent) {
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

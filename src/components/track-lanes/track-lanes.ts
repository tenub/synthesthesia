import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

import '../custom-icon';
import '../input-chain';
import './track-lane';

import {
  Track,
  TrackSelectedEvent,
  TrackUpdatedEvent,
} from './track-lane/track-lane.interface';
import {
  ToneHash,
  ToneType,
} from '../web-daw/web-daw.interface';

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

  @property({ type: Object })
  tones: ToneHash;

  @state()
  tracks: Array<Track> = [{
    id: 0,
    name: 'Track 1',
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

  override willUpdate(changedProperties: Map<string, any>) {
    const prevTones = changedProperties.get('tones');
    this._parseTones(prevTones, this.tones);
  }

  private _parseTones(prevTones: ToneHash, tones: ToneHash) {
    const selectedTrack = this.tracks[this.selectedTrackIndex];
    const { generators } = selectedTrack;
    if (!generators.length) {
      return;
    }

    Object.entries(tones).forEach(([key, attributes]) => {
      const frequency = Number(key);
      const { isPlaying, velocity } = attributes as ToneType;
      const prevTone = ((prevTones ?? {})[key] ?? {}) as ToneType;
      if (isPlaying && !prevTone.isPlaying) {
        this._startGenerators(generators, { frequency, velocity });
      } else if (!isPlaying && prevTone.isPlaying) {
        this._stopGenerators(generators, { frequency, velocity });
      }
    });
  }

  private _startGenerators(
    generators: Array<any>,
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
    generators: Array<any>,
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
  }

  private _addTrack = () => {
    const newTrackId = this.tracks.length;
    const newTrack = {
      id: newTrackId,
      name: `Track ${newTrackId + 1}`,
      generators: [],
      effects: [],
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

    const trackToUpdate = this.tracks[trackIndex];
    this.tracks = [
      ...this.tracks.slice(0, trackIndex),
      { ...trackToUpdate, ...attributes },
      ...this.tracks.slice(trackIndex + 1),
    ];
  }

  private _renderTrack(track: Track) {
    return html`
      <track-lane .track=${track}></track-lane>
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

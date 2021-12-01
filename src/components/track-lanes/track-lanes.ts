import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


import '../custom-icon';

import { Track } from './track-lanes.interface';

@customElement('track-lanes')
export class TrackLanes extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--main-background-color);
      box-shadow: 0 0 1em var(--shadow-background-color);
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

    .track {
      background-color: var(--highlight-background-color);
      border-bottom: 1px solid var(--main-background-color);
      border-top: 1px solid hsl(0, 0%, 25%);
      height: 96px;
      padding: 0.5em 1em;
      width: 100%;
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

  trackLaneRef = createRef<HTMLDivElement>();

  @state()
  tracks: Array<Track> = [{
    id: 0,
    name: 'Track 1',
    generators: [],
    effects: [],
  }];

  @state()
  selectedTrackIndex = 0;

  private _addTrack = () => {
    const newTrackIndex = this.tracks.length;
    const newTrack = {
      id: newTrackIndex,
      name: `Track ${newTrackIndex + 1}`,
      generators: [],
      effects: [],
    } as Track;
    this.tracks = [
      ...this.tracks,
      newTrack,
    ];

    setTimeout(() => {
      const trackLane = this.trackLaneRef.value!;
      trackLane.scrollTop = trackLane.offsetHeight;
    });
  }

  private _selectTrack = (index: number) => {
    this.selectedTrackIndex = index;
    const selectedTrack = this.tracks[index];

    const event = new CustomEvent('trackselected', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: selectedTrack,
    });
    this.dispatchEvent(event);
  }

  private _renderTrack = (track: Track, index: number) => {
    return html`
      <div
        class="track"
        @click=${() => { this._selectTrack(index); }}
      >
        ${track.name}
      </div>
    `;
  }

  override render() {
    const selectedTrack = this.tracks[this.selectedTrackIndex];
    return html`
      <div
        class="track-lanes"
        ${ref(this.trackLaneRef)}
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

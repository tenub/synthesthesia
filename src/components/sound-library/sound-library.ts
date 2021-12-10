import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

import './sound-library-element';

import { SoundLibraryItem } from './sound-library.interface';

@customElement('sound-library')
export class SoundLibrary extends LitElement {
  static instruments: SoundLibraryItem[] = [
    { id: 'synth', name: 'Synth', type: 'instrument' },
    { id: 'sampler', name: 'Sampler', type: 'instrument' },
  ]

  static effects: SoundLibraryItem[] = [
    { id: 'auto-filter', name: 'AutoFilter', type: 'effect' },
    { id: 'auto-panner', name: 'AutoPanner', type: 'effect' },
    { id: 'auto-wah', name: 'AutoWah', type: 'effect' },
    { id: 'bit-crusher', name: 'BitCrusher', type: 'effect' },
    { id: 'chebyshev', name: 'Chebyshev', type: 'effect' },
    { id: 'chorus', name: 'Chorus', type: 'effect' },
    { id: 'distortion', name: 'Distortion', type: 'effect' },
    { id: 'feedback-delay', name: 'FeedbackDelay', type: 'effect' },
    { id: 'freeverb', name: 'Freeverb', type: 'effect' },
    { id: 'frequency-shifter', name: 'FrequencyShifter', type: 'effect' },
    { id: 'jc-reverb', name: 'JCReverb', type: 'effect' },
    { id: 'mid-side-effect', name: 'MidSideEffect', type: 'effect' },
    { id: 'phaser', name: 'Phaser', type: 'effect' },
    { id: 'ping-pong-delay', name: 'PingPongDelay', type: 'effect' },
    { id: 'pitch-shift', name: 'PitchShift', type: 'effect' },
    { id: 'reverb', name: 'Reverb', type: 'effect' },
    { id: 'stereo-widener', name: 'StereoWidener', type: 'effect' },
    { id: 'tremolo', name: 'Tremolo', type: 'effect' },
    { id: 'vibrato', name: 'Vibrato', type: 'effect' },

    { id: 'compressor', name: 'Compressor', type: 'effect' },
    { id: 'eq3', name: 'EQ3', type: 'effect' },
    { id: 'limiter', name: 'Limiter', type: 'effect' },
  ]

  static utilities: SoundLibraryItem[] = [
    { id: 'analyser', name: 'Analyser', type: 'utility' },
  ]

  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      box-shadow: 0 0 1em var(--background-color-1);
      display: flex;
      grid-column: 1 / 1;
      grid-row: 2 / 2;
      height: calc(100vh - 64px);
      overflow: auto;
      position: relative;
      z-index: 3;
    }

    :host::-webkit-scrollbar {
      background: none;
      width: 12px;
    }


    :host::-webkit-scrollbar-thumb {
      background: var(--background-color-1);
      background-clip: content-box;
      border: 2px solid transparent;
      border-radius: 6px;
    }

    h1 {
      margin: 1em 0 0.25em;
    }

    ul {
      margin: 0;
    }

    .sound-library {
      padding: 1em;
      width: 100%;
    }

    .sound-library__filter {
      background: none;
      border: 1px solid var(--background-color-3);
      border-radius: 1em;
      box-shadow: 0 0.25em 1em var(--background-color-1);
      color: grey;
      font-size: 1em;
      height: 2em;
      padding: 0 1em;
      width: 100%;
    }

    .sound-library__filter:focus {
      border-color: var(--background-color-5);
      outline: none;
    }

    .sound-library__categories,
    .sound-library__items {
      list-style: none;
      padding-left: 0;
    }

    .sound-library__categories:last-child {
      padding-bottom: 1em;
    }
  `;

  @state()
  itemFilter: string = '';

  itemFilterRef = createRef<HTMLInputElement>();

  private _setItemFilter = () => {
    const { value } = this.itemFilterRef.value! as HTMLInputElement;
    this.itemFilter = value;
  }

  private _filterAndRenderItems = (items: SoundLibraryItem[], item: SoundLibraryItem) => {
    const haystack = item.name.toLowerCase();
    const needle = this.itemFilter.toLowerCase();
    if (haystack.includes(needle)) {
      return [
        ...items,
        this._renderItem(item),
      ];
    }

    return items;
  }

  private _renderItem(item: SoundLibraryItem) {
    return html`
      <li>
        <sound-library-element
          draggable="true"
          type=${item.type}
          itemId=${item.id}
          name=${item.name}
        >
          <custom-icon size="tiny">add</custom-icon>
          ${item.name}
        </sound-library-element>
      </li>
    `;
  }

  override render() {
    return html`
      <section class="sound-library">
        <input
          ${ref(this.itemFilterRef)}
          class="sound-library__filter"
          placeholder="Search"
          type="search"
          @input=${this._setItemFilter}
        >

        <ul class="sound-library__categories">
          <li>
            <h1>Instruments</h1>
            <ul class="sound-library__items">
              ${SoundLibrary.instruments.reduce(this._filterAndRenderItems, [])}
            </ul>
          </li>
          <li>
            <h1>Effects</h1>
            <ul class="sound-library__items">
              ${SoundLibrary.effects.reduce(this._filterAndRenderItems, [])}
            </ul>
          </li>
          <li>
            <h1>Utilities</h1>
            <ul class="sound-library__items">
              ${SoundLibrary.utilities.reduce(this._filterAndRenderItems, [])}
            </ul>
          </li>
        </ul>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sound-library': SoundLibrary;
  }
}

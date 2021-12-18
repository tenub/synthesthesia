import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import * as Tone from 'tone';

import { octaveMap, noteMap } from '../../../helpers';
import { MIDINoteInput, MIDINotes } from '../../../web-daw/web-daw.d';

import { Track, TrackPattern } from '../track-lane/track-lane.d';

@customElement('piano-roll')
export class PianoRoll extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      box-shadow: 0 0 1em var(--background-color-1);
      box-sizing: var(--box-sizing);
      display: flex;
      grid-column: 1 / 1;
      grid-row: 2 / 2;
      padding: 0.5em 1em;
      position: relative;
      z-index: 2;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    ::-webkit-scrollbar {
      background: none;
      height: 12px;
      width: 12px;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--background-color-1);
      background-clip: content-box;
      border: 2px solid transparent;
      border-radius: 6px;
    }

    .piano-roll--isEmpty {
      align-items: center;
      color: grey;
      display: flex;
      justify-content: center;
      width: 100%;
      user-select: none;
    }

    .piano-roll__keys {
      background-color: black;
      box-shadow: 0 0.125em 0.5em var(--background-color-1);
      display: flex;
      flex-direction: column-reverse;
      gap: 3px;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
    }

    .piano-roll__octave {
      display: flex;
      flex-direction: column-reverse;
      gap: 1px;
    }

    .piano-roll__note {
      align-items: center;
      background-color: var(--main-color);
      color: black;
      display: flex;
      font-size: 0.75em;
      height: 24px;
      padding-left: 0.25em;
      width: 32px;
    }

    .piano-roll__note--sharp {
      background-color: black;
      color: var(--main-color);
    }

    .piano-roll__note--playing {
      background-color: red;
      color: var(--main-color);
    }
  `;

  @property({ type: Object })
  inputNotes: MIDINoteInput;

  @property({ type: Object })
  pattern: TrackPattern;

  _KeysRef = createRef<HTMLDivElement>();

  private _renderPattern() {
    const inputNotes = Object.values(this.inputNotes);
    const mergedInputNotes = inputNotes.reduce((
      mergedNotes: MIDINotes,
      notes: MIDINotes,
    ) => {
      return { ...mergedNotes, ...notes };
    }, {});

    return html`
      <div
        ${ref(this._KeysRef)}
        class="piano-roll__keys"
      >
        ${octaveMap.map((octave: number) => {
          return html`
            <div class="piano-roll__octave">
              ${noteMap.map((note: string, index: number) => {
                const midiNote = octave * 12 + index;
                const playedNote = mergedInputNotes[midiNote];
                const isNotePlaying = typeof playedNote !== 'undefined';
                const [letter, symbol] = note.split('');
                const classes = {
                  'piano-roll__note': true,
                  'piano-roll__note--sharp': note.includes('#'),
                  'piano-roll__note--playing': isNotePlaying,
                };

                if (symbol) {
                  return html`
                    <div class=${classMap(classes)}>
                      ${letter}<sup>${symbol}</sup>${octave}
                    </div>
                  `;
                }

                return html`
                  <div class=${classMap(classes)}>
                    ${letter}${octave}
                  </div>
                `;
              })}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderNullState() {
    return html`
      <span>No pattern selected</span>
    `;
  }

  get isPatternDefined() {
    const isPatternDefined = typeof this.pattern !== 'undefined';
    return isPatternDefined;
  }

  override render() {
    const classes = {
      'piano-roll': true,
      'piano-roll--isEmpty': !this.isPatternDefined,
    };
    return html`
      <div class=${classMap(classes)}>
        ${this.isPatternDefined ? this._renderPattern() : this._renderNullState()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'piano-roll': PianoRoll;
  }
}

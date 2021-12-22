import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import * as Tone from 'tone';

import { octaveMap, noteMap, formatBeats } from '../../../helpers';
import { MIDINoteInput, MIDINotes } from '../../../web-daw/web-daw.d';

import { Track, TrackPattern } from '../track-lane/track-lane.d';

@customElement('piano-roll')
export class PianoRoll extends LitElement {
  static gridSize = 24;

  static keyWidth = 64;

  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      box-shadow: 0 0 1em var(--background-color-1);
      box-sizing: var(--box-sizing);
      display: flex;
      grid-column: 1 / 1;
      grid-row: 2 / 2;
      padding: 0.5em 1em calc(0.5em + ${PianoRoll.gridSize}px);
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
      height: 24px;
      width: 24px;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--background-color-1);
      background-clip: content-box;
      border: 8px solid transparent;
      border-radius: 12px;
    }

    ::-webkit-scrollbar-corner {
      background: none;
    }

    .piano-roll {
      height: 100%;
      position: relative;
      width: 100%;
    }

    .piano-roll--isEmpty {
      align-items: center;
      color: grey;
      display: flex;
      justify-content: center;
      width: 100%;
      user-select: none;
    }

    .piano-roll::after {
      background-image: linear-gradient(to right, transparent, var(--background-color-2));
      content: '';
      display: block;
      height: 100%;
      position: absolute;
      right: 0;
      top: 0;
      width: ${PianoRoll.gridSize}px;
    }

    .piano-roll__ruler {
      border-bottom: 2px solid hsl(0, 0%, 37.5%);
      height: ${PianoRoll.gridSize}px;
      left: ${PianoRoll.keyWidth}px;
      overflow: hidden;
      position: absolute;
      top: 0;
      width: calc(100% - ${PianoRoll.keyWidth}px);
    }

    .piano-roll__keys {
      display: flex;
      flex-direction: column-reverse;
      gap: 1px;
      height: calc(100% - ${PianoRoll.gridSize + 1}px);
      left: 0;
      overflow: hidden;
      position: absolute;
      top: ${PianoRoll.gridSize}px;
      width: ${PianoRoll.keyWidth}px;
      z-index: 1;
    }

    .piano-roll__octave {
      display: flex;
      flex-direction: column-reverse;
      gap: 1px;
      margin-left: ${PianoRoll.keyWidth / 2}px;
    }

    .piano-roll__note {
      align-items: center;
      background-color: var(--main-color);
      color: black;
      display: flex;
      font-size: 0.75em;
      height: ${PianoRoll.gridSize - 1}px;
      padding-left: 0.25em;
      position: relative;
      width: ${PianoRoll.keyWidth / 2}px;
    }

    .piano-roll__letter {
      align-items: center;
      border-bottom: 1px solid var(--background-color-6);
      color: var(--main-color);
      display: flex;
      height: ${PianoRoll.gridSize}px;
      position: absolute;
      right: 100%;
      top: 0;
      width: ${PianoRoll.keyWidth / 2}px;
    }

    .piano-roll__note--sharp {
      background-color: black;
      color: var(--main-color);
    }

    .piano-roll__note--playing {
      background-color: red;
      color: var(--main-color);
    }

    .piano-roll__grid {
      border-color: var(--background-color-6);
      border-style: solid;
      border-width: 0 0 1px 0;
      display: flex;
      flex-direction: column-reverse;
      height: calc(100% - ${PianoRoll.gridSize}px);
      left: ${PianoRoll.keyWidth}px;
      overflow: hidden;
      position: absolute;
      top: ${PianoRoll.gridSize}px;
      width: calc(100% - ${PianoRoll.keyWidth}px);
    }
  `;

  @property({ type: Object })
  inputNotes: MIDINoteInput;

  @property({ type: Object })
  pattern: TrackPattern;

  _rulerRef = createRef<HTMLDivElement>();

  _rulerCanvasRef = createRef<HTMLCanvasElement>();

  _gridRef = createRef<HTMLDivElement>();

  _gridCanvasRef = createRef<HTMLCanvasElement>();

  _pianoKeysRef = createRef<HTMLDivElement>();

  override updated(changedProperties: Map<string, any>): void {
    const prevPattern = changedProperties.get('pattern');
    if (!prevPattern && this.pattern) {
      this._drawRuler();
      this._drawGrid();
    }
  }

  private _handleDblClick = (event: PointerEvent) => {
    const { x, y } = event;
    const gridElement = this._gridRef.value! as HTMLDivElement;
    const { offsetHeight, scrollLeft, scrollTop } = gridElement;
    const { left: rectLeft, top: rectTop } = gridElement.getBoundingClientRect();
    const left = x - rectLeft + scrollLeft;
    const top = rectTop + offsetHeight - y - scrollTop;
    const midiNote = Math.floor(top / PianoRoll.gridSize);
    const timeStep = Math.floor(left / PianoRoll.gridSize);
    // TODO
  }

  private _handleScroll = (event: WheelEvent) => {
    const gridElement = this._gridRef.value! as HTMLDivElement;

    if (event.shiftKey) {
      const rulerElement = this._rulerRef.value! as HTMLDivElement;
      const direction = event.deltaY < 0 ? -1 : 1;
      const { scrollLeft } = gridElement;
      const updatedScrollLeft = scrollLeft + direction * PianoRoll.gridSize;
      gridElement.scrollLeft = updatedScrollLeft;
      rulerElement.scrollLeft = updatedScrollLeft;
    } else {
      const pianoKeysElement = this._pianoKeysRef.value! as HTMLDivElement;
      const direction = event.deltaY < 0 ? -1 : 1;
      const { scrollTop } = gridElement;
      const updatedScrollTop = scrollTop + direction * PianoRoll.gridSize;
      gridElement.scrollTop = updatedScrollTop;
      pianoKeysElement.scrollTop = updatedScrollTop;
    }
  }

  private _drawRuler() {
    const gridSize = PianoRoll.gridSize * window.devicePixelRatio;
    const rulerCanvasElement = this._rulerCanvasRef.value! as HTMLCanvasElement;
    const context = rulerCanvasElement.getContext('2d');

    const { height, width } = rulerCanvasElement;
    rulerCanvasElement.style.height = `${height / window.devicePixelRatio}px`;
    rulerCanvasElement.style.width = `${width / window.devicePixelRatio}px`;

    context.fillStyle = 'white';
    context.strokeStyle = 'hsl(0, 0%, 37.5%)';
    context.font = '18px "Roboto Condensed", sans-serif';
    context.textAlign = 'center';
    context.beginPath();

    for (let x = 0; x < width; x += gridSize) {
      const p = 0.5 + x;
      context.moveTo(p, height - 8);
      context.lineTo(p, height);

      const timeStep = x / gridSize;
      const timeStepText = formatBeats(timeStep / 4);
      if (timeStep > 0 && timeStep % 4 === 0) {
        context.fillText(timeStepText, x, 20);
      }
    }

    context.stroke();
  }

  private _drawGrid() {
    const gridSize = PianoRoll.gridSize * window.devicePixelRatio;
    const gridCanvasElement = this._gridCanvasRef.value! as HTMLCanvasElement;
    const context = gridCanvasElement.getContext('2d');

    const { height, width } = gridCanvasElement;
    gridCanvasElement.style.height = `${height / window.devicePixelRatio}px`;
    gridCanvasElement.style.width = `${width / window.devicePixelRatio}px`;

    context.strokeStyle = 'hsla(0, 0%, 100%, 0.0625)';
    context.fillStyle = 'hsla(0, 0%, 100%, 0.09375)';

    for (let x = gridSize; x < width; x += gridSize) {
      context.beginPath();
      if (x % (gridSize * 16) === 0) {
        context.rect(0.5 + (x - 1.5), 0, 3, height);
        context.fill();
      } else if (x % (gridSize * 4) === 0) {
        this._drawLine(context, x + 1, width, height, 'vertical');
        context.stroke();
      } else {
        this._drawLine(context, x, width, height, 'vertical');
        context.stroke();
      }
    }

    context.beginPath();

    for (let y = gridSize; y < height; y += gridSize) {
      const noteStep = y / gridSize;
      if ([1, 3, 6, 8, 10].includes(noteStep % 12)) {
        context.rect(0, y, width, gridSize);
      }
    }

    context.fill();
  }

  private _drawLine(
    context: CanvasRenderingContext2D,
    position: number,
    width: number,
    height: number,
    direction: string,
  ) {
    const p = 0.5 + position;
    switch (direction) {
      case 'horizontal':
        context.moveTo(0, p);
        context.lineTo(width, p);
        break;
      case 'vertical':
        context.moveTo(p, 0);
        context.lineTo(p, height);
        break;
    }
  }

  private _renderPattern() {
    const mergedInputNotes = this.mergedInputNotes;
    return html`
      ${this._renderPatternRuler()}
      ${this._renderPianoKeys(mergedInputNotes)}
      ${this._renderPatternGrid(mergedInputNotes)}
    `;
  }

  private _renderPatternRuler() {
    return html`
      <div
        ${ref(this._rulerRef)}
        class="piano-roll__ruler"
      >
        <canvas
          ${ref(this._rulerCanvasRef)}
          class="piano-roll__ruler-canvas"
          height=${PianoRoll.gridSize * window.devicePixelRatio}
          width=${PianoRoll.gridSize * 4 ** 3 * window.devicePixelRatio}
        ></canvas>
      </div>
    `;
  }

  private _renderPianoKeys(activeInputNotes: MIDINotes) {
    return html`
      <div
        ${ref(this._pianoKeysRef)}
        class="piano-roll__keys"
      >
        ${octaveMap.map((octave: number) => {
          return html`
            <div class="piano-roll__octave">
              ${noteMap.map((note: string, index: number) => {
                const midiNote = octave * 12 + index;
                const playedNote = activeInputNotes[midiNote];
                const isNotePlaying = typeof playedNote !== 'undefined';
                const [letter, symbol] = note.split('');
                const isC = index % 12 === 0;
                const noteClasses = {
                  'piano-roll__note': true,
                  'piano-roll__note--sharp': note.includes('#'),
                  'piano-roll__note--playing': isNotePlaying,
                };

                if (isC) {
                  return html`
                    <div class=${classMap(noteClasses)}>
                      <div class="piano-roll__letter">
                        ${letter}${octave}
                      </div>
                    </div>
                  `;
                }

                return html`
                  <div class=${classMap(noteClasses)}></div>
                `;
              })}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderPatternGrid(activeInputNotes: MIDINotes) {
    return html`
      <div
        ${ref(this._gridRef)}
        class="piano-roll__grid"
        @dblclick=${this._handleDblClick}
        @wheel=${this._handleScroll}
      >
        <canvas
          ${ref(this._gridCanvasRef)}
          class="piano-roll__grid-canvas"
          height=${PianoRoll.gridSize * 12 * 9 * window.devicePixelRatio}
          width=${PianoRoll.gridSize * 4 ** 3 * window.devicePixelRatio}
        ></canvas>
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

  get mergedInputNotes() {
    const inputNotes = Object.values(this.inputNotes);
    const mergedInputNotes = inputNotes.reduce((
      mergedNotes: MIDINotes,
      notes: MIDINotes,
    ) => {
      return { ...mergedNotes, ...notes };
    }, {});
    return mergedInputNotes;
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

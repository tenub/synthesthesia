import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import * as Tone from 'tone';

import { octaveMap, noteMap, midiNumberToFrequency, formatBeats } from '../../../helpers';
import { MIDINoteInput, MIDINotes } from '../../../web-daw/web-daw.d';

import { Track, TrackPattern, TrackPatternNote } from '../track-lane/track-lane.d';

@customElement('piano-roll')
export class PianoRoll extends LitElement {
  static numOctaves = 9;

  static gridSize = 24;

  static keyWidth = 64;

  static noteMapLength = noteMap.length;

  static reversedOctaveMap = [...octaveMap].reverse();
  
  static reversedNoteMap = [...noteMap].reverse();

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

    .piano-roll__ruler {
      border-bottom: 2px solid hsl(0, 0%, 37.5%);
      height: ${PianoRoll.gridSize + 2}px;
      left: ${PianoRoll.keyWidth}px;
      overflow: hidden;
      position: absolute;
      top: -2px;
      width: calc(100% - ${PianoRoll.keyWidth}px);
    }

    .piano-roll__grid {
      border-color: var(--background-color-6);
      border-style: solid;
      border-width: 0 0 1px 0;
      height: calc(100% - ${PianoRoll.gridSize}px);
      left: ${PianoRoll.keyWidth}px;
      overflow: hidden;
      position: absolute;
      top: ${PianoRoll.gridSize}px;
      width: calc(100% - ${PianoRoll.keyWidth}px);
    }

    .piano-roll__ruler-canvas,
    .piano-roll__grid-canvas {
      min-height: 100%;
      min-width: 100%;
    }

    .piano-roll__grid-canvas {
      top: 0;
      left: 0;
      position: absolute;
    }

    .piano-roll__keys {
      height: calc(100% - ${PianoRoll.gridSize + 1}px);
      left: 0;
      overflow: hidden;
      position: absolute;
      top: ${PianoRoll.gridSize}px;
      width: ${PianoRoll.keyWidth}px;
      z-index: 1;
    }

    .piano-roll__keys-container {
      top: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
      left: 0;
      position: absolute;
    }

    .piano-roll__octave {
      display: flex;
      flex-direction: column;
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

    .pattern__notes {
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
      z-index: 1;
    }

    .pattern__note {
      align-items: center;
      background-color: red;
      color: var(--main-color);
      display: flex;
      font-size: 12px;
      height: ${PianoRoll.gridSize}px;
      padding: 0 0.25em;
      position: absolute;
      user-select: none;
    }

    .pattern__note--isResizing {
      cursor: col-resize;
    }
  `;

  @property({ type: Object })
  inputNotes: MIDINoteInput;

  @property({ type: Object })
  track: Track;

  @property({ type: Object })
  pattern: TrackPattern;

  @state()
  _isMovingNote = false;

  @state()
  _isHoveringNoteResize = false;

  @state()
  _workingNoteIndex = -1;

  @state()
  _pointerOffset = {
    left: 0,
    top: 0,
  };

  _rulerRef = createRef<HTMLDivElement>();

  _rulerCanvasRef = createRef<HTMLCanvasElement>();

  _gridRef = createRef<HTMLDivElement>();

  _gridCanvasRef = createRef<HTMLCanvasElement>();

  _notesRef = createRef<HTMLDivElement>();

  _pianoKeysRef = createRef<HTMLDivElement>();

  constructor() {
    super();

    this.addEventListener('pointerdown', this._handleGridPointerDown);
    this.addEventListener('pointermove', this._handleGridPointerMove);
    this.addEventListener('pointerup', this._handleGridPointerUp);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('resize', this._drawRuler);
    window.addEventListener('resize', this._drawGrid);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._drawRuler);
    window.removeEventListener('resize', this._drawGrid);
  }

  override updated(changedProperties: Map<string, any>): void {
    const hasPrevPattern = changedProperties.has('pattern')
    const prevPattern = changedProperties.get('pattern');
    if (hasPrevPattern && prevPattern === null &&  this.pattern !== null) {
      this._drawRuler();
      this._drawGrid();
    }
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

  private _handleDblClick = (event: PointerEvent) => {
    const gridCoords = this._getGridCoords(event.x, event.y);
    const noteIndex = Math.floor(gridCoords.y / PianoRoll.gridSize);
    const timeStep = Math.floor(gridCoords.x / PianoRoll.gridSize);

    const { notes: updatedNotes } = { ...this.pattern };
    const foundNoteIndex = this._getHoveredNote(gridCoords.x, gridCoords.y);
    if (foundNoteIndex > -1) {
      const { toneEventId } = updatedNotes[foundNoteIndex];
      Tone.Transport.clear(toneEventId);
      updatedNotes.splice(foundNoteIndex, 1);
    } else {
      const { bpm } = Tone.Transport.get();
      const offsetTime = timeStep * 60 / (16 * bpm);
      const toneEventId = Tone.Transport.scheduleRepeat((time: number) => {
        const { instrument } = this.track;
        const frequency = midiNumberToFrequency(noteIndex);
        instrument.toneInstrument.triggerAttackRelease(frequency, '4n');
      }, '1:0:0', offsetTime);

      updatedNotes.push({
        noteIndex,
        startTime: timeStep,
        noteLength: 16,
        toneEventId,
      });
    }

    this.dispatchEvent(new CustomEvent('patternupdated', {
      bubbles: true,
      composed: true,
      detail: {
        id: this.pattern.id,
        attributes: {
          notes: updatedNotes,
        },
      },
    }));
  }

  private _handleGridPointerDown = (event: PointerEvent) => {
    if (!this.pattern) {
      return;
    }

    const gridCoords = this._getGridCoords(event.x, event.y);
    const foundNoteIndex = this._getHoveredNote(gridCoords.x, gridCoords.y);
    this._workingNoteIndex = foundNoteIndex;
    if (foundNoteIndex < 0) {
      return;
    }

    const foundNote = this.pattern.notes[foundNoteIndex];
    const startTimeX = foundNote.startTime * PianoRoll.gridSize;
    const endTimeX = (foundNote.startTime + foundNote.noteLength) * PianoRoll.gridSize;
    const startNoteY = foundNote.noteIndex * PianoRoll.gridSize;
    this._isMovingNote = gridCoords.x - startTimeX > 8 && endTimeX - gridCoords.x > 8;
    const pointerOffsetX = gridCoords.x - startTimeX;
    const pointerOffsetY = gridCoords.y - startNoteY;
    this._pointerOffset = { left: pointerOffsetX, top: pointerOffsetY };
  }

  private _handleGridPointerMove(event: PointerEvent) {
    if (!this.pattern) {
      return;
    }

    const { x, y } = event;
    this._handleHoverNoteState(x, y);

    if (this._workingNoteIndex < 0) {
      return;
    }

    this._handleNoteUpdate(x, y);
  }

  private _handleHoverNoteState(x: number, y: number) {
    const gridCoords = this._getGridCoords(x, y);
    const foundNoteIndex = this._getHoveredNote(gridCoords.x, gridCoords.y);
    if (foundNoteIndex < 0) {
      return;
    }

    const foundNote = this.pattern.notes[foundNoteIndex];
    const startTimeX = foundNote.startTime * PianoRoll.gridSize;
    const endTimeX = (foundNote.startTime + foundNote.noteLength) * PianoRoll.gridSize;
    this._isHoveringNoteResize = gridCoords.x - startTimeX <= 8 || endTimeX - gridCoords.x <= 8;
  }

  private _handleNoteUpdate(x: number, y: number) {
    const gridCoords = this._getGridCoords(x, y);
    const notes = [...this.pattern.notes];
    const workingNote = notes[this._workingNoteIndex];
    const noteStartX = workingNote.startTime * PianoRoll.gridSize;
    const noteEndX = (workingNote.startTime + workingNote.noteLength) * PianoRoll.gridSize;

    const { notes: updatedNotes } = { ...this.pattern };
    const isUpdatingStartTime = gridCoords.x < (noteStartX + noteEndX) / 2;
    if (this._isMovingNote) {
      const { left: pointerOffsetLeft, top: pointerOffsetTop } = this._pointerOffset;
      const updatedStartTime = Math.round((gridCoords.x - pointerOffsetLeft) / PianoRoll.gridSize);
      const updatedNoteIndex = Math.round((gridCoords.y - pointerOffsetTop) / PianoRoll.gridSize);
      updatedNotes[this._workingNoteIndex] = {
        ...workingNote,
        noteIndex: updatedNoteIndex,
        startTime: updatedStartTime,
      };
    } else if (isUpdatingStartTime) {
      const updatedStartTime = Math.round(gridCoords.x / PianoRoll.gridSize);
      const updatedNoteLength = workingNote.noteLength + (workingNote.startTime - updatedStartTime);
      if (updatedNoteLength <= 0) {
        return;
      }

      updatedNotes[this._workingNoteIndex] = {
        ...workingNote,
        startTime: updatedStartTime,
        noteLength: updatedNoteLength,
      };
    } else {
      const updatedNoteLength = Math.round(gridCoords.x / PianoRoll.gridSize) - workingNote.startTime;
      updatedNotes[this._workingNoteIndex] = {
        ...workingNote,
        noteLength: updatedNoteLength,
      };
    }

    const {
      noteIndex,
      startTime,
      noteLength,
      toneEventId: prevToneEventId,
    } = updatedNotes[this._workingNoteIndex];
    Tone.Transport.clear(prevToneEventId);

    const { bpm } = Tone.Transport.get();
    const offsetTime = startTime * 60 / (16 * bpm);
    const toneEventId = Tone.Transport.scheduleRepeat((time: number) => {
      const { instrument } = this.track;
      const frequency = midiNumberToFrequency(noteIndex);
      const numBars = Math.floor(noteLength / 64);
      const numQuarterNotes = Math.floor(noteLength % 64 / 16);
      const numSixteenthNotes = noteLength % 16 / 4;
      const tr = `${numBars}:${numQuarterNotes}:${numSixteenthNotes}`;
      instrument.toneInstrument.triggerAttackRelease(frequency, tr);
    }, '1:0:0', offsetTime);
    updatedNotes[this._workingNoteIndex].toneEventId = toneEventId;

    this.dispatchEvent(new CustomEvent('patternupdated', {
      bubbles: true,
      composed: true,
      detail: {
        id: this.pattern.id,
        attributes: {
          notes: updatedNotes,
        },
      },
    }));
  }

  private _handleGridPointerUp = () => {
    if (!this.pattern) {
      return;
    }

    this._workingNoteIndex = -1;
    this._isMovingNote = false;
    this._pointerOffset = { left: 0, top: 0 };
  }

  private _getHoveredNote(x: number, y: number) {
    const noteIndex = Math.floor(y / PianoRoll.gridSize);
    const foundNoteIndex = this.pattern.notes.findIndex((note: TrackPatternNote) =>
      note.noteIndex === noteIndex
        && x >= note.startTime * PianoRoll.gridSize
        && x <= (note.startTime + note.noteLength) * PianoRoll.gridSize);
    return foundNoteIndex;
  }

  private _getGridCoords(x: number, y: number) {
    const gridElement = this._gridRef.value! as HTMLDivElement;
    const {
      scrollLeft: gridElementScrollLeft,
      scrollTop: gridElementScrollTop,
    } = gridElement;
    const {
      left: gridElementLeft,
      top: gridElementTop,
    } = gridElement.getBoundingClientRect();

    const gridCanvasElement = this._gridCanvasRef.value! as HTMLCanvasElement;
    const { offsetHeight: gridCanvasElementHeight } = gridCanvasElement;

    const gridX = x - gridElementLeft + gridElementScrollLeft;
    const gridY =  gridCanvasElementHeight + gridElementTop - y - gridElementScrollTop;
    return { x: gridX, y: gridY };
  }

  private _handleScroll = (event: WheelEvent) => {
    const gridElement = this._gridRef.value! as HTMLDivElement;

    if (event.shiftKey || Math.abs(event.deltaX) > 0) {
      const rulerElement = this._rulerRef.value! as HTMLDivElement;
      const { scrollLeft } = gridElement;

      let direction;
      if (event.deltaY < 0 || event.deltaX < 0) {
        direction = -1;
      } else if (event.deltaY >= 0 || event.deltaX >= 0) {
        direction = 1;
      }

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

  private _drawRuler = (): void => {
    // reset any previous attributes
    const rulerCanvasElement = this._rulerCanvasRef.value! as HTMLCanvasElement;
    rulerCanvasElement.removeAttribute('height');
    rulerCanvasElement.removeAttribute('width');
    rulerCanvasElement.style.height = 'auto';
    rulerCanvasElement.style.width = 'auto';

    // size the ruler according to current container dimensions
    const rulerCanvasRect = rulerCanvasElement.getBoundingClientRect();
    const width = rulerCanvasRect.width * window.devicePixelRatio;
    const gridSize = PianoRoll.gridSize * window.devicePixelRatio;
    const minWidth = 64 * gridSize;
    const actualWidth = minWidth < width ? width : minWidth;
    rulerCanvasElement.height = gridSize;
    rulerCanvasElement.width = actualWidth;

    rulerCanvasElement.style.height = `${gridSize / window.devicePixelRatio}px`;
    rulerCanvasElement.style.width = `${actualWidth / window.devicePixelRatio}px`;

    // empty any previous content
    const context = rulerCanvasElement.getContext('2d');
    context.clearRect(0, 0, rulerCanvasElement.width, rulerCanvasElement.height);

    context.fillStyle = 'white';
    context.strokeStyle = 'hsl(0, 0%, 37.5%)';
    context.font = '18px "Roboto Condensed", sans-serif';
    context.textAlign = 'center';
    context.beginPath();

    for (let x = 0; x < actualWidth; x += gridSize) {
      const p = 0.5 + x;
      context.moveTo(p, gridSize - 8);
      context.lineTo(p, gridSize);

      const timeStep = x / gridSize;
      const timeStepText = formatBeats(timeStep / 4);
      if (timeStep > 0 && timeStep % 4 === 0) {
        context.fillText(timeStepText, x, 20);
      }
    }

    context.stroke();
  }

  private _drawGrid = (): void => {
    // reset any previous attributes
    const gridCanvasElement = this._gridCanvasRef.value! as HTMLCanvasElement;
    gridCanvasElement.removeAttribute('height');
    gridCanvasElement.removeAttribute('width');
    gridCanvasElement.style.height = 'auto';
    gridCanvasElement.style.width = 'auto';

    // size the grid according to current container dimensions
    const gridCanvasRect = gridCanvasElement.getBoundingClientRect();
    const height = gridCanvasRect.height * window.devicePixelRatio;
    const width = gridCanvasRect.width * window.devicePixelRatio;
    const gridSize = PianoRoll.gridSize * window.devicePixelRatio;
    const minWidth = 64 * gridSize;
    const numNotes = PianoRoll.numOctaves * 12;
    const minHeight = numNotes * gridSize;
    const actualWidth = minWidth < width ? width : minWidth;
    const actualHeight = minHeight < height ? height : minHeight;
    gridCanvasElement.height = actualHeight;
    gridCanvasElement.width = actualWidth;

    const styleHeight = actualHeight / window.devicePixelRatio;
    const styleWidth = actualWidth / window.devicePixelRatio;
    gridCanvasElement.style.height = `${styleHeight}px`;
    gridCanvasElement.style.width = `${styleWidth}px`;

    // size the notes container to the same dimensions
    const notesElement = this._notesRef.value! as HTMLDivElement;
    notesElement.style.height = `${styleHeight}px`;
    notesElement.style.width = `${styleWidth}px`;

    // empty any previous content
    const context = gridCanvasElement.getContext('2d');
    context.clearRect(0, 0, gridCanvasElement.width, gridCanvasElement.height);

    // draw note rectangles
    context.fillStyle = 'hsl(0, 0%, 18.75%)';
    context.beginPath();

    
    for (let y = 0; y < numNotes; y += 1) {
      if ([0, 2, 4, 6, 7, 9, 11].includes(y % 12)) {
        context.rect(0, y * gridSize, actualWidth, gridSize);
      }
    }

    context.fill();

    // draw time lines
    context.strokeStyle = 'hsl(0, 0%, 12.5%)';

    for (let x = 0; x < actualWidth; x += gridSize) {
      context.beginPath();

      const timeStep = x / gridSize;
      if (timeStep % 16 === 0) {
        context.fillStyle = 'hsl(0, 0%, 12.5%)';
        context.rect(0.5 + (x - 1.5), 0, 3, actualHeight);
        context.fill();
        continue;
      }

      if (timeStep % 4 === 0) {
        const p = 0.5 + x;
        context.moveTo(p, 0);
        context.lineTo(p, actualHeight);
        context.stroke();
      }
    }

    const gridElement = this._gridRef.value! as HTMLDivElement;
    const pianoKeysElement = this._pianoKeysRef.value! as HTMLDivElement;
    const { height: gridCanvasElementHeight } = gridCanvasElement.getBoundingClientRect();
    const { height: gridElementHeight } = gridElement.getBoundingClientRect();
    const maxScrollTop = gridCanvasElementHeight - gridElementHeight;
    gridElement.scrollTop = maxScrollTop;
    pianoKeysElement.scrollTop = maxScrollTop;
  }

  private _renderPattern() {
    const mergedInputNotes = this.mergedInputNotes;
    return html`
      ${this._renderPatternRuler()}
      ${this._renderPianoKeys(mergedInputNotes)}
      ${this._renderPatternGrid()}
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
        <div class="piano-roll__keys-container">
          ${PianoRoll.reversedOctaveMap.map((octave: number) => {
            return html`
              <div class="piano-roll__octave">
                ${PianoRoll.reversedNoteMap.map((note: string, index: number) => {
                  const actualIndex = PianoRoll.noteMapLength - index;
                  const noteIndex = octave * PianoRoll.noteMapLength + actualIndex;
                  const playedNote = activeInputNotes[noteIndex];
                  const isNotePlaying = typeof playedNote !== 'undefined';
                  const [letter] = note.split('');
                  const isC = actualIndex % PianoRoll.noteMapLength === 1;
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
      </div>
    `;
  }

  private _renderPatternGrid() {
    const width = PianoRoll.gridSize * 4 ** 3;
    const canvasWidth = width * window.devicePixelRatio;

    const height = PianoRoll.gridSize * noteMap.length * octaveMap.length;
    const canvasHeight = height * window.devicePixelRatio;

    return html`
      <div
        ${ref(this._gridRef)}
        class="piano-roll__grid"
        @dblclick=${this._handleDblClick}
        @wheel=${this._handleScroll}
      >
        <div
          ${ref(this._notesRef)}
          class="pattern__notes"
        >
          ${this.pattern.notes.map((note: TrackPatternNote) => {
            const noteOctave = Math.floor(note.noteIndex / 12);
            const noteName = noteMap[note.noteIndex % 12];
            const [noteLetter, noteSymbol] = noteName.split('');
            const noteClasses = {
              'pattern__note': true,
              'pattern__note--isResizing': this._isHoveringNoteResize,
            }
            const noteStyles = {
              bottom: `${note.noteIndex * PianoRoll.gridSize}px`,
              left: `${note.startTime * PianoRoll.gridSize}px`,
              width: `${note.noteLength * PianoRoll.gridSize}px`,
            };
            return html`
              <div
                class=${classMap(noteClasses)}
                style=${styleMap(noteStyles)}
              >
                ${noteLetter}${noteSymbol}${noteOctave}
              </div>
            `;
          })}
        </div>

        <canvas
          ${ref(this._gridCanvasRef)}
          class="piano-roll__grid-canvas"
          height=${canvasHeight}
          width=${canvasWidth}
        ></canvas>
      </div>
    `;
  }

  private _renderNullState() {
    return html`
      <span>No pattern selected</span>
    `;
  }

  override render() {
    const isPatternDefined = this.pattern !== null;
    const classes = {
      'piano-roll': true,
      'piano-roll--isEmpty': !isPatternDefined,
    };
    return html`
      <div class=${classMap(classes)}>
        ${isPatternDefined ? this._renderPattern() : this._renderNullState()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'piano-roll': PianoRoll;
  }
}

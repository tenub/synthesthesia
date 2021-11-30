import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import {
  MIDIAccess,
  MIDIPort,
  MIDIInput,
  MIDIOutput,
  MIDIConnectionEvent,
  MIDIMessageEvent,
} from './keyboard-controller.interface';

@customElement('keyboard-controller')
export class KeyboardController extends LitElement {
  static ROOT_FREQUENCY = 440;

  static midiNumberToFrequency(m: number): number {
    const frequency = Math.pow(2, (m - 69) / 12) * KeyboardController.ROOT_FREQUENCY;
    return Math.round((frequency + Number.EPSILON) * 100) / 100;
  }

  static getStepFromRoot(index: number): number {
    return index % 12;
  }

  static isHalfStep(step: number): boolean {
    return [1, 3, 6, 8, 10].includes(step);
  }

  static isHalfStepStart(step: number): boolean {
    return [1, 6].includes(step);
  }

  static isHalfStepEnd(step: number): boolean {
    return [3, 10].includes(step);
  }

  static isHalfStepMid(step: number): boolean {
    return KeyboardController.isHalfStep(step)
      && !KeyboardController.isHalfStepStart(step)
      && !KeyboardController.isHalfStepEnd(step);
  }

  static hasNoPreviousHalfStep(step: number): boolean {
    return [0, 5].includes(step);
  }

  static isWholeStep(step: number): boolean {
    return !KeyboardController.isHalfStep(step);
  }

  static findMidiPortById(ports: Object, id: string) {
    let foundMidiPortId = null;
    for (const [midiInputKey, midiInputValue] of Object.entries(ports)) {
      if (midiInputValue.id === id) {
        foundMidiPortId = midiInputKey;
        break;
      }
    }

    return foundMidiPortId;
  }

  /**
   * Define our styles
   */
  static override styles = css`
    :host {
      box-sizing: border-box;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    .keyboard {
      background: black;
      display: inline-flex;
      justify-content: flex-end;
      padding: 12em 1em 1em 12em;
      position: relative;
    }

    .keyboard__modules {
      background: black;
      border: 1px solid black;
      color: white;
      height: 12em;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
      z-index: 1;
    }

    .keyboard__key {
      border: 1px solid black;
    }

    .keyboard__key--wholestep {
      background-color: white;
      box-shadow: inset 0 -0.5em 0.25em 0.5em hsla(0, 0%, 0%, 0.125),
                  0 0 0.5em black;
      height: 13.8em;
      width: 2.4em;
    }

    .keyboard__key--halfstep {
      background-color: black;
      box-shadow: inset 0 -0.5em 0.25em 0.3333em hsla(0, 0%, 100%, 0.25),
                  0 0.125em 0.25em black;
      height: 9em;
      position: relative;
      width: 1.5em;
      z-index: 1;
    }

    .keyboard__key--isActive {
      transform: perspective(13.8em) rotateX(-3deg);
    }

    .keyboard__key--halfstep-start {
      margin-left: -1em;
    }

    .keyboard__key--halfstep-start + .keyboard__key--wholestep {
      margin-left: calc(-0.5em - 1px);
    }

    .keyboard__key--halfstep-mid {
      margin-left: -0.75em;
    }

    .keyboard__key--halfstep-mid + .keyboard__key--wholestep {
      margin-left: calc(-0.75em - 1px);
    }

    .keyboard__key--halfstep-end {
      margin-left: calc(-0.5em - 1px);
    }

    .keyboard__key--halfstep-end + .keyboard__key--wholestep {
      margin-left: calc(-1em - 1px);
    }

    .keyboard__key--no-previous-halfstep {
      margin-left: -1px;
    }
  `;

  @property({ type: Number })
  size = 49;

  // key states
  @state()
  private _activeKey: HTMLDivElement | null = null;

  // midi states
  @state()
  private _midiInputs: { [key: string]: MIDIInput } = {};

  @state()
  private _midiOutputs: { [key: string]: MIDIOutput } = {};

  @state()
  private _currentMidiInput: MIDIInput | null = null;

  @state()
  private _currentMidiOutput: MIDIOutput | null = null;

  @state()
  private _isFixedVelocity = false;

  constructor() {
    super();

    this._initMIDIAccess();
  }

  /**
   * Store MIDI controller information
   */
  private async _initMIDIAccess() {
    if (typeof window.navigator.requestMIDIAccess !== 'function') {
      return;
    }

    const access = await window.navigator.requestMIDIAccess();
    access.onstatechange = this._handleMidiStateChange;

    const midiInputs = [...access.inputs.entries()];
    this._midiInputs = midiInputs.reduce((obj, [midiInputKey, midiInputValue]) => {
      if (!this._currentMidiInput) {
        this._currentMidiInput = midiInputValue;
        this._currentMidiInput.onmidimessage = this._handleMidiInputMessage;
      }

      return {
        ...obj,
        [midiInputKey]: midiInputValue,
      };
    }, {});

    const midiOutputs = [...access.outputs.entries()];
    this._midiOutputs = midiOutputs.reduce((obj, [midiOutputKey, midiOutputValue]) => {
      if (!this._currentMidiOutput) {
        this._currentMidiOutput = midiOutputValue;
      }

      return {
        ...obj,
        [midiOutputKey]: midiOutputValue,
      };
    }, {});
  }

  private _dispatchPlayTone(frequency: number, velocity: number) {
    this.dispatchEvent(new CustomEvent('tonestarted', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        frequency,
        velocity,
      },
    }));
  }

  private _dispatchStopTone(frequency: number, velocity: number) {
    this.dispatchEvent(new CustomEvent('toneended', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        frequency,
        velocity,
      },
    }));
  }

  private _handleMidiStateChange = (event: MIDIConnectionEvent) => {
    const changedMidiPort = event.port as MIDIPort;
    switch (changedMidiPort.state) {
      case 'connected':
        switch (changedMidiPort.type) {
          case 'input': {
            const newMidiInputKey = changedMidiPort.id;
            this._midiInputs = {
              ...this._midiInputs,
              [newMidiInputKey]: changedMidiPort,
            };

            break;
          }

          case 'output':
          default:
            break;
        }

        break;
      case 'disconnected':
        switch (changedMidiPort.type) {
          case 'input': {
            const foundMidiInputKey = KeyboardController.findMidiPortById(
              this._midiInputs,
              changedMidiPort.id,
            );
            if (foundMidiInputKey) {
              const newMidiInputs = { ...this._midiInputs };
              delete newMidiInputs[foundMidiInputKey];
              this._midiInputs = newMidiInputs;
            }

            break;
          }

          case 'output':
          default:
            break;
        }

        break;
    }
  }

  private _handleMidiInputMessage = (event: MIDIMessageEvent) => {
    const [status, ...otherData] = event.data;
    switch (status) {
      case 144:
      case 128: {
        const [noteIndex, velocityIndex] = otherData;
        const frequency = KeyboardController.midiNumberToFrequency(noteIndex);
        const velocity = this._isFixedVelocity ? 1.0 : velocityIndex / 127;
        if (status === 144) {
          this._dispatchPlayTone(frequency, velocity);
        } else {
          this._dispatchStopTone(frequency, velocity);
        }
      }
    }
  }

  private _handleSelectMidiInput = (event: Event) => {
    const { value: selectedMidiId } = event.target as HTMLOptionElement;
    const midiInputs = Object.values(this._midiInputs);
    const selectedMidiInput = midiInputs.find(midiInput => midiInput.id === selectedMidiId);
    if (!selectedMidiInput) {
      return;
    }

    // remove current listener
    const currentMidiInput = this._currentMidiInput as MIDIInput;
    currentMidiInput.onmidimessage = undefined;

    // set new midi input and add an event listener
    this._currentMidiInput = selectedMidiInput;
    this._currentMidiInput.onmidimessage = this._handleMidiInputMessage;
  }

  private _handleChangeFixedVelocity = (event: Event) => {
    const { checked: isFixedVelocity } = event.target as HTMLInputElement;
    this._isFixedVelocity = isFixedVelocity;
  }

  private _handlePressKey = (event: PointerEvent) => {
    event.preventDefault();

    const targetElement = event.target as HTMLDivElement;
    targetElement.classList.add('keyboard__key--isActive');

    this._activeKey = targetElement;
  }

  private _handleMoveKey = (event: PointerEvent) => {
    event.preventDefault();

    if (!this._activeKey || event.target === this._activeKey) {
      return;
    }

    if (this._activeKey) {
      this._activeKey.classList.remove('keyboard__key--isActive');
    }

    const targetElement = event.target as HTMLDivElement;
    targetElement.classList.add('keyboard__key--isActive');

    this._activeKey = targetElement;
  }

  private _handleReleaseKey = (event: PointerEvent) => {
    event.preventDefault();

    if (!this._activeKey) {
      return;
    }

    const activeElement = this._activeKey as HTMLDivElement;
    activeElement.classList.remove('keyboard__key--isActive');

    this._activeKey = null;
  }

  private _renderKey = (index: number) => {
    const step = KeyboardController.getStepFromRoot(index);
    const keyClasses = {
      'keyboard__key': true,
      'keyboard__key--wholestep': KeyboardController.isWholeStep(step),
      'keyboard__key--halfstep': KeyboardController.isHalfStep(step),
      'keyboard__key--halfstep-start': KeyboardController.isHalfStepStart(step),
      'keyboard__key--halfstep-end': KeyboardController.isHalfStepEnd(step),
      'keyboard__key--halfstep-mid': KeyboardController.isHalfStepMid(step),
      'keyboard__key--no-previous-halfstep': KeyboardController.hasNoPreviousHalfStep(step),
    };
    return html`
      <div
        class=${classMap(keyClasses)}
        @pointerdown=${this._handlePressKey}
        @pointermove=${this._handleMoveKey}
        @pointerup=${this._handleReleaseKey}
      ></div>
    `;
  }

  private _renderOption = (name: string, value: string, selected = false) => {
    return html`
      <option
        name=${name}
        selected=${selected}
        value=${value}
      >
        ${name}
      </option>
    `;
  }

  private _renderMidiOption = (port: MIDIPort) => {
    const { id: _currentMidiInputId } = this._currentMidiInput || {};
    const isSelected = _currentMidiInputId === port.id;
    return this._renderOption(port.name, port.id, isSelected);
  }

  override render() {
    const keyIndicies = [...new Array(this.size).keys()];
    const midiInputs = Object.values(this._midiInputs);
    return html`
      <div class="keyboard">
        <div class="keyboard__modules">
          <select
            class="keyboard__select"
            @change=${this._handleSelectMidiInput}
          >
            ${midiInputs.map(this._renderMidiOption)}
          </select>

          <label>
            <input
              class="keyboard__toggle"
              type="checkbox"
              value=${this._isFixedVelocity}
              @change=${this._handleChangeFixedVelocity}
            > Fixed velocity
          </label>
        </div>
        ${keyIndicies.map(this._renderKey)}
      </div>
    `;
  }
}

declare global {
  interface Navigator {
    requestMIDIAccess(): MIDIAccess;
  }

  interface HTMLElementTagNameMap {
    'keyboard-controller': KeyboardController;
  }
}

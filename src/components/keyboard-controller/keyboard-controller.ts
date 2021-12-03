import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

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

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
    }
  `;

  // midi states
  @state()
  private _midiInputs: { [key: string]: MIDIInput } = {};

  @state()
  private _midiOutputs: { [key: string]: MIDIOutput } = {};

  @state()
  private _currentMidiInput: MIDIInput | null = null;

  @state()
  private _currentMidiOutput: MIDIOutput | null = null;

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
        const velocity = velocityIndex / 127;
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

  private _renderOption = (name: string, value: string, selected = false) => {
    return html`
      <option
        name=${name}
        value=${value}
        .selected=${selected}
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
    const midiInputs = Object.values(this._midiInputs);
    return html`
      <select
        class="midi__select"
        @change=${this._handleSelectMidiInput}
      >
        ${midiInputs.map(this._renderMidiOption)}
      </select>
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

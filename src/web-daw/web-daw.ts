import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '../components/global-controls';
import '../components/sound-library';
import '../components/track-lanes';

import {
  MIDIAccess,
  MIDIInput,
  MIDIOutput,
  MIDIPort,
  MIDIConnectionEvent,
  MIDIMessageEvent,
  MIDINoteInput,
} from './web-daw.interface';

@customElement('web-daw')
export class WebDAW extends LitElement {
  static MIDI_NOTE_ON = 144;

  static MIDI_NOTE_OFF = 128;

  static findMidiPortById(ports: MIDIPort[], id: string): number {
    return ports.findIndex(port => port.id === id);
  }

  static override styles = css`
    :host {
      --box-sizing: border-box;
      --hsl-increment: 6.25%;
      --background-color-1: hsl(0, 0%, var(--hsl-increment));
      --background-color-2: hsl(0, 0%, calc(2 * var(--hsl-increment)));
      --background-color-3: hsl(0, 0%, calc(3 * var(--hsl-increment)));
      --background-color-4: hsl(0, 0%, calc(4 * var(--hsl-increment)));
      --background-color-5: hsl(0, 0%, calc(5 * var(--hsl-increment)));
      --main-color: white;
      --main-font-family: 'Roboto Condensed', sans-serif;
      --main-font-size: 16px;

      background-color: var(--background-color-2);
      box-sizing: var(--box-sizing);
      color: var(--main-color);
      display: grid;
      font-family: var(--main-font-family);
      grid-template-columns: [left-col] 320px [main-col] auto;
      grid-template-rows: [top-row] 64px [main-row] auto;
      height: 100vh;
      width: 100%;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }
  `;

  constructor() {
    super();

    this._initMIDIAccess();
  }

  @state()
  midiInputs: MIDIInput[] = []

  @state()
  midiOutputs: MIDIOutput[] = []

  @state()
  midiNotes: MIDINoteInput = {}

  private async _initMIDIAccess() {
    if (typeof window.navigator.requestMIDIAccess !== 'function') {
      return;
    }

    const access = await window.navigator.requestMIDIAccess();
    access.onstatechange = this._handleMidiStateChange;

    const midiInputEntries = [...access.inputs.values()];
    this.midiInputs = midiInputEntries.map((midiInput: MIDIInput) => {
      midiInput.onmidimessage = this._handleMidiInputMessage;
      this.midiNotes[midiInput.id] = {};
      return midiInput;
    });

    const midiOutputEntries = [...access.outputs.values()];
    this.midiOutputs = midiOutputEntries.map((midiOutput: MIDIOutput) => {
      return midiOutput;
    });
  }

  private _handleMidiStateChange = (event: MIDIConnectionEvent) => {
    const changedMidiPort = event.port as MIDIInput | MIDIOutput;

    let midiPorts;
    switch (changedMidiPort.type) {
      case 'input':
        midiPorts = this.midiInputs;
        break;

      case 'output':
        midiPorts = this.midiOutputs;
        break;
    }

    const newMidiPorts = midiPorts.slice();
    const foundMidiPortIndex = WebDAW.findMidiPortById(midiPorts, changedMidiPort.id);

    switch (changedMidiPort.state) {
      case 'connected': {
        if (foundMidiPortIndex > -1) {
          newMidiPorts[foundMidiPortIndex] = changedMidiPort;
        } else {
          newMidiPorts.push(changedMidiPort as MIDIInput & MIDIOutput);
        }
        break;
      }

      case 'disconnected': {
        if (foundMidiPortIndex > -1) {
          newMidiPorts.splice(foundMidiPortIndex, 1);
        }
        break;
      }
    }

    midiPorts = newMidiPorts;
  }

  private _handleMidiInputMessage = (event: MIDIMessageEvent) => {
    const midiInput = event.target as MIDIInput;
    const [status, ...data] = event.data;
    switch (status) {
      case WebDAW.MIDI_NOTE_ON: {
        const [note, velocity] = data;
        const key = note.toString();
        const updatedMidiNotes = { ...this.midiNotes };
        const updatedMidiInputNotes = {
          ...updatedMidiNotes[midiInput.id],
          [key]: velocity,
        };
        updatedMidiNotes[midiInput.id] = updatedMidiInputNotes;
        this.midiNotes = updatedMidiNotes;
        break;
      }

      case WebDAW.MIDI_NOTE_OFF: {
        const [note] = data;
        const key = note.toString();
        const updatedMidiNotes = { ...this.midiNotes };
        const {
          [key]: keyToRemove,
          ...updatedMidiInputNotes
        } = updatedMidiNotes[midiInput.id];
        updatedMidiNotes[midiInput.id] = updatedMidiInputNotes;
        this.midiNotes = updatedMidiNotes;
        break;
      }
    }
  }

  override render() {
    return html`
      <global-controls></global-controls>
      <sound-library></sound-library>
      <track-lanes
        .midiInputs=${this.midiInputs}
        .midiOutputs=${this.midiOutputs}
        .midiNotes=${this.midiNotes}
      ></track-lanes>
    `;
  }
}

declare global {
  interface Navigator {
    requestMIDIAccess(): MIDIAccess;
  }

  interface HTMLElementTagNameMap {
    'web-daw': WebDAW;
  }
}

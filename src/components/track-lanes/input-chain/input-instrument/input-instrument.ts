import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { createToneAttributeUpdate } from '../../../../helpers/helpers';

import '../../../shared/control-knob';

import { KnobValueChangedEvent } from './input-instrument.d';

@customElement('input-instrument')
export class InputInstrument extends LitElement {
  static override styles = css`
    :host {
      box-sizing: var(--box-sizing);
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    h1 {
      font-size: 20px;
      margin: 0.5em 0 0.25em;
    }

    .input-chain__instrument {
      background-color: var(--background-color-2);
      height: 100%;
      padding: 0.5em 2em;
      user-select: none;
    }

    .input-chain__instrument:hover {
      background-color: var(--background-color-1);
    }

    .instrument__controls {
      display: grid;
      gap: 0.25em 1em;
      grid-template-rows: [top-row] auto [bottom-row] auto;
    }
  `;

  @property({ type: Object })
  instrument: any;

  constructor() {
    super();

    this.addEventListener('knobvaluechanged', this._handlePropChange);
  }

  private _dispatchRemoveInstrument = () => {
    const event = new CustomEvent('instrumentremoved', {
      bubbles: true,
      composed: true,
      detail: {
        instrument: this.instrument,
      },
    });
    this.dispatchEvent(event);
  }

  private _handlePropChange = (event: KnobValueChangedEvent) => {
    const { name: propName, value: propValue } = event.detail;
    const attributeUpdate = createToneAttributeUpdate(propName, propValue);
    this.instrument.toneInstrument.set(attributeUpdate);
  }

  private _renderControls() {
    switch (this.instrument.id) {
      case 'synth':
        return this._renderSynthControls();
      case 'sampler':
        return this._renderSamplerControls();
      default:
        return html``;
    }
  }

  private _renderSynthControls() {
    return html`
      <control-knob
        size="medium"
        name="oscillator.type"
        value=${1}
        min=${0}
        max=${3}
        .valueMap=${[
          'sine',
          'triangle',
          'square',
          'sawtooth',
        ]}
      >
        Oscillator Type
      </control-knob>
    `;
  }

  private _renderSamplerControls() {
    return html`
      <control-knob
        size="medium"
        name="oscillator.type"
        value=${this.instrument.oscillator.type}
        min=${0.1}
        max=${20}
        step=${0.01}
      >
        Attribute
      </control-knob>
    `;
  }

  override render() {
    return html`
      <section class="input-chain__instrument">
        <h1 @click=${this._dispatchRemoveInstrument}>
          ${this.instrument.name}
        </h1>
        <section class="instrument__controls">
          ${this._renderControls()}
        </section>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-instrument': InputInstrument;
  }
}

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { createAttributeUpdate } from '../../../../helpers/helpers';

import '../../../shared/control-knob';

import { KnobValueChangedEvent } from './input.effect.interface';

@customElement('input-effect')
export class InputEffect extends LitElement {
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
      margin: 1em 0 0.25em;
    }

    .input-chain__effect {
      background-color: var(--background-color-2);
      height: 100%;
      margin: 0 0.5em;
      padding: 0.5em 2em;
      user-select: none;
    }

    .input-chain__effect:hover {
      background-color: var(--background-color-1);
    }

    .effect__controls {
      display: grid;
      gap: 0.5em 1em;
      grid-template-columns: 96px 96px;
      grid-template-rows: 64px 64px;
    }
  `;

  @property({ type: Number })
  effectIndex: number;

  @property({ type: Object })
  effect: any;

  constructor() {
    super();

    this.addEventListener('knobvaluechanged', this._handlePropChange);
  }

  private _dispatchRemoveEffect = () => {
    const detail = this.effectIndex;
    const event = new CustomEvent('effectremoved', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    this.dispatchEvent(event);
  }

  private _handlePropChange = (event: KnobValueChangedEvent) => {
    const { name: propName, value: propValue } = event.detail;
    const attributeUpdate = createAttributeUpdate(propName, propValue);
    this.effect.toneEffect.set(attributeUpdate);
  }

  private _renderControls() {
    switch (this.effect.id) {
      case 'reverb':
        return this._renderReverbControls();
      default:
        return html``;
    }
  }

  private _renderReverbControls() {
    const { decay, wet } = this.effect.toneEffect.get();
    return html`
      <control-knob
        size="medium"
        name="decay"
        value=${decay}
        min="0"
        max="60"
        step="0.001"
      >
        Decay
      </control-knob>

      <control-knob
        size="medium"
        name="wet"
        value=${wet}
        min="0"
        max="1"
        step="0.001"
      >
        Wet
      </control-knob>
    `;
  }

  override render() {
    return html`
      <section class="input-chain__effect">
        <h1 @click=${this._dispatchRemoveEffect}>
          ${this.effect.name}
        </h1>
        <section class="effect__controls">
          ${this._renderControls()}
        </section>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-effect': InputEffect;
  }
}

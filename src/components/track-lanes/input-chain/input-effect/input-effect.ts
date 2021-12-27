import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  createToneAttributeUpdate,
  flattenToneAttributes,
} from '../../../../helpers/helpers';

import '../../../shared/control-knob';

import { effects as effectsLibrary } from './input-effect.lib';
import {
  InputEffectLibraryItem,
  InputEffectLibraryItemParameter,
  KnobValueChangedEvent,
} from './input-effect.d';

@customElement('input-effect')
export class InputEffect extends LitElement {
  static override styles = css`
    :host {
      box-sizing: var(--box-sizing);
      flex-grow: 1;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    h1 {
      margin: 0.5em 0 0.25em;
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
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      gap: 0.25em 1em;
      height: calc(126px + 0.5em);
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
    const event = new CustomEvent('effectremoved', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        index: this.effectIndex,
      },
    });
    this.dispatchEvent(event);
  }

  private _handlePropChange = (event: KnobValueChangedEvent) => {
    const { name: propName, value: propValue } = event.detail;
    const attributeUpdate = createToneAttributeUpdate(propName, propValue);
    this.effect.toneEffect.set(attributeUpdate);
  }

  private _renderControls() {
    const effectControls = effectsLibrary.find((effect: InputEffectLibraryItem) => {
      return effect.id === this.effect.id;
    });

    if (!effectControls) {
      return null;
    }

    const attributes = this.effect.toneEffect.get();
    const flattenedAttributes = flattenToneAttributes(attributes);
    return effectControls.parameters.map((parameter: InputEffectLibraryItemParameter) => {
      let { [parameter.id]: parameterValue }: { [key: string]: any } = flattenedAttributes;
      if (typeof parameterValue === 'undefined') {
        parameterValue = parameter.min;
      } else if (parameter.valueMap) {
        parameterValue = parameter.valueMap.findIndex(value => value === parameterValue);
      }

      return html`
        <control-knob
          size="medium"
          name=${parameter.id}
          value=${parameterValue}
          min=${parameter.min}
          max=${parameter.max}
          step=${parameter.step}
          unit=${parameter.unit}
          .valueMap=${parameter.valueMap}
        >
          ${parameter.name}
        </control-knob>
      `
    });
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

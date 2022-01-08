import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

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
      background-color: var(--background-color-2);
      flex-grow: 1;
      padding: 0.5em 2em;
      user-select: none;
    }

    :host:hover {
      background-color: var(--background-color-1);
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

    .effect__controls {
      display: grid;
      gap: 0.25em 1em;
      grid-template-rows: [top-row] auto [bottom-row] auto;
    }
  `;

  @property({ type: Number })
  effectIndex: number;

  @property({ type: Object })
  effect: any;

  constructor() {
    super();

    this.addEventListener('dragstart', this._handleDragStart);
    this.addEventListener('knobvaluechanged', this._handlePropChange);
  }

  private _dispatchRemoveEffect = () => {
    const event = new CustomEvent('effectremoved', {
      bubbles: true,
      composed: true,
      detail: {
        index: this.effectIndex,
      },
    });
    this.dispatchEvent(event);
  }

  private _handleDragStart = (event: DragEvent) => {
    const data = JSON.stringify({
      id: this.effect.id,
      index: this.effectIndex,
      name: this.effect.name,
      type: 'effect',
    });
    event.dataTransfer.setData('text/plain', data);
    event.dataTransfer.effectAllowed = 'move';
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
    return effectControls.parameters.map((
      parameter: InputEffectLibraryItemParameter,
      index: number,
    ) => {
      let { [parameter.id]: parameterValue }: { [key: string]: any } = flattenedAttributes;
      if (typeof parameterValue === 'undefined') {
        parameterValue = parameter.min;
      } else if (parameter.valueMap) {
        parameterValue = parameter.valueMap.findIndex(value => value === parameterValue);
      }

      const isEvenIndex = index % 2 === 0;
      const style = {
        gridRow: isEvenIndex ? '1 / 1' : '2 / 2',
      };

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
          style=${styleMap(style)}
        >
          ${parameter.name}
        </control-knob>
      `
    });
  }

  override render() {
    return html`
      <h1 @click=${this._dispatchRemoveEffect}>
        ${this.effect.name}
      </h1>
      <section class="effect__controls">
        ${this._renderControls()}
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-effect': InputEffect;
  }
}

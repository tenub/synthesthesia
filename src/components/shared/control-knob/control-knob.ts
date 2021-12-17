import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';

import { roundWithPrecision } from '../../../helpers';

@customElement('control-knob')
export class ControlKnob extends LitElement {
  static maxRotation = 270;

  static override styles = css`
    :host {
      --tiny-knob: calc(4 * var(--size-increment));
      --small-knob: calc(6 * var(--size-increment));
      --medium-knob: calc(8 * var(--size-increment));
      --large-knob: calc(9 * var(--size-increment));
      --huge-knob: calc(12 * var(--size-increment));

      --tiny-knob-spacing: calc(var(--tiny-knob) / 2);
      --small-knob-spacing: calc(var(--small-knob) / 2);
      --medium-knob-spacing: calc(var(--medium-knob) / 2);
      --large-knob-spacing: calc(var(--large-knob) / 2);
      --huge-knob-spacing: calc(var(--huge-knob) / 2);

      box-sizing: var(--box-sizing);
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    .control-knob__control {
      position: relative;
    }

    .control-knob__knob {
      border-radius: 50%;
      clip-path: circle();
      margin: 0.25em 0 0;
      position: relative;
    }

    .control-knob--tiny .control-knob__knob {
      height: var(--tiny-knob);
      width: var(--tiny-knob);
    }

    .control-knob--small .control-knob__knob {
      height: var(--small-knob);
      width: var(--small-knob);
    }

    .control-knob--medium .control-knob__knob {
      height: var(--medium-knob);
      width: var(--medium-knob);
    }

    .control-knob--large .control-knob__knob {
      height: var(--large-knob);
      width: var(--large-knob);
    }

    .control-knob--huge .control-knob__knob {
      height: var(--huge-knob);
      width: var(--huge-knob);
    }

    .control-knob__knob:hover::before,
    .control-knob__knob:hover::after {
      background-color: var(--background-color-5);
    }

    .control-knob__knob::before {
      background-color: var(--background-color-4);
      content: '';
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 50%;
    }

    .control-knob__knob::after {
      background-color: var(--background-color-4);
      content: '';
      height: 50%;
      left: 50%;
      position: absolute;
      top: 0;
      width: 50%;
    }

    .control-knob__pointer {
      background-color: red;
      height: 50%;
      left: calc(50% - 1px);
      position: absolute;
      top: 50%;
      transform-origin: top center;
      width: 2px;
      z-index: 1;
    }

    .control-knob__value {
      display: flex;
      font-family: var(--main-font-family);
      font-size: 16px;
      padding: 0.25em 0.375em;
    }

    .control-knob--tiny .control-knob__value {
      margin: calc(-1 * var(--tiny-knob-spacing)) 0 0 var(--tiny-knob-spacing);
      width: calc(100% - var(--tiny-knob-spacing));
    }

    .control-knob--small .control-knob__value {
      margin: calc(-1 * var(--small-knob-spacing)) 0 0 var(--small-knob-spacing);
      width: calc(100% - var(--small-knob-spacing));
    }

    .control-knob--medium .control-knob__value {
      margin: calc(-1 * var(--medium-knob-spacing)) 0 0 var(--medium-knob-spacing);
      width: calc(100% - var(--medium-knob-spacing));
    }

    .control-knob--large .control-knob__value {
      margin: calc(-1 * var(--large-knob-spacing)) 0 0 var(--large-knob-spacing);
      width: calc(100% - var(--large-knob-spacing));
    }

    .control-knob--huge .control-knob__value {
      margin: calc(-1 * var(--huge-knob-spacing)) 0 0 var(--huge-knob-spacing);
      width: calc(100% - var(--huge-knob-spacing));
    }

    .control-knob__input-wrapper {
      position: relative;
    }

    .control-knob__input,
    .control-knob__unit {
      align-items: flex-end;
      display: flex;
    }

    .control-knob__input {
      background: none;
      border: none;
      color: transparent;
      font-family: var(--main-font-family);
      font-size: inherit;
      height: 100%;
      left: 0;
      padding: 0 0 1px;
      position: absolute;
      top: 0;
      width: 100%;
      -moz-appearance: textfield;
    }

    .control-knob__input:focus {
      color: var(--main-color);
    }

    .control-knob__input::-webkit-outer-spin-button,
    .control-knob__input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .control-knob__input:focus {
      border-color: var(--background-color-5);
      outline: none;
    }

    .control-knob__input:invalid {
      border-color: red;
    }

    .control-knob__unit {
      font-size: 12px;
      margin: 0 0 1px;
    }
  `

  @property({ type: String })
  size: string = "medium";

  @property({ type: String })
  name: string;

  @property({ type: Number })
  value: number;

  @property({ type: Number })
  min: number;

  @property({ type: Number })
  max: number;

  @property({ type: Number })
  step: number = 1;

  @property({ type: String })
  unit: string = '';

  @property({ type: Array })
  valueMap = [];

  @state()
  _isDragging: boolean = false;

  @state()
  _radius: number = 0;

  @state()
  _startingY: number = 0;

  @state()
  _startingValue: number = 0;

  _inputRef = createRef<HTMLInputElement>();

  _valueRef = createRef<HTMLDivElement>();

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('pointermove', this._handlePointerMove);
    window.addEventListener('pointerup', this._handlePointerUp);
    window.addEventListener('pointerout', this._handlePointerUp);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('pointermove', this._handlePointerMove);
    window.removeEventListener('pointerup', this._handlePointerUp);
    window.removeEventListener('pointerout', this._handlePointerUp);
  }

  private _dispatchChangeValue() {
    let value = this.value;
    if (this.valueMap) {
      let mappedValue = this.valueMap[this.value];
      if (typeof mappedValue !== 'undefined') {
        value = mappedValue;
      }
    }

    const detail = { name: this.name, value };
    const event = new CustomEvent('knobvaluechanged', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    this.dispatchEvent(event);
  }

  private _handleInput = () => {
    const input = this._inputRef.value! as HTMLInputElement;
    this.value = Number(input.value);

    this._dispatchChangeValue();
  }

  private _handleFocus = () => {
    const input = this._inputRef.value! as HTMLInputElement;
    const value = this._valueRef.value! as HTMLDivElement;
    input.style.color = 'inherit';
    value.style.color = 'transparent';

    input.select();
  }

  private _handleBlur = () => {
    const input = this._inputRef.value! as HTMLInputElement;
    const value = this._valueRef.value! as HTMLDivElement;
    input.style.color = 'transparent';
    value.style.color = 'inherit';
  }

  private _handlePointerDown = (event: PointerEvent) => {
    const knob = event.target as HTMLDivElement;
    this._isDragging = true;
    this._radius = knob.offsetHeight / 2;
    this._startingY = event.y;
    this._startingValue = Number(this.value);
  }

  private _handlePointerMove = (event: PointerEvent) => {
    if (this._isDragging) {
      const min = Number(this.min);
      const max = Number(this.max);
      const step = this.step || 1;
      const startValue = this._startingValue;
      const startRotation = startValue / (max - min) * ControlKnob.maxRotation;
      const distance = this._startingY - event.y;
      const rotation = startRotation + distance / (2 * Math.PI * this._radius) * 360;
      const actualRotation = (rotation < 0) ? 0 : (rotation > ControlKnob.maxRotation) ? ControlKnob.maxRotation : rotation;
      const newValue = actualRotation / ControlKnob.maxRotation * (max - min);
      const roundPrecision = -1 * Math.log10(step);
      const roundedValue = roundWithPrecision(newValue, roundPrecision);
      this.value = roundedValue;

      const input = this._inputRef.value! as HTMLInputElement;
      input.value = this.value.toString();

      this._dispatchChangeValue();
    };
  }

  private _handlePointerUp = () => {
    this._isDragging = false;
  }

  private _renderKnob() {
    const min = Number(this.min);
    const max = Number(this.max);
    const value = Number(this.value);
    const rotation = value / (max - min) * ControlKnob.maxRotation;

    return html`
      <div
        class="control-knob__knob"
        @pointerdown=${this._handlePointerDown}
      >
        <div
          class="control-knob__pointer"
          style="transform: rotate(${rotation}deg)"
        ></div>
      </div>
    `;
  }

  private _renderValue() {
    let value = this.value;
    if (this.valueMap) {
      let mappedValue = this.valueMap[this.value];
      if (typeof mappedValue !== 'undefined') {
        value = mappedValue;
      }
    }

    return html`
      <div ${ref(this._valueRef)}>
        ${value}
      </div>
    `;
  }

  private _renderUnit() {
    if (!this.unit) {
      return null;
    }

    return html`
      <div class="control-knob__unit">
        ${this.unit}
      </div>
    `;
  }

  private _renderInput() {
    const step = this.step || 1;
    return html`
      <div class="control-knob__value">
        <div class="control-knob__input-wrapper">
          <input
            ${ref(this._inputRef)}
            class="control-knob__input"
            type="number"
            name=${this.name}
            value=${this.value}
            min=${this.min}
            max=${this.max}
            step=${step}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
            @input=${this._handleInput}
          >

          ${this._renderValue()}
        </div>

        ${this._renderUnit()}
      </div>
    `;
  }

  override render() {
    return html`
      <label class=${`control-knob control-knob--${this.size}`}>
        <slot></slot>
        <div class="control-knob__control">
          ${this._renderKnob()}
          ${this._renderInput()}
        </div>
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'control-knob': ControlKnob;
  }
}

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('input-generator')
export class InputGenerator extends LitElement {
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

    .input-chain__generator {
      background-color: var(--background-color-2);
      margin: 0 0.5em;
      padding: 0.5em 1em;
      user-select: none;
    }

    .input-chain__generator:hover {
      background-color: var(--background-color-1);
    }
  `;

  @property({ type: Object })
  generator: any;

  @property({ type: Number })
  generatorIndex: number;

  private _dispatchRemoveGenerator = () => {
    const detail = this.generatorIndex;
    const event = new CustomEvent('generatorremoved', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    });
    this.dispatchEvent(event);
  }

  private _handlePropChange = (event: InputEvent) => {
    const input = event.target as HTMLInputElement;
    const { name: propName, value: propValue } = input;
    this.generator.set({ [propName]: propValue });
  }

  private _renderControls() {
    switch (this.generator.name) {
      case 'FMSynth':
        return this._renderFMSynthControls();
      default:
        return html``;
    }
  }

  private _renderFMSynthControls() {
    return html`
      <label>Harmonicity <input
        type="number"
        name="harmonicity"
        value=${this.generator.harmonicity.value}
        min="0"
        max="100"
        step="0.01"
        @input=${this._handlePropChange}
      ></label>
    `;
  }

  override render() {
    return html`
      <section class="input-chain__generator">
        <h1 @click=${this._dispatchRemoveGenerator}>
          ${this.generator.name}
        </h1>

        ${this._renderControls()}
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-generator': InputGenerator;
  }
}

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

    .input-chain__generator {
      background-color: var(--background-color-2);
      margin: 0 0.5em;
      padding: 0.5em 1em;
    }
  `;

  @property({ type: Object })
  generator: any;

  override render() {
    return html`
      <div class="input-chain__generator">
        ${this.generator.name}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-generator': InputGenerator;
  }
}

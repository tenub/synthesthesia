import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('input-meter')
export class InputMeter extends LitElement {
  static override styles = css`
    .input-meter {
      background-color: green;
      background-image: linear-gradient(green, red);
      height: 100%;
      position: relative;
      width: calc(2 * var(--size-increment));
    }

    .input-meter__left {
      background: black;
      position: absolute;
      right: 0;
      top: 0;
      width: var(--size-increment);
    }

    .input-meter__right {
      background: black;
      left: 0;
      position: absolute;
      top: 0;
      width: var(--size-increment);
    }
  `

  @property({ type: Array })
  value;

  override render() {
    const [left, right] = this.value;
    const leftPercent = 100 - left * 100;
    const rightPercent = 100 - right * 100;

    return html`
      <div class="input-meter">
        <div
          class="input-meter__left"
          style=${styleMap({
            height: `${leftPercent}%`,
          })}
        ></div>

        <div
          class="input-meter__right"
          style=${styleMap({
            height: `${rightPercent}%`,
          })}
        ></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-meter': InputMeter;
  }
}

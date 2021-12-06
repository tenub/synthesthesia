import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('custom-icon')
export class CustomIcon extends LitElement {
  static override styles = css`
    .material-icons {
      direction: ltr;
      display: flex;
      font-family: 'Material Icons';
      font-feature-settings: 'liga';
      font-size: 24px;
      font-style: normal;
      font-weight: normal;
      letter-spacing: normal;
      line-height: 1;
      text-transform: none;
      white-space: nowrap;
      word-wrap: normal;
      -webkit-font-feature-settings: 'liga';
      -webkit-font-smoothing: antialiased;
    }
  `

  @property({ type: String })
  type = 'material'

  override render() {
    const classes = {
      'material-icons': this.type === 'material',
    };

    return html`
      <span class=${classMap(classes)}>
        <slot></slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-icon': CustomIcon;
  }
}

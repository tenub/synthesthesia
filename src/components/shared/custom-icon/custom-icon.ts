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

    .icon-size--tiny {
      font-size: 12px;
    }

    .icon-size--small {
      font-size: 16px;
    }

    .icon-size--medium {
      font-size: 24px;
    }

    .icon-size--large {
      font-size: 32px;
    }

    .icon-size--huge {
      font-size: 36px;
    }
  `

  @property({ type: String })
  size = 'medium';

  @property({ type: String })
  type = 'material';

  override render() {
    const classes = {
      'material-icons': this.type === 'material',
      'icon-size--tiny': this.size === 'tiny',
      'icon-size--small': this.size === 'small',
      'icon-size--medium': this.size === 'medium',
      'icon-size--large': this.size === 'large',
      'icon-size--huge': this.size === 'huge',
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

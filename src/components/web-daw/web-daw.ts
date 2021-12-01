import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import '../global-controls';
import '../sound-library';
import '../track-lanes';
import '../input-chain';

@customElement('web-daw')
export class WebDAW extends LitElement {
  static override styles = css`
    :host {
      --box-sizing: border-box;
      --highlight-background-color: hsl(0, 0%, 18.75%);
      --main-background-color: hsl(0, 0%, 12.5%);
      --main-color: white;
      --main-font-family: 'Open Sans', sans-serif;
      --main-font-size: 16px;
      --shadow-background-color: hsl(0, 0%, 6.25%);

      background-color: var(--main-background-color);
      box-sizing: var(--box-sizing);
      color: var(--main-color);
      display: grid;
      font-family: var(--main-font-family);
      grid-template-columns: [left-col] 320px [main-col] auto;
      grid-template-rows: [top-row] 64px [main-row] auto;
      height: 100vh;
      width: 100%;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }
  `;

  override render() {
    return html`
      <global-controls></global-controls>
      <sound-library></sound-library>
      <track-lanes></track-lanes>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'web-daw': WebDAW;
  }
}

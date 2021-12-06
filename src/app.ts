import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import './web-daw';

@customElement('synthesthesia-app')
export class App extends LitElement {
  override render() {
    return html`
      <web-daw></web-daw>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'synthesthesia-app': App;
  }
}

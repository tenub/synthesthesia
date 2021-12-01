import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import './components/web-daw';

@customElement('main-app')
export class App extends LitElement {
  override render() {
    return html`
      <web-daw></web-daw>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'main-app': App;
  }
}

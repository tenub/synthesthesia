import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('chain-element')
export class ChainElement extends LitElement {
  @property({ type: String })
  type: string;

  @property({ type: String })
  name: string;

  constructor() {
    super();

    this.addEventListener('dragstart', this._handleDragStart);
  }

  private _handleDragStart = (event: DragEvent) => {
    const data = JSON.stringify({
      type: this.type,
      name: this.name,
    });
    event.dataTransfer.setData('text/plain', data);
    event.dataTransfer.effectAllowed = 'move';
  }

  override render() {
    return html`
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chain-element': ChainElement;
  }
}

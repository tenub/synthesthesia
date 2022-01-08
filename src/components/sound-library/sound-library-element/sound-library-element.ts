import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sound-library-element')
export class SoundLibraryElement extends LitElement {
  static override styles = css`
    :host {
      align-items: center;
      display: flex;
    }
  `;

  @property({ type: String })
  type: string;

  @property({ type: String })
  itemId: string;

  @property({ type: String })
  name: string;

  constructor() {
    super();

    this.addEventListener('dragstart', this._handleDragStart);
  }

  private _handleDragStart = (event: DragEvent) => {
    const data = { id: this.itemId, name: this.name, type: this.type };
    event.dataTransfer.setData('text/plain', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';

    this.dispatchEvent(new CustomEvent('dragstarted', {
      bubbles: true,
      composed: true,
      detail: {
        origin: 'sound-library',
        data,
      },
    }));
  }

  override render() {
    return html`
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sound-library-element': SoundLibraryElement;
  }
}

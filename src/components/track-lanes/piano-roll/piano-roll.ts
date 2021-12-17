import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import * as Tone from 'tone';

import { TrackPattern } from '../track-lane/track-lane.d';

@customElement('piano-roll')
export class PianoRoll extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      box-shadow: 0 0 1em var(--background-color-1);
      box-sizing: var(--box-sizing);
      display: flex;
      grid-column: 1 / 1;
      grid-row: 2 / 2;
      padding: 0.5em 1em;
      position: relative;
      z-index: 2;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    ::-webkit-scrollbar {
      background: none;
      height: 12px;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--background-color-1);
      background-clip: content-box;
      border: 2px solid transparent;
      border-radius: 6px;
    }

    .piano-roll--isEmpty {
      align-items: center;
      color: grey;
      display: flex;
      justify-content: center;
      width: 100%;
      user-select: none;
    }
  `;

  @property({ type: Object })
  pattern: TrackPattern;

  constructor() {
    super();

  }

  private _renderPattern() {
    return html`
      ${this.pattern.name}
    `;
  }

  private _renderNullState() {
    return html`
      <span>No pattern selected</span>
    `;
  }

  override render() {
    console.log(this.pattern);
    const isPatternDefined = typeof this.pattern !== 'undefined';
    const classes = {
      'piano-roll': true,
      'piano-roll--isEmpty': !isPatternDefined,
    };
    return html`
      <div class=${classMap(classes)}>
        ${isPatternDefined ? this._renderPattern() : this._renderNullState()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'piano-roll': PianoRoll;
  }
}

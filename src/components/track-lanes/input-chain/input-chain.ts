import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import * as Tone from 'tone';

import { DragData } from '../../../web-daw/web-daw.d';

import { Track } from '../track-lane/track-lane.d';

import { DropTarget } from './input-chain.d';

import './input-instrument';
import './input-effect';

@customElement('input-chain')
export class InputChain extends LitElement {
  static override styles = css`
    :host {
      background-color: var(--background-color-2);
      box-shadow: 0 0 1em var(--background-color-1);
      box-sizing: var(--box-sizing);
      display: flex;
      gap: 0 0.5em;
      grid-column: 1 / 1;
      grid-row: 3 / 3;
      height: calc(100% + 0.5em);
      overflow-x: scroll;
      overflow-y: visible;
      padding: 0.5em 1em 0;
      position: relative;
      z-index: 2;
    }

    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }

    :host::-webkit-scrollbar {
      background: none;
      height: 2.5em;
      width: 2.5em;
    }

    :host::-webkit-scrollbar-thumb {
      background: var(--background-color-1);
      background-clip: content-box;
      border: 1em solid transparent;
      border-radius: 1.25em;
    }

    :host::-webkit-scrollbar-corner {
      background: none;
    }

    .input-chain-placeholder {
      align-items: center;
      color: grey;
      display: flex;
      flex-grow: 1;
      justify-content: center;
      user-select: none;
    }

    .input-chain__instrument,
    .input-chain__effects {
      background-color: var(--background-color-3);
      border-radius: 0.5em;
      display: flex;
      flex-shrink: 0;
      gap: 0.5em;
      min-width: 64px;
      padding: 0.5em;
      position: relative;
    }

    .chain-placeholder {
      background-color: red;
      border-radius: 1px;
      height: calc(100% - var(--size-increment));
      margin: 0 var(--size-increment);
      width: 2px;
    }

    .input-chain-item-placeholder {
      font-size: 0.75em;
      left: 50%;
      position: absolute;
      bottom: 50%;
      transform: translateX(-50%) translateY(-50%) rotate(-90deg);
      width: 128px;
    }
  `;

  @property({ type: Object })
  track: Track;

  @property({ type: Object })
  dragData: DragData;

  @state()
  _dropTarget: DropTarget = {
    element: null,
  };

  _instrumentRef = createRef<HTMLDivElement>();

  _effectsRef = createRef<HTMLDivElement>();

  constructor() {
    super();

    this.addEventListener('dragover', this._handleDragOver);
    this.addEventListener('dragend', this._handleDragEnded);
    this.addEventListener('dragleave', this._handleDragEnded);
    this.addEventListener('drop', this._handleDrop);
  }

  private _defineInstrument(id: string, name: string): any {
    let toneInstrument;
    switch (id) {
      case 'synth': {
        toneInstrument = new Tone.PolySynth();

        break;
      }
      case 'sampler':
        toneInstrument = new Tone.Sampler();
        break;
      default:
        return;
    }

    return {
      id,
      name,
      toneInstrument,
    };
  }

  private _defineEffect(id: string, name: string): any {
    let toneEffect;
    switch (id) {
      case 'auto-filter':
        toneEffect = new Tone.AutoFilter();
        break;

      case 'chorus':
        toneEffect = new Tone.Chorus();
        break;

      case 'distortion':
        toneEffect = new Tone.Distortion();
        break;

      case 'ping-pong-delay':
        toneEffect = new Tone.PingPongDelay();
        break;

      case 'reverb':
        toneEffect = new Tone.Reverb();
        break;

      default:
        return;
    }

    return {
      id,
      name,
      toneEffect,
    };
  }

  private _handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const intrumentContainer = this._instrumentRef.value!;
    const isOverInstrumentContainer = this._isOver(event, intrumentContainer);
    const isDraggedItemInstrument = this.dragData.origin === 'sound-library'
      && this.dragData.data.type === 'instrument';
    if (isOverInstrumentContainer && isDraggedItemInstrument) {
      this._dropTarget = {
        element: intrumentContainer,
        index: 0,
      };

      return;
    }

    const effectsContainer = this._effectsRef.value!;
    const isOverEffectsContainer = this._isOver(event, effectsContainer);
    const isDraggedItemEffect = this.dragData.origin === 'sound-library'
      && this.dragData.data.type === 'effect';
    const effectElements = [...effectsContainer.children].filter(child => {
      const isEffect = child.nodeName === 'INPUT-EFFECT';
      return isEffect;
    });

    if (isOverEffectsContainer && isDraggedItemEffect) {
      if (!effectElements.length) {
        this._dropTarget = {
          element: effectsContainer,
          index: 0,
        };

        return;
      }

      let closestDiffX;

      const dropTarget = effectElements.reduce((
        closestDropTarget,
        element,
        index,
      ) => {
        const chainElement = element as HTMLElement;
        const {
          left: chainElementLeft,
          width: chainElementWidth,
        } = chainElement.getBoundingClientRect();
        const midElementX = chainElementLeft + chainElementWidth / 2;
        const diffX =  event.x - midElementX;
        const diffXMagnitude = Math.abs(diffX);
        if (diffXMagnitude >= closestDiffX) {
          return closestDropTarget;
        }

        closestDiffX = diffXMagnitude;

        return {
          element,
          index,
          isBefore: diffX < 0,
        };
      }, {
        element: null,
      });

      this._dropTarget = dropTarget;

      return;
    }

    this._dropTarget = {
      element: null,
    }
  }

  private _isOver = (event: DragEvent, element: HTMLElement) => {
    const { x, y } = event;
    const { top, right, bottom, left } = element.getBoundingClientRect();
    return x >= left && y >= top && x <= right && y <= bottom;
  }

  private _handleDrop = (event: DragEvent) => {
    const data = event.dataTransfer.getData('text/plain');
    const { type, id, name } = JSON.parse(data);
    switch (type) {
      case 'instrument': {
        const instrument = this._defineInstrument(id, name);
        if (!instrument) {
          return;
        }

        const event = new CustomEvent('instrumentadded', {
          bubbles: true,
          composed: true,
          detail: {
            instrument,
          },
        });
        this.dispatchEvent(event);
        break;
      }

      case 'effect': {
        const effect = this._defineEffect(id, name);
        if (!effect) {
          return;
        }

        const { index, isBefore } = this._dropTarget;
        const event = new CustomEvent('effectadded', {
          bubbles: true,
          composed: true,
          detail: {
            index: isBefore ? index : index + 1,
            effect,
          },
        });
        this.dispatchEvent(event);
        break;
      }

      default: break;
    }

    this._dropTarget = {
      element: null,
    };
  }

  private _handleDragEnded = () => {
    this._dropTarget = {
      element: null,
    };
  }

  private _renderInstrument() {
    if (this.track.instrument.id === 'chain-placeholder') {
      return html`
        <div class="chain-placeholder"></div>
      `;
    }

    return html`
      <input-instrument .instrument=${this.track.instrument}></input-instrument>
    `;
  }

  private _renderEffect(effect: any, index: number) {
    if (effect.id === 'chain-placeholder') {
      return html`
        <div class="chain-placeholder"></div>
      `;
    }

    return html`
      <input-effect
        effectIndex=${index}
        .effect=${effect}
      ></input-effect>
    `;
  }

  private _renderChainPlaceholder(type: string) {
    return html`
      <div class="input-chain-item-placeholder">
        Drag ${type} here
      </div>
    `;
  }

  private _renderChain = () => {
    const { element, index, isBefore } = this._dropTarget;
    if (element !== null
      && (element.classList.contains('input-chain__instrument')
        || element.nodeName === 'INPUT-INSTRUMENT')) {
      this.track.instrument = {
        id: 'chain-placeholder',
        name: 'Instrument Placeholder',
      };
    }

    const effects = [...this.track.effects];
    if (element !== null
      && (element.classList.contains('input-chain__effects')
        || element.nodeName === 'INPUT-EFFECT')) {
      const insertIndex = isBefore ? index : index + 1;
      effects.splice(insertIndex, 0, {
        id: 'chain-placeholder',
        name: 'Effect Placeholder',
      });
    }

    return html`
      <div
        ${ref(this._instrumentRef)}
        class="input-chain__instrument"
      >
        ${this.track.instrument
          ? this._renderInstrument()
          : this._renderChainPlaceholder('instrument')}
      </div>

      <div
        ${ref(this._effectsRef)}
        class="input-chain__effects"
      >
        ${effects.length > 0
          ? effects.map(this._renderEffect)
          : this._renderChainPlaceholder('effect')}
      </div>
    `;
  }
  
  private _renderNullState() {
    return html`
      <div class="input-chain-placeholder">No track selected</div>
    `;
  }

  override render() {
    const isTrackDefined = this.track !== null;
    return isTrackDefined ? this._renderChain() : this._renderNullState();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-chain': InputChain;
  }
}

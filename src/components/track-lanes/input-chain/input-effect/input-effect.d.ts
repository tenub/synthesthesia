import { TrackEffect } from '../../track-lane';

export interface InputEffectLibraryItem {
  id: string,
  name: string,
  parameters: InputEffectLibraryItemParameter[],
}

export interface InputEffectLibraryItemParameter {
  id: string,
  name: string,
  min: number,
  max: number,
  step?: number,
  unit?: string,
  valueMap?: any[],
}

export interface AddEffectEvent extends CustomEvent {
  detail: {
    index: number,
    effect: TrackEffect,
  },
}

export interface RemoveEffectEvent extends CustomEvent {
  detail: {
    index: number,
  }
}

export interface KnobValueChangedEvent extends CustomEvent {
  detail: {
    name: string,
    value: string,
  },
}

import { MIDIInput, MIDIOutput } from "../../../web-daw/web-daw.interface";

export interface Track {
  id: number,
  name: string,
  inputId: string,
  outputId: string,
  generators: any[],
  effects: any[],
  utilities: any[]
}

export interface TrackSelectedEvent extends CustomEvent {
  detail: number,
}

export interface TrackUpdatedEvent extends CustomEvent {
  detail: {
    id: number,
    attributes: {
      name?: string,
      inputId?: string,
      outputId?: string,
      generators?: any[],
      effects?: any[],
      utilities?: any[],
    },
  },
}

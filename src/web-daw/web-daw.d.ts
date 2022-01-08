export interface MIDIAccess {
  readonly inputs: MIDIInputMap,
  readonly outputs: MIDIOutputMap,
  readonly sysexEnabled: boolean,
  onstatechange(event: MIDIConnectionEvent): void,
}

export interface MIDIInputMap extends Map<string, MIDIInput> {}

export interface MIDIOutputMap extends Map<string, MIDIOutput> {}

export interface MIDIInput extends MIDIPort {
  onmidimessage(msg: MIDIMessageEvent): void,
}

export interface MIDIOutput extends MIDIPort {
  send(data: Uint8Array, timestamp: number): void,
  clear(): void,
}

export interface MIDIPort extends EventTarget {
  readonly id: string,
  readonly manufacturer: string,
  readonly name: string,
  readonly type: string,
  readonly version: string,
  readonly state: string,
  readonly connection: string,
  onstatechange(): void,
  open(): Promise<any>,
  close(): Promise<any>,
}

export interface MIDIConnectionEvent extends Event {
  readonly port: MIDIPort,
}

export interface MIDIMessageEvent extends Event {
  data: Uint8Array,
}

/**
 * Custom interfaces
 */
export interface MIDINoteInput {
  [id: string]: MIDINotes,
}

export interface MIDINotes {
  [note: string]: number,
}

export interface DragData {
  origin: string,
  data: any,
}

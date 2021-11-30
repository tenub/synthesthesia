export interface MIDIAccess {
  inputs: Map<string, MIDIInput>,
  outputs: Map<string, MIDIOutput>,
  sysexEnabled: boolean,
  onstatechange(event: MIDIConnectionEvent): void,
}

export interface MIDIPort extends EventTarget {
  id: string,
  manufacturer: string,
  name: string,
  type: string,
  version: string,
  state: string,
  connection: string,
  onstatechange?(): void,
  open(): Promise<string>,
  close(): Promise<string>,
}

export interface MIDIInput extends MIDIPort {
  onmidimessage?(msg: MIDIMessageEvent): void,
}

export interface MIDIOutput extends MIDIPort {
  send(data: Uint8Array, timestamp: number): void,
  clear(): void,
}

export interface MIDIConnectionEvent extends Event {
  port: MIDIInput | MIDIOutput,
}

export interface MIDIMessageEvent extends Event {
  data: Uint8Array,
}

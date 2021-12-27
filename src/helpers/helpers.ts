export function roundWithPrecision(num: number, precision: number = 0): number {
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
}

export function createToneAttributeUpdate(name: string, value: any): object {
  const attributes = {};
  const keys = name.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((obj, key) => obj[key] = obj[key] ?? {}, attributes); 
  lastObj[lastKey] = value;
  return attributes;
}

export function flattenToneAttributes(
  attributes: object,
  obj: object = {},
  prefix = '',
): object {
  for (let [key, value] of Object.entries(attributes)) {
    const flattenedKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      return flattenToneAttributes(value, obj, flattenedKey);
    }

    obj[flattenedKey] = value;
  }

  return obj;
}

export function midiNumberToFrequency(m: number): number {
  const f2 = 440;
  const f1 = Math.pow(2, (m - 69) / 12) * f2;
  return f1 + Number.EPSILON;
}

export function formatBeats(beats: number): string {
  const sectionNumber = Math.floor(beats / 16) + 1;
  const barNumber = Math.floor((beats % 16) / 4) + 1;
  const beatNumber = (beats % 4) + 1;
  return `${sectionNumber}.${barNumber}.${beatNumber}`
}

export const octaveMap = [0, 1, 2, 3, 4, 5, 6, 7, 8]

export const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

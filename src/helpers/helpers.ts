export function roundWithPrecision(num: number, precision: number = 0): number {
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
}

export function createToneAttributeUpdate(name: string, value: any): object {
  const attributes = {};
  const keys = name.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((obj, key) => obj[key] = obj[key] || {}, attributes); 
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

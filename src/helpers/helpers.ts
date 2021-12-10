export function roundWithPrecision(num: number, precision: number = 0): number {
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
}

export function createAttributeUpdate(name: string, value: any): object {
  const attributes = {};
  const keys = name.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((obj, key) => obj[key] = obj[key] || {}, attributes); 
  lastObj[lastKey] = value;
  return attributes;
}

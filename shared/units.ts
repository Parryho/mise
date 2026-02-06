// Unit conversion and cost calculation utilities

export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'stueck';

const CONVERSION: Record<string, number> = {
  'g_kg': 0.001,
  'kg_g': 1000,
  'ml_l': 0.001,
  'l_ml': 1000,
};

export function convertUnit(quantity: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) return quantity;
  const key = `${fromUnit}_${toUnit}`;
  const factor = CONVERSION[key];
  if (!factor) return quantity;
  return quantity * factor;
}

export function calculateCost(
  quantity: number,
  quantityUnit: Unit,
  pricePerUnit: number,
  priceUnit: Unit
): number {
  if (pricePerUnit === 0) return 0;
  const converted = convertUnit(quantity, quantityUnit, priceUnit);
  return converted * pricePerUnit;
}

export function formatQuantity(quantity: number, unit: Unit): string {
  if (unit === 'g' && quantity >= 1000) {
    return `${(quantity / 1000).toFixed(2)} kg`;
  }
  if (unit === 'ml' && quantity >= 1000) {
    return `${(quantity / 1000).toFixed(2)} l`;
  }
  if (unit === 'stueck') {
    return `${Math.round(quantity)} Stk`;
  }
  if (quantity === Math.floor(quantity)) {
    return `${quantity} ${unit}`;
  }
  return `${quantity.toFixed(1)} ${unit}`;
}

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(cents);
}

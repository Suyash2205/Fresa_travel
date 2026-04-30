export function calculateCommission(subtotalAmount: number) {
  const base = Math.max(0, subtotalAmount);
  return Number((base * 0.05).toFixed(2));
}

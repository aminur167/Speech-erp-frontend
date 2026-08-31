export function formatCurrency(amount: number): string {
  // The minus sign belongs before the currency symbol ("-৳1,200"), not after
  // it ("৳-1,200") -- toLocaleString on a negative number places its sign
  // right against the digits, which lands in the wrong spot once the symbol
  // is prefixed ahead of it.
  const sign = amount < 0 ? "-" : "";
  return `${sign}৳${Math.abs(amount).toLocaleString("en-BD")}`;
}

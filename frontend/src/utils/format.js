export const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
};

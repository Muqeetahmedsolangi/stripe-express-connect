/**
 * Converts price value to number for calculations
 * Handles both string and number price values from API
 */
export const parsePrice = (price: string | number): number => {
  return typeof price === 'string' ? parseFloat(price) : price;
};

/**
 * Formats price for display
 */
export const formatPrice = (price: string | number, currency: string = 'USD'): string => {
  const numPrice = parsePrice(price);
  return `$${numPrice.toFixed(2)} ${currency}`;
};

/**
 * Calculates total price for quantity
 */
export const calculateTotal = (price: string | number, quantity: number): number => {
  return parsePrice(price) * quantity;
};
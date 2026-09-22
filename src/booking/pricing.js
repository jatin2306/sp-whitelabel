import { EXTRAS, VEHICLES } from './catalog';

export function getVehicle(id) {
  return VEHICLES.find((vehicle) => vehicle.id === id) || null;
}

export function calcTotal(data) {
  const vehicle = getVehicle(data.vehicleId);
  if (!vehicle) return 0;

  const extrasTotal = EXTRAS.filter((extra) => data.extras.includes(extra.id)).reduce(
    (sum, extra) => sum + extra.price,
    0
  );

  return Math.round(vehicle.price + extrasTotal);
}

export function formatMoney(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

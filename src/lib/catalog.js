import { phoneDigits } from './data';

export function clientKey(client) {
  if (client.recordId) return `id:${client.recordId}`;
  const phone = phoneDigits(client.phone);
  if (phone) return `phone:${phone}`;
  return `name:${String(client.name || '')
    .trim()
    .toLowerCase()}`;
}

export function vehicleKey(vehicle) {
  if (vehicle.recordId) return `id:${vehicle.recordId}`;
  if (vehicle.plate?.trim())
    return `plate:${vehicle.plate.trim().toUpperCase()}`;
  return `model:${String(vehicle.model || '')
    .trim()
    .toLowerCase()}|${String(vehicle.client || '')
    .trim()
    .toLowerCase()}`;
}

export function vehicleLabel(vehicle) {
  return [vehicle.model, vehicle.plate?.toUpperCase()]
    .filter(Boolean)
    .join(' · ');
}

export function vehicleBelongsToClient(vehicle, client) {
  if (!client || !vehicle) return false;
  if (vehicle.clientId) return vehicle.clientId === client.recordId;
  const vehiclePhone = phoneDigits(vehicle.clientPhone);
  const clientPhone = phoneDigits(client.phone);
  if (vehiclePhone && clientPhone) return vehiclePhone === clientPhone;
  return Boolean(
    vehicle.client &&
      client.name &&
      vehicle.client.trim().toLowerCase() === client.name.trim().toLowerCase(),
  );
}

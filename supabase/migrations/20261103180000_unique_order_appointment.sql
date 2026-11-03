create unique index if not exists studio_records_order_appointment_unique
  on public.studio_records (owner_id, (payload->>'appointmentId'))
  where kind = 'order' and payload ? 'appointmentId';

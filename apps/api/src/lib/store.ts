import type { StoreInfo, WeeklyHours } from '@newagung/shared';
import type { Queryable } from '../db';
import { HttpError } from '../errors';

export async function getStore(db: Queryable): Promise<StoreInfo> {
  const { rows } = await db.query<{
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
    maps_url: string;
    phone: string;
    whatsapp: string;
    opening_hours: WeeklyHours;
    timezone: string;
  }>('select * from store_settings where id = 1');
  const r = rows[0];
  if (!r) throw new HttpError(500, 'Info toko belum diisi (store_settings kosong)');
  return {
    name: r.name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    mapsUrl: r.maps_url,
    phone: r.phone,
    whatsapp: r.whatsapp,
    openingHours: r.opening_hours,
    timezone: r.timezone,
  };
}

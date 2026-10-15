import type { ShippingRate, StoreInfo } from '@newagung/shared';
import type { Env } from '../env';

// Koordinat Toko New Agung (Jl. DR. Ratulangi No.52 Makassar)
const DEFAULT_STORE_LAT = -5.1484;
const DEFAULT_STORE_LNG = 119.4147;

export interface GetRatesParams {
  lat?: number | null;
  lng?: number | null;
  totalWeightGram?: number;
  totalValue?: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function fallbackRate(env: Env): ShippingRate {
  return {
    courierCode: 'toko',
    courierName: 'Kurir Toko Makassar',
    serviceName: 'Flat Makassar',
    price: env.SHIPPING_FLAT_COST || 15000,
    duration: 'Hari yang sama',
    isFallback: true,
  };
}

export function calculateInstantRates(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  flatCost: number,
): ShippingRate[] {
  const distKm = Math.max(1, haversineKm(originLat, originLng, destLat, destLng));
  const kmStr = distKm.toFixed(1);

  // GoSend Instant (Gojek): Rp 18.000 (0-4 km), selanjutnya +Rp 2.500/km
  const gosendPrice = Math.round((18000 + (distKm > 4 ? Math.ceil(distKm - 4) * 2500 : 0)) / 500) * 500;

  // GrabExpress Instant (Grab): Rp 16.000 (0-4 km), selanjutnya +Rp 2.300/km
  const grabPrice = Math.round((16000 + (distKm > 4 ? Math.ceil(distKm - 4) * 2300 : 0)) / 500) * 500;

  return [
    {
      courierCode: 'gojek',
      courierName: 'GoSend',
      serviceName: 'Instant (1 - 2 Jam)',
      price: gosendPrice,
      duration: `1 - 2 jam (${kmStr} km)`,
      isFallback: false,
    },
    {
      courierCode: 'grab',
      courierName: 'GrabExpress',
      serviceName: 'Instant (1 - 2 Jam)',
      price: grabPrice,
      duration: `1 - 2 jam (${kmStr} km)`,
      isFallback: false,
    },
    {
      courierCode: 'toko',
      courierName: 'Kurir Toko Makassar',
      serviceName: 'Flat Makassar',
      price: flatCost,
      duration: 'Hari yang sama',
      isFallback: true,
    },
  ];
}

export async function fetchShippingRates(
  env: Env,
  store: StoreInfo,
  params: GetRatesParams,
): Promise<ShippingRate[]> {
  const fallback = fallbackRate(env);
  const flatCost = env.SHIPPING_FLAT_COST || 15000;
  const originLat = store.lat ?? DEFAULT_STORE_LAT;
  const originLng = store.lng ?? DEFAULT_STORE_LNG;

  // Jika tidak ada koordinat tujuan, kembalikan Kurir Toko Flat
  if (!params.lat || !params.lng) {
    return [fallback];
  }

  // Jika ada API Key Biteship, prioritaskan hit live API Biteship
  if (env.BITESHIP_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('https://api.biteship.com/v1/rates/couriers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.BITESHIP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          origin_latitude: originLat,
          origin_longitude: originLng,
          destination_latitude: params.lat,
          destination_longitude: params.lng,
          couriers: 'gojek,grab',
          items: [
            {
              name: 'Perlengkapan Toko New Agung',
              value: params.totalValue || 50000,
              quantity: 1,
              weight: params.totalWeightGram || 1000,
            },
          ],
        }),
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = (await res.json()) as {
          pricing?: Array<{
            courier_name?: string;
            courier_code?: string;
            courier_service_name?: string;
            price?: number;
            duration?: string;
            shipment_duration_range?: string;
            shipment_duration_unit?: string;
          }>;
        };

        if (data.pricing && Array.isArray(data.pricing) && data.pricing.length > 0) {
          const rates: ShippingRate[] = data.pricing.map((item) => {
            const code = (item.courier_code || 'kurir').toLowerCase();
            let name = item.courier_name || code.toUpperCase();
            if (code === 'gojek') name = 'GoSend';
            if (code === 'grab') name = 'GrabExpress';

            const durationStr =
              item.duration ||
              (item.shipment_duration_range
                ? `${item.shipment_duration_range} ${item.shipment_duration_unit || ''}`.trim()
                : '1 - 2 jam');

            return {
              courierCode: code,
              courierName: name,
              serviceName: item.courier_service_name || 'Instant',
              price: Math.round(Number(item.price) || 0),
              duration: durationStr,
              isFallback: false,
            };
          });

          rates.sort((a, b) => a.price - b.price);
          return [...rates, fallback];
        }
      }
    } catch {
      // Jika request Biteship gagal/timeout, lanjut ke kalkulasi tarif instan
    }
  }

  // Fallback cerdas: kalkulasi GoSend & GrabExpress berdasarkan jarak GPS presisi
  return calculateInstantRates(originLat, originLng, params.lat, params.lng, flatCost);
}

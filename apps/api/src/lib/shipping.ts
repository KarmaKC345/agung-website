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

export interface GeocodeAddress {
  building: string;
  road: string;
  area: string;
  fullAddress: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeAddress> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TokoNewAgungMakassar/1.0',
          'Accept-Language': 'id',
        },
      },
    );
    if (!res.ok) throw new Error();
    const data = (await res.json()) as {
      name?: string;
      display_name?: string;
      address?: Record<string, string>;
    };

    const addr = data.address || {};
    const building =
      data.name ||
      addr.building ||
      addr.amenity ||
      addr.shop ||
      addr.office ||
      addr.residential ||
      addr.neighbourhood ||
      '';

    const road = addr.road || addr.pedestrian || addr.footway || '';
    const suburb = addr.suburb || addr.village || addr.hamlet || '';
    const district = addr.city_district || addr.district || '';
    const city = addr.city || addr.town || 'Makassar';

    const mainTitle = building || road || 'Lokasi Terpilih';
    const detailParts = [building, road, suburb, district, city].filter(Boolean);
    const uniqueParts = Array.from(new Set(detailParts));
    const fullAddress = uniqueParts.join(', ');

    return {
      building: mainTitle,
      road,
      area: [suburb, district, city].filter(Boolean).join(', '),
      fullAddress: fullAddress || data.display_name || 'Makassar, Sulawesi Selatan',
    };
  } catch {
    return {
      building: 'Lokasi Terpilih',
      road: '',
      area: 'Makassar',
      fullAddress: 'Makassar, Sulawesi Selatan',
    };
  }
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

export async function fetchShippingRates(
  env: Env,
  store: StoreInfo,
  params: GetRatesParams,
): Promise<ShippingRate[]> {
  const fallback = fallbackRate(env);

  // Jika Biteship API belum diisi atau koordinat tujuan tidak ada, kembalikan kurir flat
  if (!env.BITESHIP_API_KEY || !params.lat || !params.lng) {
    return [fallback];
  }

  const originLat = store.lat ?? DEFAULT_STORE_LAT;
  const originLng = store.lng ?? DEFAULT_STORE_LNG;

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

    if (!res.ok) {
      return [fallback];
    }

    const data = (await res.json()) as {
      success?: boolean;
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

    if (!data.pricing || !Array.isArray(data.pricing) || data.pricing.length === 0) {
      return [fallback];
    }

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

    // Urutkan termurah dan sertakan kurir toko flat sebagai opsi cadangan/ekonomis
    rates.sort((a, b) => a.price - b.price);
    return [...rates, fallback];
  } catch {
    return [fallback];
  }
}

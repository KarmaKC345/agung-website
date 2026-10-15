import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env';
import { fallbackRate, fetchShippingRates } from '../src/lib/shipping';
import type { StoreInfo } from '@newagung/shared';

const store: StoreInfo = {
  name: 'Toko New Agung',
  address: 'Jl. DR. Ratulangi No.52 Makassar',
  lat: -5.1484,
  lng: 119.4147,
  mapsUrl: '',
  phone: '0411850555',
  whatsapp: '6282348485101',
  openingHours: {},
  timezone: 'Asia/Makassar',
};

describe('shipping rates', () => {
  it('calculates GoSend, GrabExpress, and Flat Kurir when coordinates are provided', async () => {
    const env = loadEnv({ DATABASE_URL: 'x', BITESHIP_API_KEY: '', SHIPPING_FLAT_COST: '15000' } as NodeJS.ProcessEnv);
    const rates = await fetchShippingRates(env, store, { lat: -5.15, lng: 119.42 });
    expect(rates).toHaveLength(3);
    const couriers = rates.map((r) => r.courierCode);
    expect(couriers).toContain('gojek');
    expect(couriers).toContain('grab');
    expect(couriers).toContain('toko');
    const flat = rates.find((r) => r.courierCode === 'toko');
    expect(flat?.price).toBe(15000);
  });

  it('returns fallback flat rate when destination coordinates are missing', async () => {
    const env = loadEnv({ DATABASE_URL: 'x', BITESHIP_API_KEY: 'test-key' } as NodeJS.ProcessEnv);
    const rates = await fetchShippingRates(env, store, {});
    expect(rates).toHaveLength(1);
    expect(rates[0]!.courierCode).toBe('toko');
    expect(rates[0]!.isFallback).toBe(true);
  });

  it('respects custom SHIPPING_FLAT_COST', () => {
    const env = loadEnv({ DATABASE_URL: 'x', SHIPPING_FLAT_COST: '20000' } as NodeJS.ProcessEnv);
    expect(fallbackRate(env).price).toBe(20000);
  });

  it('excludes Kurir Toko when destination distance is greater than 5 km', async () => {
    const env = loadEnv({ DATABASE_URL: 'x', BITESHIP_API_KEY: '', SHIPPING_FLAT_COST: '15000' } as NodeJS.ProcessEnv);
    // BTP / Daya Makassar is ~12 km away from Ratulangi
    const rates = await fetchShippingRates(env, store, { lat: -5.11, lng: 119.51 });
    const couriers = rates.map((r) => r.courierCode);
    expect(couriers).toContain('gojek');
    expect(couriers).toContain('grab');
    expect(couriers).not.toContain('toko');
  });
});

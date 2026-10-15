'use client';

import { ArrowLeft, Crosshair, MapPin } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { API_URL } from '@/lib/config';

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  onConfirm: (loc: { lat: number; lng: number; fullAddress: string; building: string }) => void;
  onClose: () => void;
}

const MAKASSAR_CENTER_LAT = -5.1484;
const MAKASSAR_CENTER_LNG = 119.4147;

export function MapPickerModal({
  initialLat,
  initialLng,
  initialAddress,
  onConfirm,
  onClose,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  const [currentLat, setCurrentLat] = useState(initialLat || MAKASSAR_CENTER_LAT);
  const [currentLng, setCurrentLng] = useState(initialLng || MAKASSAR_CENTER_LNG);
  const [building, setBuilding] = useState('Memuat lokasi…');
  const [fullAddress, setFullAddress] = useState(initialAddress || 'Mengambil alamat…');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Reverse geocoding ketika koordinat peta bergeser
  const updateAddress = useCallback(async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const res = await fetch(`${API_URL}/api/shipping/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = (await res.json()) as {
          building: string;
          road: string;
          area: string;
          fullAddress: string;
        };
        setBuilding(data.building || data.road || 'Lokasi Terpilih');
        setFullAddress(data.fullAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      setBuilding('Titik Lokasi');
      setFullAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setLoadingAddress(false);
    }
  }, []);

  // Inisialisasi peta Leaflet
  useEffect(() => {
    let active = true;
    const startLat = initialLat || MAKASSAR_CENTER_LAT;
    const startLng = initialLng || MAKASSAR_CENTER_LNG;

    import('leaflet').then((L) => {
      if (!active || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 16,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      map.on('move', () => {
        const center = map.getCenter();
        setCurrentLat(center.lat);
        setCurrentLng(center.lng);
      });

      map.on('moveend', () => {
        const center = map.getCenter();
        setCurrentLat(center.lat);
        setCurrentLng(center.lng);
        void updateAddress(center.lat, center.lng);
      });

      mapInstanceRef.current = map;
      void updateAddress(startLat, startLng);
    });

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLat, initialLng, updateAddress]);

  // Tombol GPS untuk geser langsung ke lokasi saat ini
  function handleUseGPS() {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        setCurrentLat(latitude);
        setCurrentLng(longitude);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1 });
        }
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function handleConfirm() {
    onConfirm({
      lat: currentLat,
      lng: currentLng,
      building: building !== 'Memuat lokasi…' ? building : '',
      fullAddress,
    });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tentukan titik di peta"
      className="fixed inset-0 z-50 flex flex-col bg-surface sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[88vh] sm:w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px] sm:shadow-2xl sm:border sm:border-line overflow-hidden"
    >
      {/* Header Bar ala Shopee/Tokopedia */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4 z-20">
        <button
          type="button"
          onClick={onClose}
          aria-label="Kembali"
          className="tap -ml-1 grid size-10 place-items-center rounded-full text-ink hover:bg-sunken"
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <h2 className="text-[16px] font-bold text-ink">Tentukan Titik di Peta</h2>
        <div className="w-9" />
      </div>

      {/* Map Container & Pin View */}
      <div className="relative flex-1 bg-sunken overflow-hidden">
        {/* Leaflet map target */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

        {/* Selected Address Card (Top Overlay ala Shopee) */}
        <div className="pointer-events-none absolute inset-x-4 top-4 z-10">
          <div className="pointer-events-auto rounded-tag border border-line bg-surface/95 p-3.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Alamat yang Dipilih
              </span>
              {loadingAddress && (
                <span className="inline-block size-2 rounded-full bg-brand animate-ping" />
              )}
            </div>
            <p className="mt-1 text-[15px] font-bold text-ink line-clamp-1">{building}</p>
            <p className="mt-0.5 text-[12px] text-muted line-clamp-2 leading-relaxed">
              {fullAddress}
            </p>
          </div>
        </div>

        {/* Center Pin Fixed Marker (Tokopedia / Shopee style) */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
          {/* Tooltip callout di atas pin */}
          <div className="mb-1 flex flex-col items-center animate-bounce duration-1000">
            <span className="rounded-full bg-[#FA5924] px-3 py-1 text-[11px] font-bold text-white shadow-md">
              Alamatmu di sini
            </span>
            <span className="border-4 border-transparent border-t-[#FA5924]" />
          </div>

          {/* Icon Pin Lokasi Merah */}
          <div className="-mt-1 flex flex-col items-center">
            <MapPin size={40} weight="fill" className="text-[#E02626] drop-shadow-md" />
            <div className="size-2 rounded-full bg-black/40 blur-[1px]" />
          </div>
        </div>

        {/* Floating GPS Button (Bottom Right) */}
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={gpsLoading}
          aria-label="Pusatkan ke lokasi saya"
          className="tap absolute right-4 bottom-5 z-10 grid size-12 place-items-center rounded-full border border-line bg-surface text-ink shadow-lg hover:bg-sunken disabled:opacity-50"
        >
          <Crosshair size={22} weight="bold" className={gpsLoading ? 'animate-spin text-brand' : ''} />
        </button>
      </div>

      {/* Footer Confirmation Button */}
      <div className="shrink-0 border-t border-line bg-surface p-4 z-20">
        <button
          type="button"
          onClick={handleConfirm}
          className="btn btn-primary btn-lg w-full text-[15px] font-bold shadow-md"
        >
          Konfirmasi Pin Lokasi
        </button>
      </div>
    </div>
  );
}

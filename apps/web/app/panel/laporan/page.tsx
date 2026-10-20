'use client';

import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle,
  Clock,
  DownloadSimple,
  Package,
  ShoppingBag,
  Storefront,
  TrendUp,
  Truck,
  Wallet,
  WhatsappLogo,
  XCircle,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { formatRupiah } from '@newagung/shared';
import { btnSecondary, PageTitle } from '@/components/panel/PanelShell';
import { adminDownload, adminFetch } from '@/lib/admin';

interface ReportData {
  days: number;
  summary: {
    totalRevenue: number;
    paidOrdersCount: number;
    pendingOrdersCount: number;
    canceledOrdersCount: number;
    totalOrdersCount: number;
    averageOrderValue: number;
  };
  daily: Array<{
    date: string;
    label: string;
    revenue: number;
    ordersCount: number;
  }>;
  topProducts: Array<{
    name: string;
    unit: string;
    totalQty: number;
    totalRevenue: number;
  }>;
  paymentBreakdown: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  fulfilmentBreakdown: Array<{
    fulfilment: string;
    count: number;
    total: number;
  }>;
}

export default function LaporanPenjualanPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<ReportData>(`/reports/sales?days=${d}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  async function handleExport() {
    setExporting(true);
    try {
      await adminDownload(`/reports/export-csv?days=${days}`, `laporan-penjualan-new-agung-${days}hari.csv`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal mengekspor laporan');
    } finally {
      setExporting(false);
    }
  }

  // Cari max revenue harian untuk scaling chart batang CSS
  const maxDailyRev = data?.daily.length
    ? Math.max(...data.daily.map((d) => d.revenue), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Laporan Penjualan & Omzet</PageTitle>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Periode */}
          <div className="flex rounded-tag border border-field bg-surface p-1 text-[13px] font-semibold">
            {[
              { label: '7 Hari', value: 7 },
              { label: '30 Hari', value: 30 },
              { label: '90 Hari', value: 90 },
            ].map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setDays(p.value)}
                className={`rounded px-3 py-1 transition-colors ${
                  days === p.value ? 'bg-brand text-white shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Tombol Ekspor Excel/CSV */}
          <button
            type="button"
            disabled={exporting || loading}
            onClick={handleExport}
            className={`${btnSecondary} text-[13px]`}
          >
            <DownloadSimple size={16} weight="bold" />
            {exporting ? 'Mengunduh…' : 'Ekspor CSV/Excel'}
          </button>
        </div>
      </div>

      {error && <p className="text-danger font-medium">{error}</p>}

      {loading && !data ? (
        <p className="mt-8 text-muted">Menghitung rekap penjualan…</p>
      ) : data ? (
        <>
          {/* 1. Ringkasan Kartu Metrik Utama */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card rounded-[var(--radius-media)] border border-line bg-surface p-4.5 space-y-1">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Total Omzet ({days} Hari)
              </span>
              <p className="price text-[24px] font-extrabold text-brand">
                {formatRupiah(data.summary.totalRevenue)}
              </p>
              <p className="text-[12px] text-muted">Dari {data.summary.paidOrdersCount} pesanan selesai/lunas</p>
            </div>

            <div className="card rounded-[var(--radius-media)] border border-line bg-surface p-4.5 space-y-1">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Rata-rata Transaksi
              </span>
              <p className="price text-[24px] font-extrabold text-ink">
                {formatRupiah(data.summary.averageOrderValue)}
              </p>
              <p className="text-[12px] text-muted">Per pesanan berhasil</p>
            </div>

            <div className="card rounded-[var(--radius-media)] border border-line bg-surface p-4.5 space-y-1">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Pesanan Berhasil
              </span>
              <div className="flex items-baseline gap-2">
                <p className="price text-[24px] font-extrabold text-ok">
                  {data.summary.paidOrdersCount}
                </p>
                <span className="text-[12px] text-muted">/ {data.summary.totalOrdersCount} pesanan masuk</span>
              </div>
              <p className="text-[12px] text-muted">
                {data.summary.pendingOrdersCount} menunggu · {data.summary.canceledOrdersCount} dibatalkan
              </p>
            </div>

            <div className="card rounded-[var(--radius-media)] border border-line bg-surface p-4.5 space-y-1">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Tingkat Penyelesaian
              </span>
              <p className="price text-[24px] font-extrabold text-ink">
                {data.summary.totalOrdersCount > 0
                  ? Math.round((data.summary.paidOrdersCount / data.summary.totalOrdersCount) * 100)
                  : 0}
                %
              </p>
              <p className="text-[12px] text-muted">Rasio pesanan terproses</p>
            </div>
          </div>

          {/* 2. Grafik Batang Tren Omzet Harian (Native CSS Bar Chart) */}
          <div className="card rounded-[var(--radius-media)] border border-line bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <TrendUp size={20} weight="bold" className="text-brand shrink-0" />
                <h2 className="text-[16px] font-bold text-ink">Tren Penjualan Harian</h2>
              </div>
              <span className="text-[12px] text-muted">Waktu Makassar (WITA)</span>
            </div>

            {data.daily.length === 0 ? (
              <p className="py-8 text-center text-muted text-[13px]">
                Belum ada transaksi selesai pada periode ini.
              </p>
            ) : (
              <div className="space-y-2 pt-2">
                <div className="flex h-44 items-end gap-1.5 overflow-x-auto pb-2 scrollbar-none sm:gap-2">
                  {data.daily.map((d) => {
                    const heightPercent = Math.max(6, Math.round((d.revenue / maxDailyRev) * 100));
                    return (
                      <div
                        key={d.date}
                        className="group relative flex flex-1 flex-col items-center justify-end min-w-[28px] h-full"
                      >
                        {/* Tooltip hover */}
                        <div className="pointer-events-none absolute bottom-full mb-1.5 hidden flex-col items-center z-20 group-hover:flex">
                          <div className="rounded bg-ink px-2 py-1 text-[11px] font-medium text-white shadow-md whitespace-nowrap">
                            <p className="font-bold">{d.label}</p>
                            <p>{formatRupiah(d.revenue)}</p>
                            <p className="text-[10px] text-muted">{d.ordersCount} pesanan</p>
                          </div>
                          <span className="border-4 border-transparent border-t-ink" />
                        </div>

                        {/* Batang Chart */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t transition-all ${
                            d.revenue > 0
                              ? 'bg-brand hover:brightness-110'
                              : 'bg-line/40'
                          }`}
                        />
                        <span className="mt-1 text-[10px] text-muted truncate max-w-full">
                          {d.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Dua Kolom: Produk Terlaris & Distribusi Metode Bayar/Kurir */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tabel Produk Terlaris */}
            <div className="card rounded-[var(--radius-media)] border border-line bg-surface p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Package size={20} weight="bold" className="text-brand shrink-0" />
                <h2 className="text-[16px] font-bold text-ink">10 Produk Terlaris</h2>
              </div>

              {data.topProducts.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted">Belum ada data barang terjual.</p>
              ) : (
                <ul className="divide-y divide-line text-[13px]">
                  {data.topProducts.map((p, idx) => (
                    <li key={`${p.name}-${idx}`} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0 pr-3">
                        <p className="font-semibold text-ink truncate">
                          <span className="text-muted font-normal mr-1.5">#{idx + 1}</span>
                          {p.name}
                        </p>
                        <p className="text-[12px] text-muted">
                          Terjual: <b className="text-ink">{p.totalQty}</b> {p.unit}
                        </p>
                      </div>
                      <p className="price font-bold text-ink shrink-0">
                        {formatRupiah(p.totalRevenue)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Breakdown Pembayaran & Pengiriman */}
            <div className="space-y-4">
              {/* Saluran Pembayaran */}
              <div className="card rounded-[var(--radius-media)] border border-line bg-surface p-5 space-y-3">
                <h2 className="text-[15px] font-bold text-ink border-b border-line pb-2.5">
                  Saluran Pembayaran
                </h2>
                <div className="space-y-2 text-[13px]">
                  {data.paymentBreakdown.map((pm) => (
                    <div key={pm.method} className="flex items-center justify-between py-1 border-b border-line/40">
                      <div className="flex items-center gap-2">
                        {pm.method === 'dana' ? (
                          <Wallet size={16} className="text-[#108EE9]" weight="bold" />
                        ) : (
                          <WhatsappLogo size={16} className="text-wa-text" weight="bold" />
                        )}
                        <span className="font-medium text-ink capitalize">
                          {pm.method === 'dana' ? 'DANA Payment Gateway' : 'WhatsApp / Bayar di Toko'}
                        </span>
                        <span className="text-[11px] text-muted">({pm.count} pesanan)</span>
                      </div>
                      <span className="price font-bold text-ink">{formatRupiah(pm.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipe Penerimaan */}
              <div className="card rounded-[var(--radius-media)] border border-line bg-surface p-5 space-y-3">
                <h2 className="text-[15px] font-bold text-ink border-b border-line pb-2.5">
                  Metode Penerimaan Barang
                </h2>
                <div className="space-y-2 text-[13px]">
                  {data.fulfilmentBreakdown.map((f) => (
                    <div key={f.fulfilment} className="flex items-center justify-between py-1 border-b border-line/40">
                      <div className="flex items-center gap-2">
                        {f.fulfilment === 'antar' ? (
                          <Truck size={16} className="text-brand" weight="bold" />
                        ) : (
                          <Storefront size={16} className="text-brand" weight="bold" />
                        )}
                        <span className="font-medium text-ink">
                          {f.fulfilment === 'antar' ? 'Diantar Kurir (Gojek/Grab/Toko)' : 'Ambil Sendiri di Toko'}
                        </span>
                        <span className="text-[11px] text-muted">({f.count} pesanan)</span>
                      </div>
                      <span className="price font-bold text-ink">{formatRupiah(f.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

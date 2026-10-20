import ExcelJS from 'exceljs';

export interface OrderReportRow {
  code: string;
  created_at: string;
  customer_name: string;
  payment_method: string;
  payment_status: string;
  fulfilment: string;
  shipping_courier: string | null;
  status: string;
  estimated_total: number;
}

export async function generateSalesReportXlsx(rows: OrderReportRow[], days: number): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Toko New Agung Makassar';
  wb.lastModifiedBy = 'Admin Panel';
  wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;

  const ws = wb.addWorksheet(`Laporan ${days} Hari`, {
    views: [{ showGridLines: true }],
  });

  const nowStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Makassar',
  }).format(new Date());

  const totalRevenue = rows.reduce((acc, r) => acc + (Number(r.estimated_total) || 0), 0);
  const paidCount = rows.filter((r) => r.payment_status === 'paid' || r.status === 'selesai' || r.status === 'siap').length;
  const totalCount = rows.length;

  // 1. Title Banner
  ws.mergeCells('A1:I1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'TOKO NEW AGUNG MAKASSAR — LAPORAN PENJUALAN';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF282C83' } }; // Brand Navy
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  // 2. Subtitle / Timestamp
  ws.mergeCells('A2:I2');
  const subCell = ws.getCell('A2');
  subCell.value = `Periode: ${days} Hari Terakhir (WITA) · Transaksi Penjualan Sah (Tidak Termasuk Pesanan Batal) · Diunduh pada: ${nowStr}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;

  // 3. Kolom & Header Tabel
  const headers = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Kode Pesanan', key: 'code', width: 18 },
    { header: 'Waktu (WITA)', key: 'time', width: 22 },
    { header: 'Nama Pelanggan', key: 'customer', width: 24 },
    { header: 'Metode Bayar', key: 'payment_method', width: 20 },
    { header: 'Status Bayar', key: 'payment_status', width: 16 },
    { header: 'Pengiriman', key: 'fulfilment', width: 22 },
    { header: 'Status Pesanan', key: 'status', width: 18 },
    { header: 'Total Belanja (Rp)', key: 'total', width: 20 },
  ];

  // Kosongkan baris 3
  ws.getRow(3).height = 10;

  // Header Table di Baris 4
  const headerRow = ws.getRow(4);
  headerRow.height = 26;
  headers.forEach((h, idx) => {
    const colIdx = idx + 1;
    const cell = headerRow.getCell(colIdx);
    cell.value = h.header;
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Dark Slate
    cell.alignment = {
      horizontal: colIdx === 1 || colIdx === 2 || colIdx === 3 || colIdx === 5 || colIdx === 6 || colIdx === 8 ? 'center' : colIdx === 9 ? 'right' : 'left',
      vertical: 'middle',
    };
    ws.getColumn(colIdx).width = h.width;
  });

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  const statusLabelMap: Record<string, string> = {
    baru: 'Pesanan Baru',
    disiapkan: 'Sedang Disiapkan',
    siap: 'Siap Diambil/Kirim',
    selesai: 'Selesai',
    batal: 'Dibatalkan',
  };

  const paymentStatusMap: Record<string, string> = {
    paid: 'Lunas',
    pending: 'Menunggu Bayar',
    failed: 'Gagal',
    expired: 'Kedaluwarsa',
    none: 'Belum Ada',
  };

  // 4. Data Rows
  let curRowIdx = 5;
  rows.forEach((r, idx) => {
    const row = ws.getRow(curRowIdx);
    row.height = 22;

    const timeStr = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Makassar',
    }).format(new Date(r.created_at));

    const courierStr = r.fulfilment === 'antar' ? r.shipping_courier || 'Kurir Pengantaran' : 'Ambil Sendiri di Toko';
    const payMethodStr = r.payment_method === 'dana' ? 'DANA Payment Gateway' : 'WhatsApp / Tunai Toko';
    const payStatusStr = paymentStatusMap[r.payment_status] || r.payment_status;
    const orderStatusStr = statusLabelMap[r.status] || r.status;

    const rowData = [
      idx + 1,
      r.code,
      timeStr,
      r.customer_name,
      payMethodStr,
      payStatusStr,
      courierStr,
      orderStatusStr,
      r.estimated_total,
    ];

    const isZebra = idx % 2 === 1;

    rowData.forEach((val, cIdx) => {
      const colNum = cIdx + 1;
      const cell = row.getCell(colNum);
      cell.value = val;
      cell.font = { name: 'Arial', size: 10, color: { argb: 'FF0F172A' } };
      cell.border = thinBorder;

      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }

      // Alignment
      if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 5 || colNum === 6 || colNum === 8) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNum === 9) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      // Status color styling
      if (colNum === 6) {
        if (r.payment_status === 'paid') {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF15803D' } }; // Green
        } else if (r.payment_status === 'pending') {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFD97706' } }; // Amber
        }
      }
    });

    curRowIdx++;
  });

  // 5. Total Row
  if (rows.length > 0) {
    const totalRow = ws.getRow(curRowIdx);
    totalRow.height = 26;

    ws.mergeCells(`A${curRowIdx}:H${curRowIdx}`);
    const labelTotal = totalRow.getCell(1);
    labelTotal.value = 'TOTAL OMZET PESANAN:';
    labelTotal.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    labelTotal.alignment = { horizontal: 'right', vertical: 'middle' };
    labelTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    labelTotal.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };

    const sumCell = totalRow.getCell(9);
    // Masukkan formula DAN precalculated result agar langsung tampil di Protected View sebelum Enable Editing
    sumCell.value = {
      formula: `SUM(I5:I${curRowIdx - 1})`,
      result: totalRevenue,
    };
    sumCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF282C83' } };
    sumCell.alignment = { horizontal: 'right', vertical: 'middle' };
    sumCell.numFmt = '#,##0';
    sumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    sumCell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

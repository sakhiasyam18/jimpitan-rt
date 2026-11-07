import { VSaldoWarga } from '@/types';
import { formatRupiah } from './format';

/**
 * Membuat berkas Excel (.xls) berformat tabel HTML styling lengkap yang langsung
 * dibuka oleh Microsoft Excel, WPS Office, LibreOffice, atau Google Sheets.
 */
export function unduhExcelLaporan(daftar: VSaldoWarga[], tanggalLabel: string): void {
  const barisHtml = daftar.map((r, i) => {
    const statusTeks = r.saldo < 0
      ? `Kurang ${formatRupiah(-r.saldo)} (${r.minggu_nunggak} minggu)`
      : r.saldo > 0
        ? `Lebih ${formatRupiah(r.saldo)}`
        : 'Pas';

    const bgStatus = r.minggu_nunggak >= 2
      ? '#ffe4e6'
      : r.saldo < 0
        ? '#fef3c7'
        : '#dcfce7';

    const warnaTeks = r.minggu_nunggak >= 2
      ? '#9f1239'
      : r.saldo < 0
        ? '#92400e'
        : '#166534';

    return `
      <tr>
        <td style="text-align:center;mso-number-format:'\\@';">${i + 1}</td>
        <td style="text-align:center;font-weight:bold;mso-number-format:'\\@';">${r.blok}</td>
        <td style="text-align:center;font-weight:bold;mso-number-format:'\\@';">${r.no_rumah}</td>
        <td style="mso-number-format:'\\@';">${r.nama || '-'}</td>
        <td style="text-align:right;mso-number-format:'\\#\\,\\#\\#0';">${r.saldo}</td>
        <td style="background-color:${bgStatus};color:${warnaTeks};font-weight:bold;text-align:center;mso-number-format:'\\@';">${statusTeks}</td>
        <td style="text-align:right;mso-number-format:'\\#\\,\\#\\#0';">${r.setoran_sabtu_ini || 0}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #0f172a; color: #ffffff; padding: 10px 8px; font-size: 14px; border: 1px solid #334155; }
        td { padding: 8px 6px; border: 1px solid #cbd5e1; font-size: 13px; }
        .judul { font-size: 18px; font-weight: bold; margin-bottom: 4px; color: #0f172a; }
        .sub { font-size: 14px; color: #475569; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="judul">LAPORAN JIMPITAN RT 23 RW 6</div>
      <div class="sub">Periode: ${tanggalLabel} · Kelurahan Munggut, Munggut Peni</div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Blok</th>
            <th>No Rumah</th>
            <th>Nama Warga</th>
            <th>Saldo (Rp)</th>
            <th>Status Tunggakan</th>
            <th>Setoran Rekap Ini (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${barisHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Jimpitan_RT23_${tanggalLabel.replace(/[^a-zA-Z0-9]/g, '_')}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Unduh laporan dalam format CSV murni.
 */
export function unduhCsvLaporan(daftar: VSaldoWarga[], tanggalLabel: string): void {
  const baris = [
    ['No', 'Blok', 'No Rumah', 'Nama Warga', 'Saldo', 'Minggu Nunggak', 'Setoran Sabtu Ini']
  ];

  daftar.forEach((r, idx) => {
    baris.push([
      (idx + 1).toString(),
      r.blok || '',
      r.no_rumah || '',
      `"${(r.nama || '').replace(/"/g, '""')}"`,
      r.saldo.toString(),
      r.minggu_nunggak.toString(),
      r.setoran_sabtu_ini.toString(),
    ]);
  });

  const isi = '\uFEFF' + baris.map((b) => b.join(',')).join('\r\n');
  const blob = new Blob([isi], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Jimpitan_RT23_${tanggalLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Unduh template contoh CSV untuk impor warga baru (Opsi A)
 */
export function unduhTemplateWarga(): void {
  const konten = '\uFEFF' + [
    'Blok,Nomor Rumah,Nama',
    'C2,24,BAPAK JOKO',
    'C2,25,IBU SITI'
  ].join('\r\n');

  const blob = new Blob([konten], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_impor_warga.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Unduh template contoh CSV untuk impor riwayat setoran (Opsi B)
 */
export function unduhTemplateSetoran(): void {
  const konten = '\uFEFF' + [
    'Tanggal,Blok,Nomor Rumah,Jumlah',
    '2026-10-24,C2,07,2000',
    '2026-10-24,C2,08,2000'
  ].join('\r\n');

  const blob = new Blob([konten], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_impor_setoran.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

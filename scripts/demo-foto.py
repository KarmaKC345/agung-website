#!/usr/bin/env python3
"""
Foto contoh untuk produk contoh (seed.sql), supaya staging terlihat seperti toko sungguhan.

Sumber: Wikimedia Commons, hanya lisensi bebas (CC0, domain publik, CC BY, CC BY-SA).
Kredit setiap foto dicatat di apps/web/public/produk/KREDIT.md.

  python3 scripts/demo-foto.py cari     # unduh kandidat ke .demo-foto/kandidat/<slug>/
  python3 scripts/demo-foto.py pakai    # olah pilihan (pilihan.json) ke apps/web/public/produk/

Butuh akses ke commons.wikimedia.org dan upload.wikimedia.org, serta Pillow.
Ganti dengan foto asli toko lewat panel begitu tersedia.
"""
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / '.demo-foto'
OUT = ROOT / 'apps' / 'web' / 'public' / 'produk'
UA = 'NewAgungDemo/1.0 (https://newagung.com; toko alat tulis) python-urllib'
API = 'https://commons.wikimedia.org/w/api.php'

# slug -> kata kunci, dari yang paling spesifik ke yang umum
PRODUK = {
    'album-foto-magnetik': ['photo album', 'photo album pages'],
    'bantex-ring-binder-a4': ['ring binder', 'ring binder folder'],
    'buku-ekspedisi-100': ['ledger book', 'notebook hardcover'],
    'buku-tulis-sidu': ['exercise book', 'school notebook'],
    'cat-poster-joyko': ['poster paint', 'gouache paint set'],
    'crayon-titi-12': ['oil pastel crayons', 'wax crayons box'],
    'isi-hekter-joyko-10': ['staples box', 'staple refill'],
    'max-hd10': ['Max stapler', 'small stapler'],
    'casio-mx-12b': ['Casio MX-12', 'Casio desktop calculator'],
    'casio-fx-991id-plus': ['Casio fx-991', 'Casio scientific calculator'],
    'kertas-sidu-a4-70': ['A4 paper ream', 'ream of paper'],
    'kertas-paperone-a4-80': ['copy paper ream', 'printer paper ream'],
    'kertas-origami': ['origami paper', 'colored paper sheets'],
    'joyko-correction-pen': ['correction pen', 'correction fluid pen'],
    'kenko-correction-tape': ['correction tape', 'correction roller'],
    'kotak-pensil-magnet': ['pencil case', 'pencil box'],
    'lem-fox': ['PVA glue bottle', 'white glue bottle'],
    'map-seminar-resleting': ['zipper document bag', 'plastic document folder'],
    'faber-castell-pensil-2b': ['Faber-Castell pencil', 'graphite pencil 2B'],
    'isi-pensil-pentel': ['Pentel Hi-Polymer lead', 'mechanical pencil leads'],
    'pentel-a255': ['Pentel mechanical pencil', 'mechanical pencil'],
    'pentel-energel-bln105': ['Pentel EnerGel', 'gel pen'],
    'snowman-v5-gel': ['gel ink pen', 'gel pen'],
    'standard-ae7': ['ballpoint pen', 'ballpoint pens'],
    'artline-70': ['Artline 70 marker', 'permanent marker'],
    'snowman-board-marker': ['whiteboard marker', 'dry erase marker'],
    'snowman-permanent-marker': ['permanent marker pen', 'marker pen black'],
    'stabilo-boss-original': ['Stabilo Boss', 'highlighter pen'],
    'bantalan-stempel-joyko': ['stamp pad ink', 'ink pad'],
    'kenko-numerator': ['numbering machine', 'number stamp'],
    'joyko-price-labeller': ['price labeller', 'price gun labeler'],
    'tinta-eprint-epson': ['printer ink bottle', 'ink refill bottle'],
}

LISENSI_BEBAS = re.compile(r'^(cc0|public domain|pd|cc by(-sa)? [0-9.]+)', re.I)


def get(url: str) -> bytes:
    """Unduh dengan jeda sopan; coba ulang bila Wikimedia membalas 429 (terlalu banyak permintaan)."""
    for percobaan in range(5):
        time.sleep(1.2)
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or percobaan == 4:
                raise
            time.sleep(10 * (percobaan + 1))
    raise RuntimeError('tidak terjangkau')


def thumb_upload(url: str) -> str:
    """Thumbnail 960px (ukuran standar Wikimedia) lewat upload.wikimedia.org."""
    url = url.split('?')[0].replace('://thumb.wikimedia.org/', '://upload.wikimedia.org/')
    return re.sub(r'/\d+px-', '/960px-', url)


def cari_commons(q: str, n: int = 8) -> list[dict]:
    params = {
        'action': 'query', 'format': 'json', 'generator': 'search', 'gsrnamespace': 6,
        'gsrsearch': f'{q} filetype:bitmap', 'gsrlimit': n, 'prop': 'imageinfo',
        'iiprop': 'url|extmetadata|size|mime', 'iiurlwidth': 960,
    }
    data = json.loads(get(f'{API}?{urllib.parse.urlencode(params)}'))
    hasil = []
    for page in (data.get('query', {}).get('pages', {}) or {}).values():
        info = (page.get('imageinfo') or [{}])[0]
        meta = info.get('extmetadata', {})
        lisensi = meta.get('LicenseShortName', {}).get('value', '')
        if not LISENSI_BEBAS.match(lisensi) or info.get('mime') not in ('image/jpeg', 'image/png'):
            continue
        if min(info.get('width', 0), info.get('height', 0)) < 500:
            continue
        pembuat = re.sub('<[^>]+>', '', meta.get('Artist', {}).get('value', '')).strip() or 'Tidak diketahui'
        hasil.append({
            'judul': page['title'], 'thumb': thumb_upload(info.get('thumburl') or info['url']),
            'halaman': info.get('descriptionurl', ''), 'lisensi': lisensi, 'pembuat': pembuat[:120],
        })
    return hasil


def cari():
    for slug, kunci in PRODUK.items():
        folder = WORK / 'kandidat' / slug
        folder.mkdir(parents=True, exist_ok=True)
        if any(folder.glob('*.jpg')):
            continue  # sudah punya kandidat
        semua = []
        for q in kunci:
            try:
                semua += cari_commons(q)
            except Exception as e:  # noqa: BLE001
                print(f'  ! {slug} "{q}": {e}')
            if len(semua) >= 6:
                break
        for i, k in enumerate(semua[:6]):
            try:
                (folder / f'{i}.jpg').write_bytes(get(k['thumb']))
            except Exception as e:  # noqa: BLE001
                print(f'  ! unduh {k["judul"]}: {e}')
        (folder / 'meta.json').write_text(json.dumps(semua[:6], indent=1, ensure_ascii=False))
        print(f'{slug}: {min(len(semua), 6)} kandidat')


def pakai():
    from PIL import Image, ImageOps

    pilihan = json.loads((WORK / 'pilihan.json').read_text())  # {slug: indeks kandidat}
    OUT.mkdir(parents=True, exist_ok=True)
    kredit = ['# Kredit foto contoh', '',
              'Foto-foto ini hanya contoh untuk staging, dari Wikimedia Commons dengan lisensi bebas.',
              'Ganti dengan foto asli produk toko lewat panel.', '',
              '| Produk | Foto | Pembuat | Lisensi |', '|---|---|---|---|']
    for slug, idx in pilihan.items():
        src = WORK / 'kandidat' / slug / f'{idx}.jpg'
        meta = json.loads((WORK / 'kandidat' / slug / 'meta.json').read_text())[idx]
        img = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        # gaya marketplace: barang utuh di tengah kanvas persegi 800x800 berlatar putih
        img.thumbnail((720, 720), Image.LANCZOS)
        kanvas = Image.new('RGB', (800, 800), (255, 255, 255))
        kanvas.paste(img, ((800 - img.width) // 2, (800 - img.height) // 2))
        kanvas.save(OUT / f'{slug}.webp', 'WEBP', quality=82, method=6)
        kredit.append(f'| `{slug}` | [{meta["judul"]}]({meta["halaman"]}) | {meta["pembuat"]} | {meta["lisensi"]} |')
        print(f'{slug}.webp')
    (OUT / 'KREDIT.md').write_text('\n'.join(kredit) + '\n')


if __name__ == '__main__':
    {'cari': cari, 'pakai': pakai}[sys.argv[1] if len(sys.argv) > 1 else 'cari']()

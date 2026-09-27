# Our Little Love Story ❤️

Game website cinta interaktif yang dibuat dengan HTML, CSS, dan JavaScript vanilla. Game ini bisa dijalankan di browser desktop maupun mobile, tanpa backend, dan dapat dihosting di GitHub Pages maupun Netlify.

## Fitur utama

- Upload foto pribadi, pasangan, foto bersama, dan foto kenangan
- Validasi formulir foto dan nama pengguna
- Narasi cinematic berbasis scene
- Memory journey dengan level cerita
- Mini game "Collect The Love"
- Slideshow foto kenangan
- Surat cinta digital
- Pertanyaan akhir dan ending romantis
- Musik tombol on/off
- Fitur share link aman untuk cerita teks
- Kompatibel untuk HP, tablet, dan desktop

## Struktur folder

```text
love-story-game/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    ├── images/
    │   └── .gitkeep
    └── music/
        └── romantic.mp3
```

## Cara menjalankan di VS Code

1. Buka folder project di VS Code.
2. Pastikan semua file ada di root project.
3. Jalankan local server dengan cara ini:

```bash
cd "c:\Users\raffy\Downloads\Little Love Story"
python -m http.server 8000
```

4. Buka browser dan akses:

```text
http://localhost:8000
```

## Cara upload ke GitHub Pages

1. Buat akun GitHub.
2. Buat repository baru.
3. Upload semua file project ke repository.
4. Buka tab Settings > Pages.
5. Pada Source pilih branch utama (main) dan folder root.
6. Simpan perubahan.
7. GitHub Pages akan memberi link website seperti:

```text
https://username.github.io/nama-repository/
```

8. Buka link dari HP dan bagikan ke orang lain.

## Catatan penting

- Foto diproses di browser. Tidak dikirim ke server dalam versi dasar.
- Game menggunakan link teks untuk membagikan cerita, bukan foto asli.
- Jika foto tidak tersedia di perangkat penerima, mereka dapat mengunggah foto sendiri.
- File musik default di `assets/music/romantic.wav` sudah dibuat secara lokal dan siap diputar di browser. Jika ingin mengganti musik, silakan ganti file tersebut.

## Ganti nama website

Untuk mengganti nama project di browser, edit judul halaman di `index.html`:

```html
<title>Our Little Love Story ❤️</title>
```

## Update proyek

- Ubah design pada `style.css`
- Ubah alur cerita dan scene pada `script.js`
- Ubah struktur halaman pada `index.html`
- Commit dan push ke GitHub untuk memperbarui website GitHub Pages

## Privasi foto

Foto yang dipilih pengguna hanya diproses lokal di browser. Tidak ada upload otomatis ke server dalam versi dasar project ini.

## Catatan musik

Jika file `assets/music/romantic.mp3` belum ada, game tetap berjalan normal dan tombol musik tetap dapat diklik. Browser mungkin memblokir autoplay, jadi musik baru dimulai setelah user menekan tombol mulai atau tombol musik.

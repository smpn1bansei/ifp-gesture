# Kuis Gerak – Media Pembelajaran untuk IFP

Kuis 2 tim (merah vs biru): seret bola tim ke bola jawaban yang benar, dengan **gerakan tangan** (kamera) atau **sentuhan layar**.

## Cara menjalankan
1. Klik dua kali `jalankan.bat` (butuh Python), lalu browser terbuka di `http://localhost:8000`.
   Bisa juga di-hosting di server HTTPS (mis. GitHub Pages). Kamera hanya bisa dipakai di `https://` atau `localhost`.
2. Gunakan Google Chrome / Microsoft Edge. Izinkan akses kamera bila memakai mode Gesture.
3. Mode Gesture butuh internet (library MediaPipe & model tangan dimuat dari CDN). Mode Sentuh tidak butuh kamera.

## Fitur
- **Mode Gesture**: buka 5 jari di dekat bola untuk mengambil, gerakkan untuk menyeret, kepalkan untuk melepas.
- **Mode Sentuh**: sentuh bola tim di layar IFP dan seret ke jawaban (multi-sentuh, dua tim bisa bersamaan).
- Waktu per soal 30–120 detik, jumlah soal 5 / 10 / 15 / semua, nama tim bisa diubah.
- Aturan: *Bonus kecepatan* (poin tambahan bila menjawab cepat) dan *Tim salah dikunci*.
- Saat **dijeda, kamera dimatikan**; kamera aktif lagi saat dilanjutkan. Kuis juga otomatis dijeda bila tab/jendela disembunyikan.
- Tombol **Lewati soal**, layar penuh, suara on/off.
- **Kelola Soal**: tambah/hapus soal sendiri per mapel, sembunyikan soal bawaan, ekspor/impor JSON (untuk dipindah ke perangkat lain).
- Halaman hasil dengan **rekap jawaban** setiap soal.
- Pengaturan terakhir tersimpan otomatis.

Pintasan keyboard: `F` layar penuh · `Spasi`/`P` jeda · `N` lewati soal.

## Mengubah soal bawaan & pengaturan
- Soal bawaan ada di `js/questions.js`.
- Pengaturan teknis (poin, durasi animasi, transparansi kamera, dll.) ada di objek `CONFIG` di awal `js/game.js`.

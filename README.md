# Kuis Gerak – Media Pembelajaran untuk IFP

Kuis 2 tim (merah vs biru) yang dimainkan dengan gerakan tangan di depan kamera.

## Cara menjalankan
1. Klik dua kali `jalankan.bat` (butuh Python), lalu browser akan terbuka di `http://localhost:8000`.
   Bisa juga di-hosting di server HTTPS mana saja (mis. GitHub Pages). Kamera hanya bisa dipakai di `https://` atau `localhost`.
2. Gunakan Google Chrome / Microsoft Edge. Izinkan akses kamera saat diminta.
3. IFP harus terhubung ke internet (library MediaPipe & model tangan dimuat dari CDN).

## Cara bermain
- Pilih mata pelajaran dan waktu per soal, lalu tekan **Mulai Kuis**.
- Buka **telapak tangan (5 jari)** di dekat bola tim untuk mengambilnya, gerakkan untuk menyeret, kepalkan untuk melepas.
- Tabrakkan bola tim ke bola jawaban yang benar. Tim tercepat mendapat +10 poin.
- Jawaban salah → bola jawaban pecah, tim tersebut tidak bisa menjawab lagi di soal itu, dan tim lain mendapat kesempatan.
- Tanpa kamera, bola tetap bisa diseret dengan sentuhan layar / mouse.
- Pintasan keyboard: `F` layar penuh, `Spasi`/`P` jeda.

## Mengubah soal & pengaturan
- Soal ada di `js/questions.js` (format dijelaskan di bagian atas file).
- Pengaturan (jumlah soal, poin, aturan kunci tim salah, transparansi kamera) ada di objek `CONFIG` di awal `js/game.js`.

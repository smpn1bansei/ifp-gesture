@echo off
title Kuis Gerak - Server Lokal
cd /d "%~dp0"
echo Menjalankan Kuis Gerak di http://localhost:8000
echo Tutup jendela ini untuk menghentikan.
start "" http://localhost:8000
python -m http.server 8000

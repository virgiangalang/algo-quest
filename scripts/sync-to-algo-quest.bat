@echo off
setlocal
title Sync Algonova V3 ke algo-quest
echo.
echo === Sync V3 dari math-lesson (sync-algo-quest) ===
echo Folder sekarang:
cd
echo.

REM Pastikan ini repo algo-quest
git remote -v | findstr /i "algo-quest" >nul
if errorlevel 1 (
  echo ERROR: Ini sepertinya BUKAN folder algo-quest.
  echo Buka CMD di folder clone https://github.com/virgiangalang/algo-quest
  echo Lalu jalankan file .bat ini lagi.
  pause
  exit /b 1
)

echo [1/4] Fetch origin...
git fetch origin
if errorlevel 1 goto fail

echo [2/4] Update main lokal...
git checkout main
git pull origin main
if errorlevel 1 goto fail

echo [3/4] Ambil branch sync-algo-quest...
git pull https://github.com/kindoradeveloper/math-lesson.git sync-algo-quest --no-edit
if errorlevel 1 (
  echo.
  echo Merge conflict. Coba resolve otomatis index.html dari sync...
  git checkout --theirs index.html
  git add -A
  git commit -m "merge: sync V3 from math-lesson"
  if errorlevel 1 goto fail
)

echo [4/4] Push ke GitHub algo-quest...
git push origin main
if errorlevel 1 goto fail

echo.
echo BERHASIL. Cek https://algonova-quest.vercel.app/ setelah Vercel deploy.
pause
exit /b 0

:fail
echo.
echo GAGAL. Copy semua teks di jendela ini, kirim ke Cursor.
pause
exit /b 1

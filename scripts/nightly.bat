@echo off
REM BatuOS Nightly Summary — Task Scheduler'dan calistir
REM Her gece 23:55'te tetiklenecek

cd /d C:\Users\USER\batuos
call node scripts\send-nightly-summary.js >> nightly.log 2>&1

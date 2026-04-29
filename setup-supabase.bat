@echo off
cd /d C:\DEV\sandbox\Superpowers-Trial_one
set "PATH=%USERPROFILE%\scoop\shims;%PATH%"
echo.
echo === supabase login (Browser oeffnet sich) ===
supabase login
echo.
echo === supabase link ===
supabase link --project-ref dcqsvquklwjfhmsfpodo
echo.
echo === supabase db push ===
supabase db push
echo.
echo === FERTIG ===
pause

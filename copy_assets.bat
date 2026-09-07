@echo off
echo ========================================================
echo   ASPERUS — Verificacao e Copia de Assets do Projeto
echo ========================================================
echo.

set TARGET_DIR=%~dp0

if exist "%TARGET_DIR%dark-marble.png" (
    echo [OK] Textura dark-marble.png presente.
) else (
    echo [AVISO] dark-marble.png nao encontrado no diretorio raiz.
)

if exist "%TARGET_DIR%hero-cap.jpg" (
    echo [OK] Imagem hero-cap.jpg presente.
) else (
    echo [AVISO] hero-cap.jpg nao encontrado no diretorio raiz.
)

echo.
echo ========================================================
echo   Verificacao concluida com sucesso!
echo ========================================================

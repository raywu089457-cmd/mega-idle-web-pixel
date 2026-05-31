@echo off
chcp 65001 >nul
title Claude Code + MiniMax (Mobile Ready)
echo.
echo ======================================
echo   Claude Code + MiniMax M2.7
echo   Mobile Control Enabled
echo ======================================
echo.

set ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic
set ANTHROPIC_AUTH_TOKEN=sk-cp-15sEaacv9SVM4onFlM8SykW04nvyHwAlWYjz3C6LnZ0Ldj_dqg6sOTEDoWkOfSAy8_LwuYEBuNeNNbs2BwT1LQFyCuC_5TcjExM7AdQxA94B-Hr6Fu2RK5Y
set ANTHROPIC_MODEL=MiniMax-M2.7

cmd /k "cd /d C:\Users\ray\.openclaw\game-studios\projects\mega-idle-web-pixel && happy --remote-control"

@echo off

REM 前端
start powershell -NoExit -Command "npm run dev"

REM Node 后端
start powershell -NoExit -Command "node server\server.js"


REM Python 后端
start cmd /k "call conda activate pest-ai && cd backend && python app.py"


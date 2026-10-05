@echo off
rem ===== 자동 커밋·푸시 v1.0.0 =====
rem 이 파일이 있는 폴더(저장소)의 변경 사항을 한 번에 commit 하고 push 합니다.
rem 사용: 더블클릭 (메시지를 물어봄) 또는  auto-commit.bat "메시지"
chcp 65001 >nul
cd /d "%~dp0"
title 자동 커밋 v1.0.0

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto notrepo

set "CHANGED="
for /f "delims=" %%i in ('git status --porcelain') do set "CHANGED=1"
if not defined CHANGED goto nochange

set "MSG=%~1"
if not defined MSG set /p "MSG=커밋 메시지 (그냥 Enter 누르면 날짜/시간으로 자동 입력): "
if not defined MSG (
  for /f "delims=" %%t in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"') do set "MSG=update %%t"
)
set "MSG=%MSG:"=%"

echo.
echo [1/3] 변경 파일 추가
git add -A
echo [2/3] 커밋: %MSG%
git commit -m "%MSG%"
if errorlevel 1 goto fail
echo [3/3] GitHub에 올리는 중
git push
if errorlevel 1 git push -u origin HEAD
if errorlevel 1 goto pushfail

echo.
echo 완료되었습니다.
goto end

:notrepo
echo 이 폴더는 git 저장소가 아닙니다. 저장소 폴더 안에 이 파일을 두고 실행하세요.
goto end

:nochange
echo 변경된 파일이 없습니다. 올릴 내용이 없어서 종료합니다.
goto end

:fail
echo 커밋에 실패했습니다. 위 오류 메시지를 확인하세요.
goto end

:pushfail
echo 커밋은 되었지만 push에 실패했습니다. 로그인 상태, 인터넷 연결, 원격 저장소 주소를 확인하세요.
echo 원격에 새 변경이 있다면 먼저 git pull 이 필요할 수 있습니다.

:end
echo.
pause

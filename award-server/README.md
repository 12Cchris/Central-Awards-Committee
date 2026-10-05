# 중앙시상위원회 서버 (award-server) v1.0.0

관리자 로그인 확인 + 상장 이미지 그리기를 맡는 작은 서버입니다.
화면(index.html)은 GitHub Pages에 그대로 두고, 이 서버만 Render에 올립니다.

## 올리는 순서

1. 이 폴더 전체를 새 GitHub 저장소(예: `award-server`)에 올립니다. (`fonts` 폴더 포함)
2. https://render.com 에서 **New + → Web Service** → 위 저장소 선택
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
3. **Environment**(환경 변수)에 3개를 넣습니다.
   | 이름 | 값 |
   |---|---|
   | `ADMIN_PASSWORD` | 관리자 비밀번호 (직접 정하세요) |
   | `TOKEN_SECRET` | 아무도 모르는 긴 임의 문자열 (40자 이상) |
   | `ALLOWED_ORIGIN` | 시상위원회 사이트 주소. 예: `https://아이디.github.io` (뒤에 `/`나 경로 없이) |
4. 배포가 끝나면 나오는 주소(예: `https://award-server-xxxx.onrender.com`)를 복사해서,
   `index.html` 맨 위쪽 설정 블록의 `API_URL` 에 붙여넣고 GitHub Pages에 다시 올립니다.

## 알아둘 점

- 무료 플랜은 15분쯤 쓰지 않으면 서버가 잠듭니다. 잠든 뒤 첫 로그인은 최대 1분 걸릴 수 있습니다.
- 비밀번호는 서버 환경 변수에만 있고 코드·화면에는 없습니다. 5번 틀리면 그 IP는 15분간 차단됩니다.
- 로그인하면 12시간 유효한 출입증을 받고, 상장 발급 때마다 서버가 확인합니다. (`TOKEN_SECRET`을 바꾸면 모두 로그아웃)
- 발급 번호(호수)는 지금처럼 브라우저(localStorage)에 저장됩니다. 무료 플랜 서버의 저장 공간은 재시작 때 지워져서 서버에서 번호를 세지 않았습니다.
- 상장 종류(부문·사유)는 index.html 설정 블록에서 고치면 됩니다. 서버는 받은 내용을 그리기만 합니다.

## 내 컴퓨터에서 시험하기

    npm install
    ADMIN_PASSWORD=test1234 npm start
    (Windows PowerShell: $env:ADMIN_PASSWORD="test1234"; npm start)

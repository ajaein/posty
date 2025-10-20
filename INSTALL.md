# 🚀 빠른 시작 가이드

Crypto Mining System을 5분 안에 실행하세요!

---

## ✅ 사전 요구사항

- **Node.js**: 14.0.0 이상
- **npm**: 6.0.0 이상
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)

### Node.js 설치 확인

```bash
node --version
npm --version
```

설치되지 않았다면 [Node.js 공식 사이트](https://nodejs.org/)에서 다운로드하세요.

---

## 📦 설치 단계

### 1️⃣ 프로젝트 다운로드

```bash
# Git으로 클론
git clone https://github.com/your-repo/crypto-mining-system.git

# 또는 ZIP 파일 다운로드 후 압축 해제
```

### 2️⃣ 프로젝트 폴더로 이동

```bash
cd crypto-mining-system
```

### 3️⃣ 의존성 설치

```bash
npm install
```

설치가 완료되면 다음과 같은 패키지들이 설치됩니다:
- express
- crypto-js
- body-parser
- cors
- uuid
- dotenv
- helmet
- express-rate-limit
- validator
- ws
- jsonwebtoken
- compression

### 4️⃣ 환경 변수 설정 (선택사항)

기본 설정으로 바로 실행 가능하지만, 커스터마이징을 원한다면:

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

`.env` 파일을 열어 원하는 값으로 수정하세요:

```env
PORT=3000                    # 원하는 포트 번호
INITIAL_DIFFICULTY=4          # 초기 난이도 (1-10)
MINING_REWARD=50             # 채굴 보상
```

---

## 🎮 실행 방법

### V2 서버 실행 (최신 버전 - 권장)

```bash
npm run start:v2
```

### V1 서버 실행 (기본 버전)

```bash
npm start
```

### 개발 모드 (자동 재시작)

```bash
npm run dev:v2
```

---

## 🌐 접속하기

서버가 시작되면 터미널에 다음과 같이 표시됩니다:

```
✅ 서버가 http://localhost:3000 에서 실행 중입니다
```

브라우저를 열고 주소창에 입력하세요:

```
http://localhost:3000
```

---

## 🎯 첫 채굴 해보기

### 1단계: 채굴자 등록
- 이름 입력 (예: "홍길동")
- "채굴자 등록" 버튼 클릭

### 2단계: 난이도 조절
- 슬라이더로 난이도 설정
- 처음에는 **4** 추천 (약 10-30초 소요)

### 3단계: 채굴 시작
- "블록 채굴 시작" 버튼 클릭
- 채굴이 완료되면 **50 코인** 획득!

### 4단계: 코인 전송
- 다른 주소로 코인 전송 가능
- 트랜잭션은 다음 블록 채굴 시 처리됨

---

## 🐛 문제 해결

### 포트가 이미 사용 중입니다

**에러 메시지:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**해결 방법:**

#### Windows
```bash
# 3000 포트 사용 중인 프로세스 찾기
netstat -ano | findstr :3000

# PID로 프로세스 종료
taskkill /PID [PID번호] /F
```

#### Mac/Linux
```bash
# 3000 포트 사용 중인 프로세스 찾기
lsof -i :3000

# 프로세스 종료
kill -9 [PID번호]
```

**또는 다른 포트 사용:**
```bash
PORT=3001 npm run start:v2
```

---

### npm install 실패

**에러 메시지:**
```
npm ERR! code EINTEGRITY
```

**해결 방법:**
```bash
# 캐시 삭제
npm cache clean --force

# 다시 설치
npm install
```

---

### 모듈을 찾을 수 없습니다

**에러 메시지:**
```
Error: Cannot find module 'express'
```

**해결 방법:**
```bash
# node_modules 폴더 삭제 후 재설치
rm -rf node_modules
npm install
```

---

### 브라우저에서 연결 안 됨

**체크리스트:**

1. **서버가 실행 중인가?**
   ```bash
   # 터미널에서 확인
   ```

2. **올바른 주소로 접속했나?**
   ```
   http://localhost:3000
   ```

3. **방화벽 설정 확인**
   - Windows Defender 방화벽 설정
   - 포트 3000 허용

4. **브라우저 캐시 삭제**
   - Ctrl + Shift + Delete (Windows)
   - Cmd + Shift + Delete (Mac)

---

## 💻 시스템 요구사항

### 최소 사양
- CPU: 1GHz 이상
- RAM: 512MB 이상
- 디스크: 50MB 여유 공간

### 권장 사양
- CPU: 2GHz 이상
- RAM: 2GB 이상
- 디스크: 1GB 여유 공간

---

## 📱 브라우저 호환성

| 브라우저 | 최소 버전 | 권장 버전 |
|---------|----------|----------|
| Chrome | 90+ | 최신 버전 |
| Firefox | 88+ | 최신 버전 |
| Safari | 14+ | 최신 버전 |
| Edge | 90+ | 최신 버전 |

---

## 🔧 고급 설정

### 다른 컴퓨터에서 접속하기

**1. 서버 컴퓨터의 IP 주소 확인**

Windows:
```bash
ipconfig
```

Mac/Linux:
```bash
ifconfig
```

**2. .env 파일 수정**
```env
ALLOWED_ORIGINS=http://192.168.0.100:3000
```

**3. 다른 컴퓨터에서 접속**
```
http://192.168.0.100:3000
```

---

### 프로덕션 배포

**1. 환경 변수 설정**
```env
NODE_ENV=production
JWT_SECRET=매우-복잡한-비밀키-생성하기
```

**2. PM2로 실행 (권장)**
```bash
# PM2 설치
npm install -g pm2

# 서버 시작
pm2 start server-v2.js --name "crypto-mining"

# 자동 시작 설정
pm2 startup
pm2 save
```

**3. Nginx 리버스 프록시 설정**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📚 다음 단계

설치가 완료되었나요? 이제 다음을 확인해보세요:

1. **README-V2.md** - 전체 기능 및 API 문서
2. **CHANGELOG.md** - 버전별 변경사항
3. **API 테스트** - Postman이나 curl로 API 호출
4. **코드 살펴보기** - blockchain/ 폴더의 핵심 로직

---

## 🆘 도움이 필요하신가요?

- 📖 [전체 문서](README-V2.md)
- 🐛 [버그 리포트](https://github.com/your-repo/issues)
- 💬 [디스코드 커뮤니티](https://discord.gg/your-invite)
- 📧 [이메일 문의](mailto:support@example.com)

---

## ✅ 설치 완료 체크리스트

- [ ] Node.js 설치됨
- [ ] 프로젝트 다운로드됨
- [ ] npm install 성공
- [ ] 서버 실행 성공
- [ ] 브라우저에서 접속 성공
- [ ] 첫 블록 채굴 성공

모두 완료하셨나요? 축하합니다! 🎉

---

<div align="center">

**즐거운 채굴 되세요!** ⛏️💎

[처음으로](#-빠른-시작-가이드) | [README](README-V2.md) | [GitHub](https://github.com/your-repo)

</div>


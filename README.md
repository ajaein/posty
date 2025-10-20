# ⛏️ Posty Mining System V3.0

**차세대 블록체인 플랫폼 - Express 기반 암호화폐 채굴 시스템**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

🔗 **GitHub Repository**: [https://github.com/ajaein/posty](https://github.com/ajaein/posty)

---

## 🌟 주요 기능

### ✅ 완료된 기능

#### 🔐 **보안 & 인증**
- ✨ **회원가입/로그인 시스템**
  - bcryptjs 기반 비밀번호 암호화
  - JWT 토큰 인증
  - 자동 로그인 & 세션 검증
  - 토큰 만료 시 자동 로그아웃
- 🔒 JWT 기반 인증 시스템
- 💼 RSA 서명 지갑 시스템
- 🛡️ Rate Limiting (채굴 요청 제한)
- 🔐 Helmet 보안 헤더

#### ⛏️ **블록체인 & 채굴**
- ⛓️ 완전한 블록체인 구현 (SHA-256)
- 🔨 Proof of Work (PoW) 합의 알고리즘
- 📉 채굴 보상 반감기 시스템
- 🎯 동적 난이도 조정 (현재: 난이도 6)
- 🔄 트랜잭션 풀 관리
- ✅ 블록체인 무결성 검증

#### 💰 **경제 시스템**
- 📊 **실시간 가격 추적**
  - 24시간 변화율 계산
  - 시가총액 자동 계산
  - 가격 시뮬레이션 (±2% 변동성)
- 💸 트랜잭션 시스템
- 💵 잔액 관리
- 🚫 이중 지불 방지

#### 👥 **사용자 관리**
- 📝 **JSON 기반 사용자 데이터베이스**
  - 이메일/비밀번호 기반 인증
  - 사용자 프로필 관리
  - 자동 지갑 생성
- 👤 채굴자 등록 및 관리
- 🏆 채굴자 순위 시스템
- 📈 개인 채굴 통계

#### 🎨 **UI/UX**
- 🌓 다크/라이트 모드
- 📱 모바일 반응형 디자인
- 🎯 모던 UI/UX (모바일 앱 스타일)
- 🔔 실시간 토스트 알림
- 📊 Chart.js 가격 차트
- 🎨 Font Awesome 아이콘

#### 🔄 **실시간 기능**
- 📡 WebSocket 실시간 업데이트
- ⚡ 가격 데이터 브로드캐스트
- 🔄 자동 데이터 갱신

---

## 🚀 시작하기

### 📋 사전 요구사항

- Node.js >= 14.0.0
- npm 또는 yarn

### 📦 설치

```bash
# 저장소 클론
git clone https://github.com/ajaein/posty.git
cd posty

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 서버 실행
npm start
```

서버가 실행되면 `http://localhost:3000`에서 접속 가능합니다.

---

## 🔧 환경 변수

`.env` 파일을 생성하여 다음 변수를 설정할 수 있습니다:

```env
PORT=3000
NODE_ENV=development

# 블록체인 설정
INITIAL_DIFFICULTY=6
MINING_REWARD=50
MAX_DIFFICULTY=10

# 보안 설정
JWT_SECRET=your-secret-key-change-in-production
API_RATE_LIMIT=100
RATE_LIMIT_WINDOW=15

# CORS 설정
ALLOWED_ORIGINS=http://localhost:3000

# 로그 레벨
LOG_LEVEL=info
```

---

## 📡 API 엔드포인트

### 🔐 인증 API

#### 회원가입
```http
POST /api/user/register
Content-Type: application/json

{
  "username": "사용자명",
  "email": "user@example.com",
  "password": "password123"
}
```

#### 로그인
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 내 정보 조회
```http
GET /api/user/me
Authorization: Bearer {token}
```

### ⛏️ 블록체인 API

#### 블록체인 정보 조회
```http
GET /api/blockchain
```

#### 전체 체인 조회 (페이지네이션)
```http
GET /api/chain?page=1&limit=10
```

#### 특정 블록 조회
```http
GET /api/block/:index
```

#### 블록 채굴 (인증 필요)
```http
POST /api/mine
Authorization: Bearer {token}
```

#### 트랜잭션 생성
```http
POST /api/transaction
Content-Type: application/json

{
  "from": "발신자_주소",
  "to": "수신자_주소",
  "amount": 10
}
```

### 💰 가격 & 통계 API

#### 가격 데이터 조회
```http
GET /api/price
```

#### 시스템 통계 조회
```http
GET /api/stats
```

#### 잔액 조회
```http
GET /api/balance/:address
```

#### 채굴자 목록
```http
GET /api/miners
```

---

## 🛠️ 기술 스택

### Backend
- **Express.js** - 웹 프레임워크
- **crypto-js** - 암호화 (SHA-256)
- **bcryptjs** - 비밀번호 해싱
- **jsonwebtoken** - JWT 인증
- **ws** - WebSocket 실시간 통신
- **helmet** - 보안 헤더
- **express-rate-limit** - Rate Limiting
- **validator** - 입력 검증
- **compression** - 응답 압축

### Frontend
- **Vanilla JavaScript** - 순수 자바스크립트
- **Chart.js** - 가격 차트
- **Font Awesome** - 아이콘
- **CSS3** - 모던 스타일링

### 데이터베이스
- **JSON 기반 파일 시스템** - 사용자 데이터 (간단하고 배포 용이)

---

## 📊 프로젝트 구조

```
posty/
├── blockchain/          # 블록체인 코어
│   ├── Block.js         # 블록 클래스
│   └── Blockchain.js    # 블록체인 클래스
├── models/              # 데이터 모델
│   ├── Wallet.js        # 지갑 시스템
│   ├── TransactionPool.js  # 트랜잭션 풀
│   ├── UserDatabase.js  # 사용자 DB
│   └── PriceTracker.js  # 가격 추적기
├── middleware/          # 미들웨어
│   ├── auth.js          # JWT 인증
│   └── security.js      # 보안 미들웨어
├── config/              # 설정 파일
│   └── config.js        # 환경 설정
├── utils/               # 유틸리티
│   ├── crypto.js        # 암호화 도구
│   └── logger.js        # 로거
├── public/              # 정적 파일
│   ├── index.html       # 메인 페이지
│   ├── css/
│   │   └── style.css    # 스타일시트
│   └── js/
│       └── app.js       # 클라이언트 스크립트
├── data/                # 데이터 저장소 (gitignore)
│   └── users.json       # 사용자 데이터
├── server.js            # 메인 서버
└── package.json         # 의존성 관리
```

---

## 🎯 사용 방법

### 1️⃣ 회원가입 & 로그인
1. 오른쪽 상단 "회원가입" 버튼 클릭
2. 사용자명, 이메일, 비밀번호 입력
3. 자동으로 지갑이 생성됩니다
4. 로그인하면 자동으로 세션이 유지됩니다

### 2️⃣ 채굴 시작
1. 로그인 후 "채굴 시작" 버튼 클릭
2. 블록 채굴 완료 시 보상 지급 (현재: 50 POSTY)
3. 난이도 6 기준으로 해시 연산 수행
4. Rate Limiting: 1분당 최대 10회

### 3️⃣ 가격 모니터링
- 현재 가격, 24시간 변화율, 시가총액을 실시간으로 확인
- 가격은 3초마다 자동 업데이트 (±2% 변동)
- 차트로 가격 추이 시각화

### 4️⃣ 블록체인 탐색
- 최근 블록 목록 확인
- 각 블록의 해시, 타임스탬프, 채굴자 정보 조회
- 체인 무결성 검증

---

## 🔒 보안 기능

### ✅ 구현된 보안 기능
- ✨ **비밀번호 암호화**: bcryptjs (10 rounds salting)
- 🔐 **JWT 인증**: 토큰 기반 stateless 인증
- 🔑 **자동 세션 검증**: 페이지 로드 시 토큰 유효성 확인
- 🚪 **자동 로그아웃**: 401 응답 시 자동 로그아웃
- 🛡️ **Helmet**: 보안 HTTP 헤더
- ⏱️ **Rate Limiting**: 채굴 요청 제한 (1분당 10회)
- ✅ **입력 검증**: validator 라이브러리
- 🔒 **XSS 방지**: 입력 sanitization
- 🌐 **CORS 설정**: 허용된 도메인만 접근

### 🔐 비밀번호 정책
- 최소 6자 이상
- 비밀번호는 bcryptjs로 해싱되어 저장
- 원본 비밀번호는 저장되지 않음

---

## 🌐 배포

### Render 배포

1. GitHub 저장소 연결
2. 빌드 명령: `npm install`
3. 시작 명령: `npm start`
4. 환경 변수 설정 (위의 환경 변수 섹션 참조)

### 다른 플랫폼
- Railway
- Fly.io
- Heroku
- DigitalOcean
- Netlify (Functions)

---

## 📈 로드맵

### 🔜 계획된 기능
- [ ] 스마트 컨트랙트 (EVM 호환)
- [ ] 거래소 (주문장, 매칭 엔진)
- [ ] 스테이킹 (다중 풀, APR)
- [ ] DeFi (AMM, 유동성 풀)
- [ ] NFT 마켓플레이스
- [ ] DAO 거버넌스
- [ ] AI 트레이딩 봇
- [ ] P2P 네트워크
- [ ] TradingView 차트
- [ ] 모바일 앱

---

## 🐛 문제 해결

### ERR_CONNECTION_REFUSED
```bash
# 서버가 실행 중인지 확인
npm start

# 포트 3000이 사용 중인지 확인
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux
```

### Rate Limiting 429 오류
- 채굴 요청은 1분당 최대 10회로 제한됩니다
- 다른 API는 제한 없음

### 로그인 세션 문제
- 브라우저 콘솔에서 로그인 상태 확인: `🔐 로그인 상태` 로그
- LocalStorage 확인: `authToken`, `currentMiner`
- 토큰이 만료되면 자동으로 로그아웃됩니다

---

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

MIT License - 자유롭게 사용하세요!

---

## 👨‍💻 개발자

**Posty Team**

- GitHub: [@ajaein](https://github.com/ajaein)
- Repository: [posty](https://github.com/ajaein/posty)

---

## 📞 지원

문제가 있으신가요? [이슈를 등록](https://github.com/ajaein/posty/issues)해주세요!

---

**⛏️ Happy Mining! 💎**

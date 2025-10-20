# ⛏️ Posty Mining System V2.1

**프로페셔널급 POSTY 코인 블록체인 채굴 시스템** - Express.js + WebSocket + JWT

<div align="center">

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

</div>

---

## 🌟 Posty Coin이란?

**POSTY**는 교육용 블록체인 기반 암호화폐입니다. 실제 블록체인 기술을 구현하여 채굴, 전송, 지갑 관리 등의 핵심 기능을 제공합니다.

### 💎 주요 특징

- ✅ **작업 증명 (PoW)** - SHA-256 기반 채굴 알고리즘
- ✅ **반감기 시스템** - 210 블록마다 보상 절반으로 감소
- ✅ **JWT 인증** - 안전한 사용자 인증
- ✅ **지갑 시스템** - RSA 공개키/개인키 암호화
- ✅ **실시간 업데이트** - WebSocket 기반
- ✅ **모던 UI** - 모바일 앱 스타일 인터페이스

---

## 🚀 빠른 시작

### 1️⃣ 설치

```bash
npm install
```

### 2️⃣ 실행

```bash
npm start
```

### 3️⃣ 접속

브라우저에서 `http://localhost:3000` 접속

---

## 📦 기술 스택

### Backend
- **Node.js** 14+
- **Express.js** - 웹 서버
- **WebSocket (ws)** - 실시간 통신
- **JWT** - 인증
- **crypto-js** - 암호화
- **Helmet** - 보안 헤더
- **Rate Limiting** - DoS 방어

### Frontend
- **Vanilla JavaScript** (ES6+)
- **CSS3** (Grid, Flexbox, Animations)
- **Font Awesome** 6
- **WebSocket API**

---

## 🎮 사용 방법

### 1. 채굴자 등록
- 이름 입력 후 "채굴자 등록" 클릭
- 자동으로 지갑 생성 및 JWT 토큰 발급

### 2. 블록 채굴
- 난이도 조절 (1-6 권장)
- "블록 채굴 시작" 클릭
- 보상 획득 (POSTY 코인)

### 3. POSTY 전송
- 수신자 주소 입력
- 전송할 POSTY 수량 입력
- "전송하기" 클릭

---

## 💰 반감기 시스템

비트코인과 유사한 반감기 메커니즘:

| 블록 범위 | 보상 (POSTY) |
|-----------|-------------|
| 0 - 209 | 50 |
| 210 - 419 | 25 |
| 420 - 629 | 12.5 |
| 630 - 839 | 6.25 |
| ... | ... |

---

## 🔒 보안 기능

### JWT 인증
- 로그인 시 토큰 발급
- 모든 채굴/거래 요청 시 검증

### Rate Limiting
- API: 100 요청/15분
- 채굴: 20 요청/5분

### 입력 검증
- XSS 방지
- SQL Injection 방어
- 데이터 타입 검증

### RSA 암호화
- 2048비트 키 쌍 생성
- 트랜잭션 서명 및 검증

---

## 📡 API 엔드포인트

### 인증
```
POST /api/auth/login       - 로그인 (채굴자 등록)
POST /api/auth/refresh     - 토큰 갱신
```

### 지갑
```
GET  /api/wallet/me        - 내 지갑 조회 (인증 필요)
POST /api/wallet/send      - POSTY 전송 (인증 필요)
GET  /api/wallet/export    - 지갑 백업 (인증 필요)
```

### 블록체인
```
GET  /api/health           - 서버 상태
GET  /api/blockchain       - 블록체인 정보
GET  /api/chain            - 전체 체인 (페이지네이션)
GET  /api/block/:index     - 특정 블록 조회
POST /api/mine             - 블록 채굴 (인증 필요)
POST /api/transaction      - 트랜잭션 생성
GET  /api/transactions/pending  - 대기 트랜잭션
GET  /api/balance/:address - 잔액 조회
GET  /api/stats            - 시스템 통계
```

### 설정
```
POST /api/difficulty       - 난이도 변경
GET  /api/validate         - 체인 검증
```

### 내보내기
```
GET  /api/export/blockchain  - CSV 내보내기 (블록체인)
GET  /api/export/miners      - CSV 내보내기 (채굴자)
```

---

## 🏗️ 프로젝트 구조

```
posty-mining-system/
├── blockchain/
│   ├── Block.js              # 블록 클래스
│   └── Blockchain.js         # 블록체인 (반감기 적용)
├── config/
│   └── config.js             # 환경 설정
├── middleware/
│   ├── auth.js               # JWT 인증
│   └── security.js           # 보안 미들웨어
├── models/
│   ├── TransactionPool.js    # 트랜잭션 풀
│   └── Wallet.js             # 지갑 시스템
├── utils/
│   ├── crypto.js             # RSA 암호화
│   └── logger.js             # 로깅 시스템
├── public/
│   └── index.html            # 웹 UI
├── logs/                     # 로그 파일
├── server.js                 # Express 서버
├── package.json
├── .env.example              # 환경 변수 예제
└── README.md
```

---

## ⚙️ 환경 변수

`.env` 파일 생성:

```env
PORT=3000
NODE_ENV=development

INITIAL_DIFFICULTY=4
MINING_REWARD=50
HALVING_INTERVAL=210

JWT_SECRET=your-secret-key-change-this
API_RATE_LIMIT=100
RATE_LIMIT_WINDOW=15

ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
```

---

## 🎨 디자인 특징

### 모바일 앱 스타일
- 깔끔한 카드 레이아웃
- 부드러운 애니메이션
- 직관적인 인터페이스

### 다크모드
- 눈의 피로 감소
- 자동 테마 저장
- 원클릭 전환

### 반응형
- 스마트폰 (320px+)
- 태블릿 (768px+)
- 데스크톱 (1024px+)

---

## 📊 실시간 기능

### WebSocket
- 새 블록 채굴 시 즉시 알림
- 트랜잭션 추가 실시간 반영
- 난이도 변경 자동 업데이트

### 토스트 알림
- 성공/에러 메시지
- 자동 사라짐
- 부드러운 애니메이션

---

## 🧪 테스트 시나리오

### 기본 채굴
```
1. 채굴자 "Alice" 등록
2. 난이도 4로 설정
3. 블록 채굴 → 50 POSTY 획득
4. 잔액 확인
```

### POSTY 전송
```
1. Alice가 Bob에게 20 POSTY 전송
2. Bob 등록 후 블록 채굴
3. 트랜잭션 처리
4. Alice: 30 POSTY, Bob: 70 POSTY
```

### 반감기 테스트
```
1. 210개 블록 채굴
2. 보상이 50 → 25로 감소 확인
3. 다시 210개 블록 채굴
4. 보상이 25 → 12.5로 감소 확인
```

---

## 🎯 난이도 가이드

| 난이도 | 예상 시간 | 해시 패턴 | 권장 용도 |
|--------|----------|----------|----------|
| 1 | < 1초 | 0... | 빠른 테스트 |
| 2 | 1-3초 | 00... | 기본 테스트 |
| 3 | 3-10초 | 000... | 데모 |
| 4 | 10-30초 | 0000... | **권장** |
| 5 | 30-120초 | 00000... | 실습 |
| 6 | 2-5분 | 000000... | 고급 |

---

## 🚨 문제 해결

### 채굴이 너무 느려요
→ 난이도를 1-3으로 낮추세요

### WebSocket 연결 안 돼요
→ 방화벽 설정 확인 및 포트 3000 개방

### Rate Limit 에러
→ 15분 기다린 후 다시 시도

### 잔액 부족
→ 먼저 채굴로 POSTY 획득 필요

---

## 📱 브라우저 지원

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ 모바일 브라우저

---

## 🌐 데모

**GitHub**: https://github.com/ajaein/posty

---

## 🤝 기여 방법

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 라이센스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

---

## 🎓 학습 목적

이 프로젝트는 블록체인 기술을 학습하기 위한 교육용 프로젝트입니다.

**학습 내용:**
- 블록체인 구조
- 작업 증명 (PoW)
- 암호화 및 보안
- JWT 인증
- WebSocket 실시간 통신
- RESTful API

---

## 📞 지원

- 🐛 Bug Report: [GitHub Issues](https://github.com/ajaein/posty/issues)
- 💡 Feature Request: [GitHub Issues](https://github.com/ajaein/posty/issues)

---

<div align="center">

**Made with ❤️ for learning blockchain technology**

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!

**POSTY Coin** - 차세대 교육용 블록체인 플랫폼

</div>

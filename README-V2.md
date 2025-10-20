# ⛏️ Crypto Mining System V2.0

**프로페셔널급 블록체인 암호화폐 채굴 시스템** - Express.js + WebSocket

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

</div>

---

## 🌟 V2.0 주요 업그레이드

### 🔒 보안 강화
- ✅ **Rate Limiting** - API 요청 제한 (DoS 방어)
- ✅ **Helmet.js** - 보안 헤더 자동 설정
- ✅ **입력 검증** - XSS, SQL Injection 방어
- ✅ **트랜잭션 서명** - RSA 공개키/개인키 암호화
- ✅ **CORS 강화** - 허용된 도메인만 접근
- ✅ **에러 핸들링** - 안전한 에러 메시지 처리

### 🎨 디자인 혁신
- ✅ **모바일 앱 스타일** - 깔끔하고 현대적인 UI
- ✅ **다크모드** - 눈의 피로를 줄이는 테마 전환
- ✅ **부드러운 애니메이션** - 프리미엄 사용자 경험
- ✅ **반응형 디자인** - 모든 기기에서 완벽한 표시
- ✅ **토스트 알림** - 실시간 사용자 피드백
- ✅ **그라디언트 & 아이콘** - 시각적 매력 극대화

### 🚀 기능 확장
- ✅ **WebSocket 실시간 업데이트** - 즉각적인 데이터 동기화
- ✅ **페이지네이션** - 대량 데이터 효율적 처리
- ✅ **블록 검색** - 해시로 블록 찾기
- ✅ **트랜잭션 히스토리** - 주소별 거래 내역
- ✅ **CSV 내보내기** - 데이터 분석 지원
- ✅ **고급 통계** - 시스템 메모리, 업타임 등
- ✅ **로깅 시스템** - 파일 기반 로그 관리

### ⚙️ 시스템 개선
- ✅ **환경 변수** - .env 기반 설정 관리
- ✅ **모듈화** - 코드 구조 개선
- ✅ **압축** - 응답 데이터 압축으로 성능 향상
- ✅ **Graceful Shutdown** - 안전한 서버 종료

---

## 📦 설치 방법

### 1️⃣ 의존성 설치

```bash
npm install
```

### 2️⃣ 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 필요한 값을 수정하세요:

```bash
cp .env.example .env
```

### 3️⃣ 서버 실행

#### V2 서버 (최신 버전 - 권장)
```bash
# 일반 모드
npm run start:v2

# 개발 모드 (자동 재시작)
npm run dev:v2
```

#### V1 서버 (기본 버전)
```bash
npm start
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

---

## 🎮 사용 방법

### 웹 인터페이스

1. **브라우저 접속**: `http://localhost:3000`
2. **채굴자 등록**: 이름 입력 후 등록
3. **난이도 조절**: 슬라이더로 1-6 설정 (데모는 4 권장)
4. **채굴 시작**: "블록 채굴 시작" 버튼 클릭
5. **코인 전송**: 다른 주소로 코인 전송
6. **실시간 확인**: WebSocket으로 자동 업데이트

### 특별 기능

#### 🌓 다크모드
우측 상단 버튼으로 라이트/다크 테마 전환 가능

#### 📊 CSV 내보내기
- 블록체인: `http://localhost:3000/api/export/blockchain`
- 채굴자: `http://localhost:3000/api/export/miners`

#### 🔍 블록 검색
특정 해시로 블록 찾기:
```bash
GET /api/search/block/:hash
```

#### 📜 트랜잭션 히스토리
주소별 거래 내역 조회:
```bash
GET /api/transactions/history/:address
```

---

## 📚 API 문서

### 🔐 보안 관련
| 엔드포인트 | 설명 | Rate Limit |
|-----------|------|-----------|
| `POST /api/miner/register` | 채굴자 등록 | 100/15분 |
| `POST /api/mine` | 블록 채굴 | 20/5분 |
| `POST /api/transaction` | 트랜잭션 생성 | 100/15분 |

### 📊 조회 API
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/health` | 서버 상태 확인 |
| `GET /api/blockchain` | 블록체인 정보 |
| `GET /api/chain?page=1&limit=10` | 전체 체인 (페이지네이션) |
| `GET /api/block/:index` | 특정 블록 조회 |
| `GET /api/search/block/:hash` | 블록 검색 |
| `GET /api/miner/:minerId` | 채굴자 정보 |
| `GET /api/miners` | 모든 채굴자 |
| `GET /api/transactions/pending` | 대기 트랜잭션 |
| `GET /api/transactions/history/:address` | 트랜잭션 히스토리 |
| `GET /api/balance/:address` | 잔액 조회 |
| `GET /api/balances` | 모든 잔액 |
| `GET /api/stats` | 시스템 통계 (확장) |
| `GET /api/validate` | 체인 검증 |

### ⚙️ 설정 API
| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/difficulty` | 난이도 변경 |

### 📥 내보내기 API
| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/export/blockchain` | CSV 내보내기 (블록체인) |
| `GET /api/export/miners` | CSV 내보내기 (채굴자) |

---

## 🏗️ 프로젝트 구조

```
crypto-mining-system/
├── blockchain/
│   ├── Block.js              # 블록 클래스
│   └── Blockchain.js         # 블록체인 클래스
├── config/
│   └── config.js             # 환경 설정
├── middleware/
│   └── security.js           # 보안 미들웨어
├── utils/
│   ├── crypto.js             # 암호화 유틸리티
│   └── logger.js             # 로깅 시스템
├── public/
│   ├── index.html            # V1 웹 UI
│   └── index-v2.html         # V2 웹 UI (최신)
├── logs/                     # 로그 파일 디렉토리
├── server.js                 # V1 서버
├── server-v2.js              # V2 서버 (최신)
├── package.json
├── .env.example              # 환경 변수 예제
├── .env                      # 환경 변수 (git 제외)
├── .gitignore
├── README.md                 # 기본 문서
└── README-V2.md              # V2 문서 (이 파일)
```

---

## 🔒 보안 기능 상세

### Rate Limiting
```javascript
// API 전체: 15분당 100 요청
// 채굴: 5분당 20 요청
```

### 입력 검증
- 이름: 2-50자, HTML 태그 차단
- 금액: 0 ~ 1,000,000 코인
- 난이도: 1 ~ 10

### 트랜잭션 서명 (선택)
```javascript
// RSA 2048 비트 키 쌍 생성
// SHA-256 해시 서명
// 공개키로 검증
```

---

## 🎨 디자인 시스템

### 색상 팔레트
```css
Primary: #6366f1 (인디고)
Secondary: #8b5cf6 (보라)
Success: #10b981 (초록)
Warning: #f59e0b (주황)
Danger: #ef4444 (빨강)
```

### 테마
- **라이트 모드**: 밝고 깔끔한 화이트 베이스
- **다크 모드**: 눈의 피로를 줄이는 다크 그레이

### 애니메이션
- 페이드 인/아웃
- 슬라이드 업
- 펄스 효과
- 호버 트랜지션

---

## 📊 성능 최적화

### 압축
- Gzip 압축으로 응답 크기 감소

### 페이지네이션
- 블록 조회 시 페이지당 10개 제한

### WebSocket
- 불필요한 폴링 제거
- 실시간 데이터 푸시

### 캐싱 전략
- 정적 파일 브라우저 캐싱

---

## 🧪 테스트 시나리오

### 1. 기본 채굴 플로우
```
1. 채굴자 등록 → "Alice"
2. 난이도 4로 설정
3. 블록 채굴 → 50 코인 획득
4. 잔액 확인 → 50 코인
```

### 2. 트랜잭션 플로우
```
1. Alice가 Bob에게 20 코인 전송
2. Bob 등록 후 블록 채굴
3. 트랜잭션 처리됨
4. Alice: 30 코인, Bob: 70 코인
```

### 3. 실시간 업데이트
```
1. 브라우저 2개 오픈
2. 한쪽에서 채굴 시작
3. 다른 쪽에서 실시간 업데이트 확인
```

---

## 🔧 환경 변수 설명

```bash
# 서버 포트
PORT=3000

# 개발/프로덕션 모드
NODE_ENV=development

# 초기 채굴 난이도 (1-10)
INITIAL_DIFFICULTY=4

# 채굴 보상 (코인)
MINING_REWARD=50

# 최대 난이도
MAX_DIFFICULTY=10

# JWT 비밀키 (반드시 변경!)
JWT_SECRET=your-secret-key

# API Rate Limit (요청/창)
API_RATE_LIMIT=100
RATE_LIMIT_WINDOW=15

# CORS 허용 도메인
ALLOWED_ORIGINS=http://localhost:3000

# 로그 레벨
LOG_LEVEL=info
```

---

## 📈 통계 및 모니터링

### 시스템 통계
```javascript
{
  "uptime": "서버 가동 시간",
  "memory": "메모리 사용량",
  "totalBlocksMined": "전체 채굴 블록 수",
  "totalTransactions": "전체 트랜잭션 수",
  "averageMiningTime": "평균 채굴 시간"
}
```

### 로그 파일
```
logs/
  └── app-2024-01-20.log
```

---

## 🚨 문제 해결

### 채굴이 너무 느려요
```
→ 난이도를 1-3으로 낮추세요
→ 난이도 6 이상은 1분 이상 소요됩니다
```

### WebSocket 연결 안 돼요
```
→ 방화벽 설정 확인
→ 포트 3000이 열려있는지 확인
→ 브라우저 콘솔에서 에러 메시지 확인
```

### Rate Limit 에러
```
→ 너무 많은 요청을 보냈습니다
→ 15분 기다린 후 다시 시도하세요
```

### 트랜잭션 잔액 부족
```
→ 먼저 채굴로 코인을 획득하세요
→ 보유 코인보다 적은 금액만 전송 가능
```

---

## 🎯 난이도 가이드

| 난이도 | 예상 시간 | 권장 용도 | 해시 패턴 |
|--------|----------|----------|----------|
| 1 | < 1초 | 빠른 테스트 | 0... |
| 2 | 1-3초 | 기본 테스트 | 00... |
| 3 | 3-10초 | 데모 | 000... |
| 4 | 10-30초 | 권장 (데모) | 0000... |
| 5 | 30-120초 | 실습 | 00000... |
| 6 | 2-5분 | 고급 실습 | 000000... |
| 7+ | 5분+ | 실전 체험 | 0000000... |

---

## 🌐 브라우저 지원

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 📱 모바일 지원

완전한 반응형 디자인으로 다음 기기를 지원합니다:
- 📱 스마트폰 (320px+)
- 📱 태블릿 (768px+)
- 💻 데스크톱 (1024px+)
- 🖥️ 대형 모니터 (1920px+)

---

## 🔐 프로덕션 배포 체크리스트

- [ ] `.env` 파일의 `JWT_SECRET` 변경
- [ ] `NODE_ENV=production` 설정
- [ ] CORS `ALLOWED_ORIGINS` 실제 도메인으로 설정
- [ ] HTTPS 설정 (SSL 인증서)
- [ ] 방화벽 포트 설정
- [ ] 로그 로테이션 설정
- [ ] 데이터베이스 연동 (선택)
- [ ] 모니터링 도구 설치 (PM2, New Relic 등)

---

## 🤝 기여 방법

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이센스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

---

## 👨‍💻 기술 스택

### Backend
- Node.js 14+
- Express.js 4.x
- WebSocket (ws)
- crypto-js
- helmet
- express-rate-limit

### Frontend
- Vanilla JavaScript (ES6+)
- CSS3 (Grid, Flexbox, Animations)
- Font Awesome 6
- WebSocket API

### Security
- Helmet.js
- Rate Limiting
- Input Validation
- XSS Protection
- CORS

---

## 🎓 학습 가이드

이 프로젝트로 다음을 배울 수 있습니다:

1. **블록체인 기초**
   - 블록 구조
   - 해시 체인
   - 작업 증명 (PoW)

2. **웹 개발**
   - RESTful API
   - WebSocket 실시간 통신
   - 반응형 디자인

3. **보안**
   - Rate Limiting
   - 입력 검증
   - 암호화

4. **Node.js**
   - Express 서버
   - 미들웨어
   - 파일 시스템

---

## 🌟 주요 특징 요약

### V1 vs V2 비교

| 기능 | V1 | V2 |
|-----|----|----|
| 기본 채굴 | ✅ | ✅ |
| 트랜잭션 | ✅ | ✅ |
| 웹 UI | ✅ | ✅✨ (개선) |
| Rate Limiting | ❌ | ✅ |
| WebSocket | ❌ | ✅ |
| 다크모드 | ❌ | ✅ |
| 토스트 알림 | ❌ | ✅ |
| 페이지네이션 | ❌ | ✅ |
| CSV 내보내기 | ❌ | ✅ |
| 로깅 시스템 | ❌ | ✅ |
| 보안 헤더 | ❌ | ✅ |
| 입력 검증 | ❌ | ✅ |

---

## 💡 팁 & 트릭

### 빠른 개발
```bash
# 자동 재시작으로 개발
npm run dev:v2
```

### 로그 확인
```bash
# 실시간 로그 보기
tail -f logs/app-$(date +%Y-%m-%d).log
```

### API 테스트
```bash
# curl로 채굴자 등록
curl -X POST http://localhost:3000/api/miner/register \
  -H "Content-Type: application/json" \
  -d '{"name":"TestMiner"}'
```

---

## 🎉 감사의 말

이 프로젝트는 블록체인 기술을 학습하고 실습하기 위한 교육용 프로젝트입니다.
실제 암호화폐와는 관련이 없으며, 학습 목적으로만 사용하세요.

---

<div align="center">

**Made with ❤️ for learning blockchain technology**

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!

[Bug Report](https://github.com/your-repo/issues) · [Feature Request](https://github.com/your-repo/issues)

</div>


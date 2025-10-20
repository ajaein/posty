# ⛏️ 암호화폐 채굴 시스템 (Crypto Mining System)

Express.js 기반의 블록체인 암호화폐 채굴 시스템입니다.

## 🌟 주요 기능

- **블록체인 구현**: 완전한 블록체인 구조 (Block, Blockchain)
- **작업 증명(PoW)**: Proof of Work 알고리즘 기반 채굴
- **채굴 시스템**: 실시간 블록 채굴 및 보상 지급
- **트랜잭션**: 코인 전송 및 거래 관리
- **채굴자 관리**: 다중 채굴자 등록 및 관리
- **난이도 조절**: 동적 채굴 난이도 설정
- **잔액 추적**: 주소별 코인 잔액 관리
- **체인 검증**: 블록체인 무결성 검증
- **웹 UI**: 직관적인 웹 인터페이스

## 📋 시스템 요구사항

- Node.js 14.x 이상
- npm 또는 yarn

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 서버 시작

```bash
# 일반 모드
npm start

# 개발 모드 (nodemon)
npm run dev
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 📁 프로젝트 구조

```
crypto-mining-system/
├── blockchain/
│   ├── Block.js           # 블록 클래스
│   └── Blockchain.js      # 블록체인 클래스
├── public/
│   └── index.html         # 웹 UI
├── server.js              # Express 서버
├── package.json
└── README.md
```

## 🎮 사용 방법

### 웹 인터페이스

1. 브라우저에서 `http://localhost:3000` 접속
2. 채굴자 이름 입력 후 등록
3. 난이도 조절 (1-6 권장)
4. "블록 채굴 시작" 버튼 클릭
5. 채굴 완료 후 보상 확인
6. 코인 전송 기능으로 다른 주소로 전송

### API 엔드포인트

#### 블록체인 정보
```http
GET /api/blockchain
```
블록체인의 전체 정보를 반환합니다.

#### 전체 체인 조회
```http
GET /api/chain
```
모든 블록을 포함한 체인을 반환합니다.

#### 특정 블록 조회
```http
GET /api/block/:index
```
지정된 인덱스의 블록을 반환합니다.

#### 채굴자 등록
```http
POST /api/miner/register
Content-Type: application/json

{
  "name": "채굴자 이름"
}
```

#### 채굴자 정보 조회
```http
GET /api/miner/:minerId
```

#### 모든 채굴자 조회
```http
GET /api/miners
```

#### 블록 채굴
```http
POST /api/mine
Content-Type: application/json

{
  "minerId": "채굴자_ID"
}
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

#### 대기 중인 트랜잭션 조회
```http
GET /api/transactions/pending
```

#### 잔액 조회
```http
GET /api/balance/:address
```

#### 모든 잔액 조회
```http
GET /api/balances
```

#### 난이도 변경
```http
POST /api/difficulty
Content-Type: application/json

{
  "difficulty": 4
}
```

#### 블록체인 검증
```http
GET /api/validate
```

#### 시스템 통계
```http
GET /api/stats
```

## 💡 주요 개념

### 블록 (Block)
각 블록은 다음 정보를 포함합니다:
- **인덱스**: 블록 번호
- **타임스탬프**: 생성 시간
- **데이터**: 트랜잭션 정보
- **이전 해시**: 이전 블록의 해시
- **해시**: 현재 블록의 해시
- **Nonce**: 작업 증명 값
- **채굴자**: 블록을 채굴한 주소

### 작업 증명 (Proof of Work)
특정 난이도 조건을 만족하는 해시를 찾을 때까지 Nonce 값을 증가시키는 과정입니다.
- 난이도가 높을수록 채굴 시간이 길어집니다
- 난이도 4 = 해시가 "0000"으로 시작해야 함

### 채굴 보상
- 블록을 성공적으로 채굴한 채굴자에게 50 코인 지급
- 대기 중인 트랜잭션도 함께 처리됨

### 트랜잭션
- 발신자, 수신자, 금액 정보 포함
- 블록 채굴 시 함께 처리됨
- 잔액 검증 기능 포함

## 🔧 설정 변경

`server.js` 파일에서 다음 값들을 수정할 수 있습니다:

```javascript
const PORT = 3000;                    // 서버 포트
blockchain.difficulty = 4;            // 초기 난이도
blockchain.miningReward = 50;         // 채굴 보상
```

## 🎯 난이도 권장사항

| 난이도 | 예상 시간 | 권장 용도 |
|--------|----------|----------|
| 1-2    | 즉시     | 테스트   |
| 3-4    | 1-10초   | 개발/데모 |
| 5-6    | 10-60초  | 실습     |
| 7+     | 1분+     | 실전     |

## 📊 예제 시나리오

1. **채굴자 Alice 등록**
   - 초기 잔액: 0 코인

2. **첫 블록 채굴**
   - Alice가 블록 #1 채굴
   - 보상: 50 코인
   - Alice 잔액: 50 코인

3. **코인 전송**
   - Alice → Bob: 20 코인
   - 트랜잭션이 대기 목록에 추가됨

4. **두 번째 블록 채굴**
   - Bob이 블록 #2 채굴
   - 보상: 50 코인
   - 트랜잭션 처리
   - Alice 잔액: 30 코인
   - Bob 잔액: 70 코인

## 🔐 보안 기능

- SHA-256 해시 알고리즘
- 블록체인 무결성 검증
- 이전 블록 해시 연결 검증
- 잔액 검증 (이중 지불 방지)

## 🐛 문제 해결

### 채굴이 너무 느려요
- 난이도를 낮춰보세요 (1-3 권장)

### 트랜잭션이 처리되지 않아요
- 트랜잭션 생성 후 블록을 채굴해야 처리됩니다

### 잔액이 부족하다고 나와요
- 채굴을 통해 코인을 먼저 획득해야 합니다

## 📝 라이센스

MIT License

## 👨‍💻 개발자 정보

Express.js와 Node.js로 구축된 교육용 블록체인 프로젝트입니다.

## 🙏 감사의 말

이 프로젝트는 블록체인 기술의 기본 원리를 이해하기 위한 교육용 목적으로 만들어졌습니다.

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!


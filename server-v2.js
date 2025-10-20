const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const Blockchain = require('./blockchain/Blockchain');
const config = require('./config/config');
const logger = require('./utils/logger');
const CryptoUtils = require('./utils/crypto');
const {
  securityHeaders,
  apiLimiter,
  miningLimiter,
  validateInput,
  sanitizeOutput,
  errorHandler
} = require('./middleware/security');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = config.server.port;

// ==================== 미들웨어 ====================

// 보안 헤더
app.use(securityHeaders);

// 압축
app.use(compression());

// CORS 설정
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));

// Body parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일
app.use(express.static('public'));

// 응답 정제
app.use(sanitizeOutput);

// API Rate Limiting
app.use('/api/', apiLimiter);

// ==================== 블록체인 & 데이터 ====================

const blockchain = new Blockchain();
blockchain.difficulty = config.blockchain.initialDifficulty;
blockchain.miningReward = config.blockchain.miningReward;

const miners = new Map();
const miningStats = {
  totalBlocksMined: 0,
  totalTransactions: 0,
  averageMiningTime: 0,
  totalHashPower: 0
};

// ==================== WebSocket 연결 관리 ====================

const connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  logger.info('새로운 WebSocket 클라이언트 연결');
  
  // 초기 데이터 전송
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      blockchain: blockchain.getChainInfo(),
      miners: Array.from(miners.values())
    }
  }));
  
  ws.on('close', () => {
    connectedClients.delete(ws);
    logger.info('WebSocket 클라이언트 연결 해제');
  });
  
  ws.on('error', (error) => {
    logger.error('WebSocket 에러:', error.message);
  });
});

/**
 * 모든 클라이언트에게 브로드캐스트
 */
function broadcast(type, data) {
  const message = JSON.stringify({ type, data });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// ==================== 시스템 초기화 ====================

logger.success('='.repeat(80));
logger.success('⛏️  암호화폐 채굴 시스템 V2.0 시작');
logger.success('='.repeat(80));
logger.info(`🌐 서버 포트: ${PORT}`);
logger.info(`⚙️  초기 난이도: ${blockchain.difficulty}`);
logger.info(`💰 채굴 보상: ${blockchain.miningReward} 코인`);
logger.info(`🔒 보안 기능: Rate Limiting, Helmet, 입력 검증 활성화`);
logger.info(`📡 WebSocket: 실시간 업데이트 활성화`);
logger.success('='.repeat(80));

// ==================== API 엔드포인트 ====================

/**
 * 홈페이지
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-v2.html'));
});

/**
 * 헬스 체크
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
      version: '2.0.0'
    }
  });
});

/**
 * 블록체인 정보 조회
 */
app.get('/api/blockchain', (req, res) => {
  res.json({
    success: true,
    data: blockchain.getChainInfo()
  });
});

/**
 * 전체 체인 조회 (페이지네이션)
 */
app.get('/api/chain', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const paginatedChain = blockchain.chain.slice().reverse().slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      chain: paginatedChain,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(blockchain.chain.length / limit),
        totalBlocks: blockchain.chain.length,
        limit
      }
    }
  });
});

/**
 * 특정 블록 조회
 */
app.get('/api/block/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const block = blockchain.getBlock(index);
  
  if (!block) {
    return res.status(404).json({
      success: false,
      message: '블록을 찾을 수 없습니다'
    });
  }
  
  res.json({
    success: true,
    data: block
  });
});

/**
 * 블록 검색 (해시로)
 */
app.get('/api/search/block/:hash', (req, res) => {
  const { hash } = req.params;
  const block = blockchain.chain.find(b => b.hash === hash);
  
  if (!block) {
    return res.status(404).json({
      success: false,
      message: '해당 해시의 블록을 찾을 수 없습니다'
    });
  }
  
  res.json({
    success: true,
    data: block
  });
});

/**
 * 새로운 채굴자 등록 (보안 강화)
 */
app.post('/api/miner/register', validateInput.minerRegister, (req, res) => {
  const { name } = req.body;
  
  const minerId = uuidv4();
  const minerAddress = `miner_${minerId.substring(0, 8)}`;
  
  // 키 쌍 생성
  const { publicKey, privateKey } = CryptoUtils.generateKeyPair();
  
  miners.set(minerId, {
    id: minerId,
    name: name,
    address: minerAddress,
    publicKey: publicKey,
    registeredAt: Date.now(),
    blocksMineds: 0,
    totalHashPower: 0,
    lastMiningTime: null
  });
  
  logger.success(`👤 새로운 채굴자 등록: ${name} (${minerAddress})`);
  
  // WebSocket 브로드캐스트
  broadcast('minerRegistered', {
    name,
    address: minerAddress
  });
  
  res.json({
    success: true,
    data: {
      minerId: minerId,
      address: minerAddress,
      name: name,
      publicKey: publicKey,
      privateKey: privateKey, // 실제 프로덕션에서는 안전하게 저장
      message: '채굴자 등록이 완료되었습니다'
    }
  });
});

/**
 * 채굴자 정보 조회
 */
app.get('/api/miner/:minerId', (req, res) => {
  const { minerId } = req.params;
  const miner = miners.get(minerId);
  
  if (!miner) {
    return res.status(404).json({
      success: false,
      message: '채굴자를 찾을 수 없습니다'
    });
  }
  
  const balance = blockchain.getBalance(miner.address);
  
  res.json({
    success: true,
    data: {
      ...miner,
      balance: balance,
      privateKey: undefined // 보안상 제외
    }
  });
});

/**
 * 모든 채굴자 목록 조회
 */
app.get('/api/miners', (req, res) => {
  const minersList = Array.from(miners.values()).map(miner => ({
    ...miner,
    balance: blockchain.getBalance(miner.address),
    privateKey: undefined,
    publicKey: undefined
  }));
  
  res.json({
    success: true,
    data: minersList
  });
});

/**
 * 블록 채굴 시작 (Rate Limiting 적용)
 */
app.post('/api/mine', miningLimiter, (req, res) => {
  const { minerId } = req.body;
  
  if (!minerId) {
    return res.status(400).json({
      success: false,
      message: '채굴자 ID가 필요합니다'
    });
  }
  
  const miner = miners.get(minerId);
  
  if (!miner) {
    return res.status(404).json({
      success: false,
      message: '등록되지 않은 채굴자입니다'
    });
  }
  
  try {
    logger.mining(`채굴 시작: ${miner.name} (${miner.address})`);
    
    // 채굴 실행
    const result = blockchain.minePendingTransactions(miner.address);
    
    // 채굴자 정보 업데이트
    miner.blocksMineds++;
    miner.lastMiningTime = parseFloat(result.timeTaken);
    miner.totalHashPower += result.nonce;
    
    const balance = blockchain.getBalance(miner.address);
    
    // 통계 업데이트
    miningStats.totalBlocksMined++;
    miningStats.totalTransactions += result.transactionsProcessed;
    miningStats.averageMiningTime = 
      (miningStats.averageMiningTime * (miningStats.totalBlocksMined - 1) + parseFloat(result.timeTaken)) 
      / miningStats.totalBlocksMined;
    
    logger.success(`채굴 완료: 블록 #${result.block.index} by ${miner.name}`);
    
    // WebSocket 브로드캐스트
    broadcast('blockMined', {
      block: result.block,
      miner: miner.name,
      reward: result.reward
    });
    
    res.json({
      success: true,
      data: {
        message: '블록 채굴에 성공했습니다!',
        blockIndex: result.block.index,
        hash: result.hash,
        nonce: result.nonce,
        timeTaken: result.timeTaken,
        reward: result.reward,
        transactionsProcessed: result.transactionsProcessed,
        miner: {
          name: miner.name,
          address: miner.address,
          balance: balance,
          totalBlocksMined: miner.blocksMineds
        }
      }
    });
  } catch (error) {
    logger.error('채굴 중 오류:', error.message);
    res.status(500).json({
      success: false,
      message: '채굴 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

/**
 * 새로운 트랜잭션 생성 (검증 강화)
 */
app.post('/api/transaction', validateInput.transaction, (req, res) => {
  const { from, to, amount, signature } = req.body;
  
  try {
    const transaction = {
      from: from,
      to: to,
      amount: parseFloat(amount),
      timestamp: Date.now(),
      type: 'transfer'
    };
    
    // 서명이 있으면 검증 (선택적)
    if (signature) {
      const fromMiner = Array.from(miners.values()).find(m => m.address === from);
      if (fromMiner && fromMiner.publicKey) {
        const isValid = CryptoUtils.verifySignature(transaction, signature, fromMiner.publicKey);
        if (!isValid) {
          return res.status(401).json({
            success: false,
            message: '트랜잭션 서명이 유효하지 않습니다'
          });
        }
        transaction.signature = signature;
      }
    }
    
    blockchain.addTransaction(transaction);
    
    logger.info(`트랜잭션 추가: ${from} -> ${to} (${amount} 코인)`);
    
    // WebSocket 브로드캐스트
    broadcast('transactionAdded', transaction);
    
    res.json({
      success: true,
      data: {
        message: '트랜잭션이 추가되었습니다',
        transaction: transaction,
        pendingTransactions: blockchain.pendingTransactions.length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 대기 중인 트랜잭션 조회
 */
app.get('/api/transactions/pending', (req, res) => {
  res.json({
    success: true,
    data: {
      transactions: blockchain.pendingTransactions,
      count: blockchain.pendingTransactions.length
    }
  });
});

/**
 * 트랜잭션 히스토리 조회
 */
app.get('/api/transactions/history/:address', (req, res) => {
  const { address } = req.params;
  const transactions = [];
  
  blockchain.chain.forEach(block => {
    if (block.data.transactions) {
      block.data.transactions.forEach(tx => {
        if (tx.from === address || tx.to === address) {
          transactions.push({
            ...tx,
            blockIndex: block.index,
            blockHash: block.hash,
            blockTimestamp: block.timestamp
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    data: {
      address,
      transactions: transactions.reverse(),
      count: transactions.length
    }
  });
});

/**
 * 잔액 조회
 */
app.get('/api/balance/:address', (req, res) => {
  const { address } = req.params;
  const balance = blockchain.getBalance(address);
  
  res.json({
    success: true,
    data: {
      address: address,
      balance: balance
    }
  });
});

/**
 * 모든 계정의 잔액 조회
 */
app.get('/api/balances', (req, res) => {
  res.json({
    success: true,
    data: blockchain.balances
  });
});

/**
 * 난이도 변경 (검증 강화)
 */
app.post('/api/difficulty', validateInput.difficulty, (req, res) => {
  const { difficulty } = req.body;
  
  try {
    blockchain.setDifficulty(parseInt(difficulty));
    
    logger.info(`난이도 변경: ${difficulty}`);
    
    // WebSocket 브로드캐스트
    broadcast('difficultyChanged', { difficulty: blockchain.difficulty });
    
    res.json({
      success: true,
      data: {
        message: '난이도가 변경되었습니다',
        difficulty: blockchain.difficulty
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 블록체인 유효성 검증
 */
app.get('/api/validate', (req, res) => {
  const isValid = blockchain.isChainValid();
  
  res.json({
    success: true,
    data: {
      isValid: isValid,
      message: isValid ? '블록체인이 유효합니다' : '블록체인이 손상되었습니다'
    }
  });
});

/**
 * 시스템 통계 (확장)
 */
app.get('/api/stats', (req, res) => {
  const chainInfo = blockchain.getChainInfo();
  const totalMiners = miners.size;
  const activeMiners = Array.from(miners.values()).filter(m => m.blocksMineds > 0).length;
  
  res.json({
    success: true,
    data: {
      blockchain: chainInfo,
      miners: {
        total: totalMiners,
        active: activeMiners
      },
      mining: miningStats,
      topMiners: Array.from(miners.values())
        .map(m => ({
          name: m.name,
          address: m.address,
          balance: blockchain.getBalance(m.address),
          blocksMineds: m.blocksMineds,
          totalHashPower: m.totalHashPower
        }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '2.0.0'
      }
    }
  });
});

/**
 * CSV 내보내기 - 블록체인
 */
app.get('/api/export/blockchain', (req, res) => {
  let csv = 'Index,Timestamp,Hash,Previous Hash,Nonce,Miner,Transactions\n';
  
  blockchain.chain.forEach(block => {
    const txCount = block.data.transactions ? block.data.transactions.length : 0;
    csv += `${block.index},${new Date(block.timestamp).toISOString()},${block.hash},${block.previousHash},${block.nonce},${block.miner || 'N/A'},${txCount}\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=blockchain.csv');
  res.send(csv);
});

/**
 * CSV 내보내기 - 채굴자
 */
app.get('/api/export/miners', (req, res) => {
  let csv = 'Name,Address,Balance,Blocks Mined,Total Hash Power,Registered At\n';
  
  Array.from(miners.values()).forEach(miner => {
    const balance = blockchain.getBalance(miner.address);
    csv += `${miner.name},${miner.address},${balance},${miner.blocksMineds},${miner.totalHashPower},${new Date(miner.registeredAt).toISOString()}\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=miners.csv');
  res.send(csv);
});

// 에러 핸들러 (마지막에 배치)
app.use(errorHandler);

// ==================== 서버 시작 ====================

server.listen(PORT, () => {
  logger.success(`\n✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다\n`);
  logger.info('📚 API 엔드포인트:');
  logger.info('  GET  /api/health              - 헬스 체크');
  logger.info('  GET  /api/blockchain          - 블록체인 정보');
  logger.info('  GET  /api/chain               - 전체 체인 (페이지네이션)');
  logger.info('  GET  /api/block/:index        - 특정 블록');
  logger.info('  GET  /api/search/block/:hash  - 블록 검색');
  logger.info('  POST /api/miner/register      - 채굴자 등록');
  logger.info('  GET  /api/miner/:minerId      - 채굴자 정보');
  logger.info('  GET  /api/miners              - 모든 채굴자');
  logger.info('  POST /api/mine                - 블록 채굴');
  logger.info('  POST /api/transaction         - 트랜잭션 생성');
  logger.info('  GET  /api/transactions/pending            - 대기 트랜잭션');
  logger.info('  GET  /api/transactions/history/:address   - 트랜잭션 히스토리');
  logger.info('  GET  /api/balance/:address    - 잔액 조회');
  logger.info('  GET  /api/balances            - 모든 잔액');
  logger.info('  POST /api/difficulty          - 난이도 변경');
  logger.info('  GET  /api/validate            - 체인 검증');
  logger.info('  GET  /api/stats               - 시스템 통계');
  logger.info('  GET  /api/export/blockchain   - CSV 내보내기 (블록체인)');
  logger.info('  GET  /api/export/miners       - CSV 내보내기 (채굴자)');
  logger.success('\n' + '='.repeat(80) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM 신호 수신, 서버 종료 중...');
  server.close(() => {
    logger.info('서버가 정상적으로 종료되었습니다');
    process.exit(0);
  });
});

module.exports = { app, server };


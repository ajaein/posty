const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const Blockchain = require('./blockchain/Blockchain');
const TransactionPool = require('./models/TransactionPool');
const { Wallet, WalletManager } = require('./models/Wallet');
const config = require('./config/config');
const logger = require('./utils/logger');
const CryptoUtils = require('./utils/crypto');
const AuthMiddleware = require('./middleware/auth');
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

app.use(securityHeaders);
app.use(compression());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));
app.use(sanitizeOutput);
app.use('/api/', apiLimiter);

// ==================== 초기화 ====================

const blockchain = new Blockchain();
blockchain.difficulty = config.blockchain.initialDifficulty;
blockchain.miningReward = config.blockchain.miningReward;

const transactionPool = new TransactionPool();
const walletManager = new WalletManager();
const miners = new Map();
const miningStats = {
  totalBlocksMined: 0,
  totalTransactions: 0,
  averageMiningTime: 0,
  totalHashPower: 0
};

// ==================== WebSocket ====================

const connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  logger.info('새로운 WebSocket 클라이언트 연결');
  
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      blockchain: blockchain.getChainInfo(),
      miners: Array.from(miners.values()),
      transactionPool: transactionPool.getStats()
    }
  }));
  
  ws.on('close', () => {
    connectedClients.delete(ws);
    logger.info('WebSocket 클라이언트 연결 해제');
  });
});

function broadcast(type, data) {
  const message = JSON.stringify({ type, data });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// ==================== 시스템 시작 ====================

logger.success('='.repeat(80));
logger.success('⛏️  Crypto Mining System V2.1 시작');
logger.success('='.repeat(80));
logger.info(`🌐 서버 포트: ${PORT}`);
logger.info(`⚙️  초기 난이도: ${blockchain.difficulty}`);
logger.info(`💰 채굴 보상: ${blockchain.miningReward} 코인 (반감기 적용)`);
logger.info(`🔒 보안: Rate Limiting, Helmet, JWT 인증`);
logger.info(`💼 지갑 시스템: 활성화`);
logger.info(`📡 WebSocket: 실시간 업데이트`);
logger.success('='.repeat(80));

// ==================== API 엔드포인트 ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-v2.html'));
});

// ==================== 인증 API ====================

/**
 * 사용자 로그인 (채굴자 등록 시 토큰 발급)
 */
app.post('/api/auth/login', validateInput.minerRegister, (req, res) => {
  const { name } = req.body;
  
  const minerId = uuidv4();
  const minerAddress = `miner_${minerId.substring(0, 8)}`;
  
  // 지갑 생성
  const wallet = walletManager.createWallet(`${name}'s Wallet`);
  
  miners.set(minerId, {
    id: minerId,
    name: name,
    address: wallet.address,
    walletId: wallet.id,
    registeredAt: Date.now(),
    blocksMineds: 0,
    totalHashPower: 0,
    lastMiningTime: null
  });
  
  // JWT 토큰 생성
  const token = AuthMiddleware.generateToken({
    minerId: minerId,
    name: name,
    address: wallet.address,
    role: 'miner'
  });
  
  const refreshToken = AuthMiddleware.generateRefreshToken({
    minerId: minerId
  });
  
  logger.success(`👤 새로운 채굴자 등록: ${name} (${wallet.address})`);
  
  broadcast('minerRegistered', { name, address: wallet.address });
  
  res.json({
    success: true,
    data: {
      minerId: minerId,
      address: wallet.address,
      walletId: wallet.id,
      name: name,
      token: token,
      refreshToken: refreshToken,
      message: '로그인 성공!'
    }
  });
});

/**
 * 토큰 갱신
 */
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: '리프레시 토큰이 필요합니다'
    });
  }
  
  const decoded = AuthMiddleware.verifyToken(refreshToken);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 리프레시 토큰입니다'
    });
  }
  
  const miner = miners.get(decoded.minerId);
  
  if (!miner) {
    return res.status(404).json({
      success: false,
      message: '채굴자를 찾을 수 없습니다'
    });
  }
  
  const newToken = AuthMiddleware.generateToken({
    minerId: miner.id,
    name: miner.name,
    address: miner.address,
    role: 'miner'
  });
  
  res.json({
    success: true,
    data: { token: newToken }
  });
});

// ==================== 지갑 API ====================

/**
 * 내 지갑 조회
 */
app.get('/api/wallet/me', AuthMiddleware.authenticate, (req, res) => {
  const miner = miners.get(req.user.minerId);
  
  if (!miner) {
    return res.status(404).json({
      success: false,
      message: '채굴자를 찾을 수 없습니다'
    });
  }
  
  const wallet = walletManager.getWallet(miner.walletId);
  
  if (!wallet) {
    return res.status(404).json({
      success: false,
      message: '지갑을 찾을 수 없습니다'
    });
  }
  
  const balance = blockchain.getBalance(wallet.address);
  
  res.json({
    success: true,
    data: {
      ...wallet.getPublicInfo(),
      balance: balance,
      miner: {
        name: miner.name,
        blocksMineds: miner.blocksMineds
      }
    }
  });
});

/**
 * 지갑으로 트랜잭션 서명 및 전송
 */
app.post('/api/wallet/send', AuthMiddleware.authenticate, validateInput.transaction, (req, res) => {
  const { to, amount } = req.body;
  
  const miner = miners.get(req.user.minerId);
  if (!miner) {
    return res.status(404).json({ success: false, message: '채굴자를 찾을 수 없습니다' });
  }
  
  const wallet = walletManager.getWallet(miner.walletId);
  if (!wallet) {
    return res.status(404).json({ success: false, message: '지갑을 찾을 수 없습니다' });
  }
  
  try {
    const transaction = {
      from: wallet.address,
      to: to,
      amount: parseFloat(amount),
      timestamp: Date.now(),
      type: 'transfer'
    };
    
    // 지갑으로 서명
    const signedTransaction = wallet.signTransaction(transaction);
    
    // 트랜잭션 풀에 추가
    transactionPool.addTransaction(signedTransaction);
    blockchain.addTransaction(signedTransaction);
    
    wallet.addTransaction(signedTransaction);
    
    logger.info(`트랜잭션 추가: ${wallet.address} -> ${to} (${amount} 코인)`);
    broadcast('transactionAdded', signedTransaction);
    
    res.json({
      success: true,
      data: {
        message: '트랜잭션이 추가되었습니다',
        transaction: signedTransaction,
        poolSize: transactionPool.getSize()
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
 * 지갑 내보내기
 */
app.get('/api/wallet/export', AuthMiddleware.authenticate, (req, res) => {
  const miner = miners.get(req.user.minerId);
  if (!miner) {
    return res.status(404).json({ success: false, message: '채굴자를 찾을 수 없습니다' });
  }
  
  const wallet = walletManager.getWallet(miner.walletId);
  if (!wallet) {
    return res.status(404).json({ success: false, message: '지갑을 찾을 수 없습니다' });
  }
  
  res.json({
    success: true,
    data: wallet.exportToJSON(),
    warning: '⚠️ 개인키를 안전하게 보관하세요!'
  });
});

// ==================== 블록체인 API ====================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
      version: '2.1.0'
    }
  });
});

app.get('/api/blockchain', (req, res) => {
  res.json({
    success: true,
    data: {
      ...blockchain.getChainInfo(),
      currentReward: blockchain.getCurrentReward(),
      nextHalving: blockchain.halvingInterval - (blockchain.chain.length % blockchain.halvingInterval)
    }
  });
});

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
 * 채굴 (인증 필요)
 */
app.post('/api/mine', AuthMiddleware.authenticate, miningLimiter, (req, res) => {
  const miner = miners.get(req.user.minerId);
  
  if (!miner) {
    return res.status(404).json({
      success: false,
      message: '등록되지 않은 채굴자입니다'
    });
  }
  
  try {
    logger.mining(`채굴 시작: ${miner.name} (${miner.address})`);
    
    const result = blockchain.minePendingTransactions(miner.address);
    
    miner.blocksMineds++;
    miner.lastMiningTime = parseFloat(result.timeTaken);
    miner.totalHashPower += result.nonce;
    
    const balance = blockchain.getBalance(miner.address);
    
    miningStats.totalBlocksMined++;
    miningStats.totalTransactions += result.transactionsProcessed;
    miningStats.averageMiningTime = 
      (miningStats.averageMiningTime * (miningStats.totalBlocksMined - 1) + parseFloat(result.timeTaken)) 
      / miningStats.totalBlocksMined;
    
    // 트랜잭션 풀에서 제거
    transactionPool.clear();
    
    logger.success(`채굴 완료: 블록 #${result.block.index} by ${miner.name}`);
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
 * 트랜잭션 풀 통계
 */
app.get('/api/pool/stats', (req, res) => {
  res.json({
    success: true,
    data: transactionPool.getStats()
  });
});

/**
 * 트랜잭션 풀 조회
 */
app.get('/api/pool/transactions', (req, res) => {
  res.json({
    success: true,
    data: {
      transactions: transactionPool.transactions,
      count: transactionPool.getSize()
    }
  });
});

app.get('/api/stats', (req, res) => {
  const chainInfo = blockchain.getChainInfo();
  const totalMiners = miners.size;
  const activeMiners = Array.from(miners.values()).filter(m => m.blocksMineds > 0).length;
  
  res.json({
    success: true,
    data: {
      blockchain: {
        ...chainInfo,
        currentReward: blockchain.getCurrentReward(),
        nextHalving: blockchain.halvingInterval - (blockchain.chain.length % blockchain.halvingInterval)
      },
      miners: {
        total: totalMiners,
        active: activeMiners
      },
      mining: miningStats,
      transactionPool: transactionPool.getStats(),
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
        version: '2.1.0'
      }
    }
  });
});

// V1/V2 호환성을 위한 엔드포인트들
app.post('/api/miner/register', (req, res) => {
  res.redirect(307, '/api/auth/login');
});

app.get('/api/miners', (req, res) => {
  const minersList = Array.from(miners.values()).map(miner => ({
    ...miner,
    balance: blockchain.getBalance(miner.address),
    walletId: undefined
  }));
  
  res.json({
    success: true,
    data: minersList
  });
});

app.post('/api/difficulty', validateInput.difficulty, (req, res) => {
  const { difficulty } = req.body;
  
  try {
    blockchain.setDifficulty(parseInt(difficulty));
    logger.info(`난이도 변경: ${difficulty}`);
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

app.get('/api/export/blockchain', (req, res) => {
  let csv = 'Index,Timestamp,Hash,Previous Hash,Nonce,Miner,Transactions,Reward\n';
  
  blockchain.chain.forEach(block => {
    const txCount = block.data.transactions ? block.data.transactions.length : 0;
    const reward = block.data.transactions 
      ? block.data.transactions.find(tx => tx.type === 'mining_reward')?.amount || 0
      : 0;
    csv += `${block.index},${new Date(block.timestamp).toISOString()},${block.hash},${block.previousHash},${block.nonce},${block.miner || 'N/A'},${txCount},${reward}\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=blockchain-v2.1.csv');
  res.send(csv);
});

app.use(errorHandler);

// ==================== 서버 시작 ====================

server.listen(PORT, () => {
  logger.success(`\n✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다\n`);
  logger.info('📚 V2.1 새로운 기능:');
  logger.info('  ✨ JWT 인증 시스템');
  logger.info('  💼 지갑 시스템');
  logger.info('  🔄 트랜잭션 풀');
  logger.info('  📉 채굴 보상 반감기');
  logger.success('\n' + '='.repeat(80) + '\n');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM 신호 수신, 서버 종료 중...');
  server.close(() => {
    logger.info('서버가 정상적으로 종료되었습니다');
    process.exit(0);
  });
});

module.exports = { app, server };


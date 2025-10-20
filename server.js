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
const UserDatabase = require('./models/UserDatabase');
const PriceTracker = require('./models/PriceTracker');
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
// apiLimiter 제거 - 채굴에만 Rate Limiting 적용

// ==================== 초기화 ====================

const blockchain = new Blockchain();
blockchain.difficulty = config.blockchain.initialDifficulty;
blockchain.miningReward = config.blockchain.miningReward;

const transactionPool = new TransactionPool();
const walletManager = new WalletManager();
const userDB = new UserDatabase();
const priceTracker = new PriceTracker();
const miners = new Map();
const miningStats = {
  totalBlocksMined: 0,
  totalTransactions: 0,
  averageMiningTime: 0,
  totalHashPower: 0
};

// 가격 추적기에 총 공급량 주기적으로 업데이트
setInterval(() => {
  const chainInfo = blockchain.getChainInfo();
  priceTracker.updateTotalSupply(chainInfo.totalSupply);
}, 5000);

// ==================== WebSocket ====================

const connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  // WebSocket 연결 로그 제거 (조용히 처리)
  
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      blockchain: blockchain.getChainInfo(),
      miners: Array.from(miners.values()),
      transactionPool: transactionPool.getStats(),
      priceData: priceTracker.getPriceData()
    }
  }));
  
  ws.on('close', () => {
    connectedClients.delete(ws);
    // WebSocket 연결 해제 로그 제거 (조용히 처리)
  });
});

// 주기적으로 가격 데이터 브로드캐스트
setInterval(() => {
  broadcast('priceUpdate', priceTracker.getPriceData());
}, 5000);

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
logger.success('⛏️  Posty Mining System V2.1');
logger.success('='.repeat(80));
logger.info(`🌐 서버 포트: ${PORT}`);
logger.info(`⚙️  초기 난이도: ${blockchain.difficulty}`);
logger.info(`💰 채굴 보상: ${blockchain.miningReward} POSTY (반감기 적용)`);
logger.info(`🔒 보안: Rate Limiting, Helmet, JWT 인증`);
logger.info(`💼 지갑 시스템: 활성화`);
logger.info(`📡 WebSocket: 실시간 업데이트`);
logger.success('='.repeat(80));

// ==================== API 엔드포인트 ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== 회원 인증 API ====================

/**
 * 회원가입
 */
app.post('/api/user/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({
      success: false,
      message: '이메일, 비밀번호, 사용자명이 모두 필요합니다'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: '비밀번호는 최소 6자 이상이어야 합니다'
    });
  }

  try {
    const user = await userDB.register(email, password, username);
    
    // 자동으로 지갑 생성
    const wallet = walletManager.createWallet(`${username}'s Wallet`);
    userDB.updateUser(user.id, { walletAddress: wallet.address });

    // JWT 토큰 생성
    const token = AuthMiddleware.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: 'user'
    });

    logger.success(`✅ 새 사용자 등록: ${username} (${email})`);

    res.json({
      success: true,
      data: {
        user: { ...user, walletAddress: wallet.address },
        token: token,
        message: '회원가입 성공!'
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
 * 로그인
 */
app.post('/api/user/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: '이메일과 비밀번호가 필요합니다'
    });
  }

  try {
    const user = await userDB.login(email, password);

    // JWT 토큰 생성
    const token = AuthMiddleware.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: 'user'
    });

    res.json({
      success: true,
      data: {
        user: user,
        token: token,
        message: '로그인 성공!'
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 내 정보 조회
 */
app.get('/api/user/me', AuthMiddleware.authenticate, (req, res) => {
  const user = userDB.findById(req.user.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '사용자를 찾을 수 없습니다'
    });
  }

  res.json({
    success: true,
    data: userDB.sanitizeUser(user)
  });
});

// ==================== 인증 API (채굴자 등록 - 레거시) ====================

/**
 * 채굴자 등록 (기존 호환성 유지)
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
    
    logger.info(`트랜잭션 추가: ${wallet.address} -> ${to} (${amount} POSTY)`);
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
      version: '2.1.0',
      coin: 'POSTY'
    }
  });
});

app.get('/api/blockchain', (req, res) => {
  res.json({
    success: true,
    data: {
      ...blockchain.getChainInfo(),
      currentReward: blockchain.getCurrentReward(),
      nextHalving: blockchain.halvingInterval - (blockchain.chain.length % blockchain.halvingInterval),
      coin: 'POSTY'
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
 * 트랜잭션 생성 (호환성)
 */
app.post('/api/transaction', validateInput.transaction, (req, res) => {
  const { from, to, amount } = req.body;
  
  try {
    const transaction = {
      from: from,
      to: to,
      amount: parseFloat(amount),
      timestamp: Date.now(),
      type: 'transfer'
    };
    
    blockchain.addTransaction(transaction);
    transactionPool.addTransaction(transaction);
    
    logger.info(`트랜잭션 추가: ${from} -> ${to} (${amount} POSTY)`);
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

app.get('/api/transactions/pending', (req, res) => {
  res.json({
    success: true,
    data: {
      transactions: blockchain.pendingTransactions,
      count: blockchain.pendingTransactions.length
    }
  });
});

app.get('/api/balance/:address', (req, res) => {
  const { address } = req.params;
  const balance = blockchain.getBalance(address);
  
  res.json({
    success: true,
    data: {
      address: address,
      balance: balance,
      coin: 'POSTY'
    }
  });
});

app.get('/api/balances', (req, res) => {
  res.json({
    success: true,
    data: blockchain.balances
  });
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

app.get('/api/validate', (req, res) => {
  const isValid = blockchain.isChainValid();
  
  // 블록체인 검증 로그 제거
  
  res.json({
    success: true,
    data: {
      isValid: isValid,
      message: isValid ? '블록체인이 유효합니다' : '블록체인이 손상되었습니다'
    }
  });
});

/**
 * 가격 데이터 조회
 */
app.get('/api/price', (req, res) => {
  res.json({
    success: true,
    data: priceTracker.getPriceData()
  });
});

app.get('/api/stats', (req, res) => {
  const chainInfo = blockchain.getChainInfo();
  const totalMiners = miners.size;
  const activeMiners = Array.from(miners.values()).filter(m => m.blocksMineds > 0).length;
  const priceData = priceTracker.getPriceData();
  
  res.json({
    success: true,
    data: {
      blockchain: {
        ...chainInfo,
        currentReward: blockchain.getCurrentReward(),
        nextHalving: blockchain.halvingInterval - (blockchain.chain.length % blockchain.halvingInterval),
        coin: 'POSTY'
      },
      price: priceData,
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
        version: '3.0.2',
        users: userDB.getUserCount()
      }
    }
  });
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
  res.setHeader('Content-Disposition', 'attachment; filename=posty-blockchain.csv');
  res.send(csv);
});

app.get('/api/export/miners', (req, res) => {
  let csv = 'Name,Address,Balance,Blocks Mined,Total Hash Power,Registered At\n';
  
  Array.from(miners.values()).forEach(miner => {
    const balance = blockchain.getBalance(miner.address);
    csv += `${miner.name},${miner.address},${balance},${miner.blocksMineds},${miner.totalHashPower},${new Date(miner.registeredAt).toISOString()}\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=posty-miners.csv');
  res.send(csv);
});

app.use(errorHandler);

// ==================== 서버 시작 ====================

server.listen(PORT, () => {
  logger.success(`\n✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다\n`);
  logger.info('💎 POSTY Coin Mining System');
  logger.info('📚 주요 기능:');
  logger.info('  ✨ JWT 인증 시스템');
  logger.info('  💼 지갑 시스템 (RSA 서명)');
  logger.info('  🔄 트랜잭션 풀');
  logger.info('  📉 채굴 보상 반감기');
  logger.info('  🔒 보안 강화 (Rate Limiting, Helmet)');
  logger.info('  📡 WebSocket 실시간 업데이트');
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

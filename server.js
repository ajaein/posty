const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Blockchain = require('./blockchain/Blockchain');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 블록체인 인스턴스 생성
const blockchain = new Blockchain();

// 채굴자 관리
const miners = new Map();

console.log('\n' + '='.repeat(80));
console.log('⛏️  암호화폐 채굴 시스템 시작');
console.log('='.repeat(80));
console.log(`🌐 서버 포트: ${PORT}`);
console.log(`⚙️  초기 난이도: ${blockchain.difficulty}`);
console.log(`💰 채굴 보상: ${blockchain.miningReward} 코인`);
console.log('='.repeat(80) + '\n');

// ==================== API 엔드포인트 ====================

/**
 * 홈페이지
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
 * 전체 체인 조회
 */
app.get('/api/chain', (req, res) => {
  res.json({
    success: true,
    data: {
      chain: blockchain.chain,
      length: blockchain.chain.length
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
 * 새로운 채굴자 등록
 */
app.post('/api/miner/register', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: '채굴자 이름이 필요합니다'
    });
  }
  
  const minerId = uuidv4();
  const minerAddress = `miner_${minerId.substring(0, 8)}`;
  
  miners.set(minerId, {
    id: minerId,
    name: name,
    address: minerAddress,
    registeredAt: Date.now(),
    blocksMineds: 0
  });
  
  console.log(`👤 새로운 채굴자 등록: ${name} (${minerAddress})`);
  
  res.json({
    success: true,
    data: {
      minerId: minerId,
      address: minerAddress,
      name: name,
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
      balance: balance
    }
  });
});

/**
 * 모든 채굴자 목록 조회
 */
app.get('/api/miners', (req, res) => {
  const minersList = Array.from(miners.values()).map(miner => ({
    ...miner,
    balance: blockchain.getBalance(miner.address)
  }));
  
  res.json({
    success: true,
    data: minersList
  });
});

/**
 * 블록 채굴 시작
 */
app.post('/api/mine', (req, res) => {
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
    // 채굴 실행
    const result = blockchain.minePendingTransactions(miner.address);
    
    // 채굴자 정보 업데이트
    miner.blocksMineds++;
    const balance = blockchain.getBalance(miner.address);
    
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
    res.status(500).json({
      success: false,
      message: '채굴 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

/**
 * 새로운 트랜잭션 생성
 */
app.post('/api/transaction', (req, res) => {
  const { from, to, amount } = req.body;
  
  if (!from || !to || !amount) {
    return res.status(400).json({
      success: false,
      message: '발신자, 수신자, 금액이 모두 필요합니다'
    });
  }
  
  try {
    const transaction = {
      from: from,
      to: to,
      amount: parseFloat(amount),
      timestamp: Date.now(),
      type: 'transfer'
    };
    
    blockchain.addTransaction(transaction);
    
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
 * 난이도 변경
 */
app.post('/api/difficulty', (req, res) => {
  const { difficulty } = req.body;
  
  if (!difficulty || difficulty < 1 || difficulty > 10) {
    return res.status(400).json({
      success: false,
      message: '난이도는 1에서 10 사이의 값이어야 합니다'
    });
  }
  
  try {
    blockchain.setDifficulty(parseInt(difficulty));
    
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
 * 시스템 통계
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
      topMiners: Array.from(miners.values())
        .map(m => ({
          name: m.name,
          address: m.address,
          balance: blockchain.getBalance(m.address),
          blocksMineds: m.blocksMineds
        }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5)
    }
  });
});

// ==================== 서버 시작 ====================

app.listen(PORT, () => {
  console.log(`\n✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다\n`);
  console.log('📚 API 엔드포인트:');
  console.log('  GET  /api/blockchain         - 블록체인 정보');
  console.log('  GET  /api/chain              - 전체 체인 조회');
  console.log('  GET  /api/block/:index       - 특정 블록 조회');
  console.log('  POST /api/miner/register     - 채굴자 등록');
  console.log('  GET  /api/miner/:minerId     - 채굴자 정보');
  console.log('  GET  /api/miners             - 모든 채굴자');
  console.log('  POST /api/mine               - 블록 채굴');
  console.log('  POST /api/transaction        - 트랜잭션 생성');
  console.log('  GET  /api/transactions/pending - 대기 트랜잭션');
  console.log('  GET  /api/balance/:address   - 잔액 조회');
  console.log('  GET  /api/balances           - 모든 잔액');
  console.log('  POST /api/difficulty         - 난이도 변경');
  console.log('  GET  /api/validate           - 체인 검증');
  console.log('  GET  /api/stats              - 시스템 통계');
  console.log('\n' + '='.repeat(80) + '\n');
});

module.exports = app;


const Block = require('./Block');

/**
 * 블록체인 클래스 - 전체 블록체인을 관리합니다
 */
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4; // 채굴 난이도 (높을수록 어려움)
    this.pendingTransactions = [];
    this.miningReward = 50; // 채굴 보상
    this.balances = {}; // 주소별 잔액
    this.halvingInterval = 210; // 210 블록마다 반감기
    this.initialReward = 50; // 초기 보상
  }

  /**
   * 제네시스 블록(최초 블록) 생성
   */
  createGenesisBlock() {
    return new Block(0, Date.now(), {
      type: 'genesis',
      message: '🌟 Genesis Block - 블록체인의 시작'
    }, '0');
  }

  /**
   * 체인의 최신 블록을 반환합니다
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * 새로운 트랜잭션을 대기 목록에 추가합니다
   */
  addTransaction(transaction) {
    if (!transaction.from || !transaction.to) {
      throw new Error('트랜잭션에는 발신자와 수신자 주소가 필요합니다');
    }

    if (transaction.amount <= 0) {
      throw new Error('트랜잭션 금액은 0보다 커야 합니다');
    }

    // 잔액 확인 (제네시스 트랜잭션 제외)
    if (transaction.from !== 'system') {
      const balance = this.getBalance(transaction.from);
      if (balance < transaction.amount) {
        throw new Error('잔액이 부족합니다');
      }
    }

    this.pendingTransactions.push(transaction);
    console.log(`📝 새로운 트랜잭션 추가됨: ${transaction.from} -> ${transaction.to} (${transaction.amount} 코인)`);
  }

  /**
   * 현재 블록 보상 계산 (반감기 적용)
   */
  getCurrentReward() {
    const halvings = Math.floor(this.chain.length / this.halvingInterval);
    return this.initialReward / Math.pow(2, halvings);
  }

  /**
   * 대기 중인 트랜잭션을 처리하고 새 블록을 채굴합니다
   */
  minePendingTransactions(minerAddress) {
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 채굴 시작! 채굴자: ${minerAddress}`);
    console.log('='.repeat(60));

    // 현재 보상 계산 (반감기 적용)
    const currentReward = this.getCurrentReward();

    // 채굴 보상 트랜잭션 추가
    const rewardTransaction = {
      from: 'system',
      to: minerAddress,
      amount: currentReward,
      timestamp: Date.now(),
      type: 'mining_reward'
    };

    const transactionsToProcess = [...this.pendingTransactions, rewardTransaction];

    // 새 블록 생성
    const block = new Block(
      this.chain.length,
      Date.now(),
      {
        transactions: transactionsToProcess
      },
      this.getLatestBlock().hash,
      this.difficulty
    );

    // 블록 채굴
    const miningResult = block.mineBlock(this.difficulty, minerAddress);

    // 체인에 블록 추가
    this.chain.push(block);

    // 잔액 업데이트
    this.updateBalances(transactionsToProcess);

    // 대기 트랜잭션 초기화
    this.pendingTransactions = [];

    console.log(`💰 채굴 보상: ${currentReward} 코인 지급됨`);
    console.log('='.repeat(60) + '\n');

    return {
      block: block,
      ...miningResult,
      reward: currentReward,
      transactionsProcessed: transactionsToProcess.length
    };
  }

  /**
   * 트랜잭션에 따라 잔액을 업데이트합니다
   */
  updateBalances(transactions) {
    transactions.forEach(tx => {
      if (tx.from !== 'system') {
        this.balances[tx.from] = (this.balances[tx.from] || 0) - tx.amount;
      }
      this.balances[tx.to] = (this.balances[tx.to] || 0) + tx.amount;
    });
  }

  /**
   * 특정 주소의 잔액을 조회합니다
   */
  getBalance(address) {
    return this.balances[address] || 0;
  }

  /**
   * 블록체인이 유효한지 검증합니다
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // 현재 블록의 해시가 유효한지 확인
      if (!currentBlock.hasValidHash()) {
        console.log(`❌ 블록 ${i}의 해시가 유효하지 않습니다`);
        return false;
      }

      // 이전 블록과의 연결이 유효한지 확인
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log(`❌ 블록 ${i}의 이전 해시가 일치하지 않습니다`);
        return false;
      }

      // 난이도 조건을 만족하는지 확인
      const target = Array(currentBlock.difficulty + 1).join('0');
      if (currentBlock.hash.substring(0, currentBlock.difficulty) !== target) {
        console.log(`❌ 블록 ${i}의 작업 증명이 유효하지 않습니다`);
        return false;
      }
    }

    console.log('✅ 블록체인이 유효합니다');
    return true;
  }

  /**
   * 블록체인 정보를 반환합니다
   */
  getChainInfo() {
    return {
      length: this.chain.length,
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      pendingTransactions: this.pendingTransactions.length,
      totalSupply: Object.values(this.balances).reduce((sum, balance) => sum + balance, 0),
      isValid: this.isChainValid()
    };
  }

  /**
   * 특정 블록의 상세 정보를 반환합니다
   */
  getBlock(index) {
    if (index < 0 || index >= this.chain.length) {
      return null;
    }
    return this.chain[index];
  }

  /**
   * 난이도를 조정합니다
   */
  setDifficulty(difficulty) {
    if (difficulty < 1 || difficulty > 10) {
      throw new Error('난이도는 1에서 10 사이여야 합니다');
    }
    this.difficulty = difficulty;
    console.log(`⚙️  채굴 난이도가 ${difficulty}로 변경되었습니다`);
  }
}

module.exports = Blockchain;


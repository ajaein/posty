const SHA256 = require('crypto-js/sha256');

/**
 * 블록 클래스 - 블록체인의 개별 블록을 나타냅니다
 */
class Block {
  constructor(index, timestamp, data, previousHash = '', difficulty = 2) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
    this.difficulty = difficulty;
    this.miner = null;
  }

  /**
   * 블록의 해시를 계산합니다
   */
  calculateHash() {
    return SHA256(
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.data) +
      this.nonce
    ).toString();
  }

  /**
   * 작업 증명(Proof of Work) 알고리즘
   * 난이도에 따라 특정 패턴의 해시를 찾을 때까지 nonce를 증가시킵니다
   */
  mineBlock(difficulty, minerAddress) {
    const target = Array(difficulty + 1).join('0');
    
    console.log(`⛏️  채굴 시작... 난이도: ${difficulty}`);
    const startTime = Date.now();
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
      
      // 진행상황 표시 (10000번마다)
      if (this.nonce % 10000 === 0) {
        process.stdout.write(`\r시도 횟수: ${this.nonce}`);
      }
    }
    
    const endTime = Date.now();
    const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
    
    this.miner = minerAddress;
    console.log(`\n✅ 블록 채굴 완료! Hash: ${this.hash}`);
    console.log(`⏱️  소요 시간: ${timeTaken}초, 시도 횟수: ${this.nonce}`);
    
    return {
      hash: this.hash,
      nonce: this.nonce,
      timeTaken,
      miner: minerAddress
    };
  }

  /**
   * 블록이 유효한지 검증합니다
   */
  hasValidHash() {
    return this.hash === this.calculateHash();
  }
}

module.exports = Block;


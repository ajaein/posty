/**
 * 트랜잭션 풀 - 대기 중인 트랜잭션 관리
 */
class TransactionPool {
  constructor() {
    this.transactions = [];
    this.maxSize = 1000; // 최대 1000개 트랜잭션
  }

  /**
   * 트랜잭션 추가
   */
  addTransaction(transaction) {
    // 중복 체크
    const exists = this.transactions.some(tx => 
      tx.from === transaction.from &&
      tx.to === transaction.to &&
      tx.amount === transaction.amount &&
      tx.timestamp === transaction.timestamp
    );

    if (exists) {
      throw new Error('이미 존재하는 트랜잭션입니다');
    }

    // 풀 크기 체크
    if (this.transactions.length >= this.maxSize) {
      // 가장 오래된 트랜잭션 제거
      this.transactions.shift();
    }

    this.transactions.push(transaction);
  }

  /**
   * 트랜잭션 가져오기 (채굴용)
   */
  getTransactions(limit = 10) {
    return this.transactions.slice(0, limit);
  }

  /**
   * 트랜잭션 제거
   */
  removeTransactions(transactions) {
    transactions.forEach(tx => {
      const index = this.transactions.findIndex(t => 
        t.from === tx.from &&
        t.to === tx.to &&
        t.amount === tx.amount &&
        t.timestamp === tx.timestamp
      );

      if (index !== -1) {
        this.transactions.splice(index, 1);
      }
    });
  }

  /**
   * 풀 비우기
   */
  clear() {
    this.transactions = [];
  }

  /**
   * 풀 크기
   */
  getSize() {
    return this.transactions.length;
  }

  /**
   * 특정 주소의 트랜잭션
   */
  getTransactionsByAddress(address) {
    return this.transactions.filter(tx => 
      tx.from === address || tx.to === address
    );
  }

  /**
   * 수수료 순으로 정렬
   */
  sortByFee() {
    this.transactions.sort((a, b) => (b.fee || 0) - (a.fee || 0));
  }

  /**
   * 통계
   */
  getStats() {
    const totalAmount = this.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalFee = this.transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0);
    
    return {
      count: this.transactions.length,
      totalAmount,
      totalFee,
      averageAmount: this.transactions.length > 0 ? totalAmount / this.transactions.length : 0,
      averageFee: this.transactions.length > 0 ? totalFee / this.transactions.length : 0
    };
  }
}

module.exports = TransactionPool;


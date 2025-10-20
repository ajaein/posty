const CryptoUtils = require('../utils/crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * 지갑 클래스
 */
class Wallet {
  constructor(name = 'My Wallet') {
    this.id = uuidv4();
    this.name = name;
    this.createdAt = Date.now();
    
    // 키 쌍 생성
    const { publicKey, privateKey } = CryptoUtils.generateKeyPair();
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    
    // 주소 생성
    this.address = CryptoUtils.generateAddress(publicKey);
    
    // 거래 내역
    this.transactions = [];
  }

  /**
   * 지갑 정보 (공개 정보만)
   */
  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      publicKey: this.publicKey,
      createdAt: this.createdAt,
      transactionCount: this.transactions.length
    };
  }

  /**
   * 트랜잭션 서명
   */
  signTransaction(transaction) {
    if (transaction.from !== this.address) {
      throw new Error('이 지갑으로 서명할 수 없는 트랜잭션입니다');
    }

    const signature = CryptoUtils.signTransaction(transaction, this.privateKey);
    transaction.signature = signature;
    return transaction;
  }

  /**
   * 트랜잭션 추가
   */
  addTransaction(transaction) {
    this.transactions.push({
      ...transaction,
      timestamp: Date.now()
    });
  }

  /**
   * 트랜잭션 히스토리
   */
  getTransactionHistory() {
    return this.transactions.slice().reverse();
  }

  /**
   * JSON으로 내보내기 (백업용)
   */
  exportToJSON() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      publicKey: this.publicKey,
      privateKey: this.privateKey, // 주의: 안전하게 보관!
      createdAt: this.createdAt,
      transactions: this.transactions
    };
  }

  /**
   * JSON에서 불러오기
   */
  static importFromJSON(json) {
    const wallet = Object.create(Wallet.prototype);
    Object.assign(wallet, json);
    return wallet;
  }
}

/**
 * 지갑 관리자
 */
class WalletManager {
  constructor() {
    this.wallets = new Map();
  }

  /**
   * 새 지갑 생성
   */
  createWallet(name) {
    const wallet = new Wallet(name);
    this.wallets.set(wallet.id, wallet);
    return wallet;
  }

  /**
   * 지갑 조회
   */
  getWallet(id) {
    return this.wallets.get(id);
  }

  /**
   * 주소로 지갑 찾기
   */
  getWalletByAddress(address) {
    return Array.from(this.wallets.values()).find(w => w.address === address);
  }

  /**
   * 모든 지갑
   */
  getAllWallets() {
    return Array.from(this.wallets.values()).map(w => w.getPublicInfo());
  }

  /**
   * 지갑 삭제
   */
  deleteWallet(id) {
    return this.wallets.delete(id);
  }

  /**
   * 지갑 가져오기
   */
  importWallet(json) {
    const wallet = Wallet.importFromJSON(json);
    this.wallets.set(wallet.id, wallet);
    return wallet;
  }
}

module.exports = { Wallet, WalletManager };


const crypto = require('crypto');
const SHA256 = require('crypto-js/sha256');

/**
 * 암호화 유틸리티
 */
class CryptoUtils {
  /**
   * 키 쌍 생성 (공개키/개인키)
   */
  static generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    return { publicKey, privateKey };
  }
  
  /**
   * 트랜잭션 서명
   */
  static signTransaction(transaction, privateKey) {
    const transactionHash = SHA256(JSON.stringify(transaction)).toString();
    const sign = crypto.createSign('SHA256');
    sign.update(transactionHash);
    sign.end();
    
    const signature = sign.sign(privateKey, 'hex');
    return signature;
  }
  
  /**
   * 서명 검증
   */
  static verifySignature(transaction, signature, publicKey) {
    try {
      const transactionHash = SHA256(JSON.stringify(transaction)).toString();
      const verify = crypto.createVerify('SHA256');
      verify.update(transactionHash);
      verify.end();
      
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      console.error('서명 검증 실패:', error.message);
      return false;
    }
  }
  
  /**
   * 랜덤 해시 생성
   */
  static generateRandomHash() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * 주소 생성 (공개키로부터)
   */
  static generateAddress(publicKey) {
    const hash = SHA256(publicKey).toString();
    return 'addr_' + hash.substring(0, 40);
  }
}

module.exports = CryptoUtils;


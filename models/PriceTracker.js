/**
 * 가격 추적 및 시장 데이터 관리
 */
class PriceTracker {
  constructor() {
    this.currentPrice = 1.0;
    this.priceHistory = [];
    this.startPrice24h = 1.0;
    this.totalSupply = 0;
    this.startTime = Date.now();
    
    // 24시간 전 가격 기록 시작
    this.recordPrice();
    
    // 주기적 가격 업데이트
    setInterval(() => this.updatePrice(), 3000);
    setInterval(() => this.record24hPrice(), 60000); // 1분마다 기록
  }

  /**
   * 가격 업데이트 (시뮬레이션)
   */
  updatePrice() {
    // 변동성: -2% ~ +2%
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility;
    
    // 가격이 너무 낮아지지 않도록
    this.currentPrice = Math.max(0.01, this.currentPrice * (1 + change));
    
    // 가격 기록
    this.recordPrice();
  }

  /**
   * 현재 가격 기록
   */
  recordPrice() {
    const now = Date.now();
    this.priceHistory.push({
      price: this.currentPrice,
      timestamp: now
    });

    // 25시간 이상 된 기록 제거
    const cutoff = now - (25 * 60 * 60 * 1000);
    this.priceHistory = this.priceHistory.filter(p => p.timestamp > cutoff);
  }

  /**
   * 24시간 전 가격 기록
   */
  record24hPrice() {
    this.startPrice24h = this.currentPrice;
  }

  /**
   * 24시간 변화율 계산
   */
  get24hChange() {
    if (this.priceHistory.length < 2) {
      return 0;
    }

    // 24시간 전 가격 찾기
    const now = Date.now();
    const yesterday = now - (24 * 60 * 60 * 1000);
    
    let oldestPrice = this.priceHistory[0].price;
    for (let i = this.priceHistory.length - 1; i >= 0; i--) {
      if (this.priceHistory[i].timestamp <= yesterday) {
        oldestPrice = this.priceHistory[i].price;
        break;
      }
    }

    const change = ((this.currentPrice - oldestPrice) / oldestPrice) * 100;
    return parseFloat(change.toFixed(2));
  }

  /**
   * 시가총액 계산
   */
  getMarketCap() {
    return this.currentPrice * this.totalSupply;
  }

  /**
   * 총 공급량 업데이트
   */
  updateTotalSupply(supply) {
    this.totalSupply = supply;
  }

  /**
   * 현재 가격 가져오기
   */
  getCurrentPrice() {
    return this.currentPrice;
  }

  /**
   * 가격 데이터 가져오기
   */
  getPriceData() {
    return {
      currentPrice: parseFloat(this.currentPrice.toFixed(4)),
      change24h: this.get24hChange(),
      marketCap: parseFloat(this.getMarketCap().toFixed(2)),
      totalSupply: this.totalSupply,
      priceHistory: this.priceHistory.slice(-100) // 최근 100개
    };
  }
}

module.exports = PriceTracker;


/**
 * 가격 오라클 - 실시간 POSTY 가격 계산
 */
class PriceOracle {
  constructor() {
    this.basePrice = 1.0; // 기본 가격 (USD)
    this.currentPrice = this.basePrice;
    this.priceHistory = [];
    this.volume24h = 0;
    this.trades = [];
    this.marketCap = 0;
    
    // 시장 상수
    this.volatility = 0.02; // 변동성 2%
    this.trendStrength = 0.001; // 트렌드 강도
    this.meanReversion = 0.1; // 평균 회귀 속도
  }

  /**
   * 가격 업데이트 (수요/공급 기반)
   */
  updatePrice(blockchain, transactionPool) {
    const now = Date.now();
    
    // 1. 수요/공급 비율 계산
    const supplyDemandRatio = this.calculateSupplyDemand(blockchain, transactionPool);
    
    // 2. 거래량 기반 변동
    const volumeImpact = this.calculateVolumeImpact();
    
    // 3. 채굴 난이도 반영
    const difficultyImpact = blockchain.difficulty * 0.01;
    
    // 4. 반감기 영향
    const halvingImpact = blockchain.getCurrentReward() / blockchain.initialReward;
    
    // 5. 랜덤 변동 (시장 노이즈)
    const randomWalk = (Math.random() - 0.5) * this.volatility;
    
    // 6. 평균 회귀
    const meanReversionForce = (this.basePrice - this.currentPrice) * this.meanReversion;
    
    // 최종 가격 계산
    const priceChange = 
      supplyDemandRatio * 0.3 +
      volumeImpact * 0.2 +
      difficultyImpact * 0.1 +
      halvingImpact * 0.2 +
      randomWalk * 0.1 +
      meanReversionForce * 0.1;
    
    this.currentPrice = Math.max(0.01, this.currentPrice * (1 + priceChange));
    
    // 가격 히스토리 저장
    this.priceHistory.push({
      price: this.currentPrice,
      timestamp: now,
      volume: this.volume24h,
      change: priceChange
    });
    
    // 최근 24시간 데이터만 유지
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    this.priceHistory = this.priceHistory.filter(p => p.timestamp > oneDayAgo);
    
    // 시가총액 업데이트
    this.marketCap = this.currentPrice * blockchain.getChainInfo().totalSupply;
    
    return this.currentPrice;
  }

  /**
   * 수요/공급 비율 계산
   */
  calculateSupplyDemand(blockchain, transactionPool) {
    const totalSupply = blockchain.getChainInfo().totalSupply;
    const pendingTxCount = transactionPool.getSize();
    const activeAddresses = Object.keys(blockchain.balances).length;
    
    // 수요 = 대기 트랜잭션 + 활성 주소 수
    const demand = pendingTxCount * 10 + activeAddresses * 5;
    
    // 공급 = 총 공급량
    const supply = totalSupply || 1;
    
    // 수요/공급 비율 (정규화)
    return Math.tanh((demand - supply * 0.01) / 1000);
  }

  /**
   * 거래량 영향 계산
   */
  calculateVolumeImpact() {
    if (this.trades.length === 0) return 0;
    
    const recentTrades = this.trades.slice(-10);
    const buyVolume = recentTrades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.amount, 0);
    const sellVolume = recentTrades.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.amount, 0);
    
    const volumeDiff = buyVolume - sellVolume;
    return Math.tanh(volumeDiff / 1000) * this.volatility;
  }

  /**
   * 거래 기록
   */
  recordTrade(type, amount, price) {
    const now = Date.now();
    
    this.trades.push({
      type: type, // 'buy' or 'sell'
      amount: amount,
      price: price,
      timestamp: now
    });
    
    // 최근 24시간 거래만 유지
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    this.trades = this.trades.filter(t => t.timestamp > oneDayAgo);
    
    // 24시간 거래량 계산
    this.volume24h = this.trades.reduce((sum, t) => sum + t.amount * t.price, 0);
  }

  /**
   * 현재 가격 정보
   */
  getPriceInfo() {
    const history = this.priceHistory.slice(-24); // 최근 24개 데이터
    
    let high24h = this.currentPrice;
    let low24h = this.currentPrice;
    let open24h = history.length > 0 ? history[0].price : this.currentPrice;
    
    history.forEach(p => {
      if (p.price > high24h) high24h = p.price;
      if (p.price < low24h) low24h = p.price;
    });
    
    const change24h = ((this.currentPrice - open24h) / open24h) * 100;
    
    return {
      current: this.currentPrice,
      change24h: change24h,
      high24h: high24h,
      low24h: low24h,
      volume24h: this.volume24h,
      marketCap: this.marketCap,
      timestamp: Date.now()
    };
  }

  /**
   * 가격 차트 데이터
   */
  getChartData(period = '24h') {
    let dataPoints = this.priceHistory;
    
    if (period === '1h') {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      dataPoints = this.priceHistory.filter(p => p.timestamp > oneHourAgo);
    }
    
    return dataPoints.map(p => ({
      time: p.timestamp,
      price: p.price,
      volume: p.volume
    }));
  }

  /**
   * 기술적 지표 계산
   */
  getTechnicalIndicators() {
    if (this.priceHistory.length < 14) {
      return {
        rsi: 50,
        sma: this.currentPrice,
        ema: this.currentPrice
      };
    }
    
    const prices = this.priceHistory.slice(-14).map(p => p.price);
    
    // RSI (Relative Strength Index)
    const rsi = this.calculateRSI(prices);
    
    // SMA (Simple Moving Average)
    const sma = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    // EMA (Exponential Moving Average)
    const ema = this.calculateEMA(prices);
    
    return { rsi, sma, ema };
  }

  /**
   * RSI 계산
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }

  /**
   * EMA 계산
   */
  calculateEMA(prices, period = 14) {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  /**
   * 시장 심리 지수
   */
  getMarketSentiment() {
    const indicators = this.getTechnicalIndicators();
    const priceInfo = this.getPriceInfo();
    
    let sentiment = 0;
    
    // RSI 기반
    if (indicators.rsi > 70) sentiment -= 20; // 과매수
    else if (indicators.rsi < 30) sentiment += 20; // 과매도
    
    // 24시간 변화율 기반
    if (priceInfo.change24h > 5) sentiment += 15;
    else if (priceInfo.change24h < -5) sentiment -= 15;
    
    // 거래량 기반
    if (this.volume24h > 10000) sentiment += 10;
    
    // 정규화 (-100 ~ 100)
    sentiment = Math.max(-100, Math.min(100, sentiment));
    
    let label = 'Neutral';
    if (sentiment > 50) label = 'Very Bullish';
    else if (sentiment > 20) label = 'Bullish';
    else if (sentiment < -50) label = 'Very Bearish';
    else if (sentiment < -20) label = 'Bearish';
    
    return {
      score: sentiment,
      label: label
    };
  }
}

module.exports = PriceOracle;


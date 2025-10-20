/**
 * AI 트레이딩 봇 (간단한 버전)
 */
class AITrader {
  constructor(priceOracle, exchange) {
    this.priceOracle = priceOracle;
    this.exchange = exchange;
    this.strategies = new Map();
    this.activeTrades = [];
    this.tradeHistory = [];
    this.balance = {
      usd: 10000, // 초기 자금
      posty: 0
    };
    this.totalProfit = 0;
  }

  /**
   * 전략 등록
   */
  registerStrategy(name, config) {
    this.strategies.set(name, {
      name: name,
      enabled: true,
      config: config,
      performance: {
        wins: 0,
        losses: 0,
        totalProfit: 0
      }
    });
  }

  /**
   * 기본 전략들 초기화
   */
  initDefaultStrategies() {
    // RSI 전략
    this.registerStrategy('rsi', {
      oversold: 30,
      overbought: 70,
      positionSize: 0.1 // 자금의 10%
    });

    // Moving Average 크로스 전략
    this.registerStrategy('ma_cross', {
      fastPeriod: 7,
      slowPeriod: 14,
      positionSize: 0.15
    });

    // 브레이크아웃 전략
    this.registerStrategy('breakout', {
      period: 20,
      threshold: 0.02, // 2% 돌파
      positionSize: 0.1
    });
  }

  /**
   * 시장 분석
   */
  analyzeMarket() {
    const priceInfo = this.priceOracle.getPriceInfo();
    const indicators = this.priceOracle.getTechnicalIndicators();
    const sentiment = this.priceOracle.getMarketSentiment();

    return {
      price: priceInfo.current,
      change24h: priceInfo.change24h,
      rsi: indicators.rsi,
      sma: indicators.sma,
      ema: indicators.ema,
      sentiment: sentiment.score
    };
  }

  /**
   * RSI 전략
   */
  executeRSIStrategy(market) {
    const strategy = this.strategies.get('rsi');
    if (!strategy || !strategy.enabled) return;

    const { oversold, overbought, positionSize } = strategy.config;

    // 과매도 - 매수 시그널
    if (market.rsi < oversold && this.balance.usd > 0) {
      const amount = this.balance.usd * positionSize;
      this.buy(amount / market.price, market.price, 'rsi');
    }

    // 과매수 - 매도 시그널
    if (market.rsi > overbought && this.balance.posty > 0) {
      const amount = this.balance.posty * positionSize;
      this.sell(amount, market.price, 'rsi');
    }
  }

  /**
   * MA 크로스 전략
   */
  executeMAStrategy(market) {
    const strategy = this.strategies.get('ma_cross');
    if (!strategy || !strategy.enabled) return;

    const { positionSize } = strategy.config;

    // 골든 크로스 (EMA > SMA) - 매수
    if (market.ema > market.sma && this.balance.usd > 0) {
      const amount = this.balance.usd * positionSize;
      this.buy(amount / market.price, market.price, 'ma_cross');
    }

    // 데드 크로스 (EMA < SMA) - 매도
    if (market.ema < market.sma && this.balance.posty > 0) {
      const amount = this.balance.posty * positionSize;
      this.sell(amount, market.price, 'ma_cross');
    }
  }

  /**
   * 매수
   */
  buy(amount, price, strategy) {
    const cost = amount * price;
    
    if (this.balance.usd < cost) {
      return { success: false, reason: 'insufficient funds' };
    }

    this.balance.usd -= cost;
    this.balance.posty += amount;

    const trade = {
      id: Date.now(),
      type: 'buy',
      amount: amount,
      price: price,
      cost: cost,
      strategy: strategy,
      timestamp: Date.now()
    };

    this.activeTrades.push(trade);
    this.tradeHistory.push(trade);

    console.log(`🤖 AI Bot BUY: ${amount.toFixed(4)} POSTY @ $${price.toFixed(4)} (${strategy})`);

    return { success: true, trade: trade };
  }

  /**
   * 매도
   */
  sell(amount, price, strategy) {
    if (this.balance.posty < amount) {
      return { success: false, reason: 'insufficient POSTY' };
    }

    this.balance.posty -= amount;
    const revenue = amount * price;
    this.balance.usd += revenue;

    // 매수 포지션과 매칭하여 수익 계산
    let profit = 0;
    const matchingBuys = this.activeTrades.filter(t => t.type === 'buy' && t.strategy === strategy);
    
    if (matchingBuys.length > 0) {
      const avgBuyPrice = matchingBuys.reduce((sum, t) => sum + t.price, 0) / matchingBuys.length;
      profit = (price - avgBuyPrice) * amount;
      this.totalProfit += profit;

      // 전략 성과 업데이트
      const strategyObj = this.strategies.get(strategy);
      if (profit > 0) {
        strategyObj.performance.wins++;
      } else {
        strategyObj.performance.losses++;
      }
      strategyObj.performance.totalProfit += profit;
    }

    const trade = {
      id: Date.now(),
      type: 'sell',
      amount: amount,
      price: price,
      revenue: revenue,
      profit: profit,
      strategy: strategy,
      timestamp: Date.now()
    };

    this.tradeHistory.push(trade);

    console.log(`🤖 AI Bot SELL: ${amount.toFixed(4)} POSTY @ $${price.toFixed(4)} (Profit: $${profit.toFixed(2)})`);

    return { success: true, trade: trade };
  }

  /**
   * 봇 실행 (주기적으로 호출)
   */
  run() {
    const market = this.analyzeMarket();

    // 각 전략 실행
    this.executeRSIStrategy(market);
    this.executeMAStrategy(market);

    return {
      market: market,
      balance: this.balance,
      totalProfit: this.totalProfit
    };
  }

  /**
   * 성과 리포트
   */
  getPerformanceReport() {
    const totalTrades = this.tradeHistory.length;
    const buys = this.tradeHistory.filter(t => t.type === 'buy').length;
    const sells = this.tradeHistory.filter(t => t.type === 'sell').length;
    const profits = this.tradeHistory.filter(t => t.profit && t.profit > 0);
    const losses = this.tradeHistory.filter(t => t.profit && t.profit < 0);

    return {
      balance: this.balance,
      totalProfit: this.totalProfit,
      totalTrades: totalTrades,
      buys: buys,
      sells: sells,
      wins: profits.length,
      losses: losses.length,
      winRate: profits.length / (profits.length + losses.length) * 100 || 0,
      strategies: Array.from(this.strategies.values()).map(s => ({
        name: s.name,
        enabled: s.enabled,
        performance: s.performance
      }))
    };
  }

  /**
   * 전략 활성화/비활성화
   */
  toggleStrategy(strategyName, enabled) {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      strategy.enabled = enabled;
    }
  }

  /**
   * 최근 거래 내역
   */
  getRecentTrades(limit = 20) {
    return this.tradeHistory.slice(-limit).reverse();
  }
}

module.exports = AITrader;


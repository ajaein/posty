/**
 * 거래소 시스템
 */
class Exchange {
  constructor(priceOracle) {
    this.priceOracle = priceOracle;
    this.orderBook = {
      buy: [], // 매수 주문
      sell: [] // 매도 주문
    };
    this.completedTrades = [];
    this.userBalances = new Map(); // USD 잔액
  }

  /**
   * USD 입금
   */
  deposit(address, amount) {
    const current = this.userBalances.get(address) || { usd: 0, posty: 0 };
    current.usd += amount;
    this.userBalances.set(address, current);
    
    return current;
  }

  /**
   * POSTY 입금 (블록체인에서)
   */
  depositPosty(address, amount) {
    const current = this.userBalances.get(address) || { usd: 0, posty: 0 };
    current.posty += amount;
    this.userBalances.set(address, current);
    
    return current;
  }

  /**
   * 매수 주문
   */
  placeBuyOrder(address, amount, price) {
    const balance = this.userBalances.get(address) || { usd: 0, posty: 0 };
    const totalCost = amount * price;
    
    if (balance.usd < totalCost) {
      throw new Error('USD 잔액이 부족합니다');
    }
    
    // USD 동결
    balance.usd -= totalCost;
    this.userBalances.set(address, balance);
    
    const order = {
      id: Date.now() + Math.random(),
      address: address,
      type: 'buy',
      amount: amount,
      price: price,
      filled: 0,
      status: 'open',
      createdAt: Date.now()
    };
    
    this.orderBook.buy.push(order);
    this.orderBook.buy.sort((a, b) => b.price - a.price); // 가격 높은 순
    
    // 즉시 매칭 시도
    this.matchOrders();
    
    return order;
  }

  /**
   * 매도 주문
   */
  placeSellOrder(address, amount, price) {
    const balance = this.userBalances.get(address) || { usd: 0, posty: 0 };
    
    if (balance.posty < amount) {
      throw new Error('POSTY 잔액이 부족합니다');
    }
    
    // POSTY 동결
    balance.posty -= amount;
    this.userBalances.set(address, balance);
    
    const order = {
      id: Date.now() + Math.random(),
      address: address,
      type: 'sell',
      amount: amount,
      price: price,
      filled: 0,
      status: 'open',
      createdAt: Date.now()
    };
    
    this.orderBook.sell.push(order);
    this.orderBook.sell.sort((a, b) => a.price - b.price); // 가격 낮은 순
    
    // 즉시 매칭 시도
    this.matchOrders();
    
    return order;
  }

  /**
   * 시장가 매수
   */
  marketBuy(address, amount) {
    const currentPrice = this.priceOracle.currentPrice;
    const order = this.placeBuyOrder(address, amount, currentPrice * 1.05); // 5% 슬리피지
    
    this.priceOracle.recordTrade('buy', amount, currentPrice);
    
    return order;
  }

  /**
   * 시장가 매도
   */
  marketSell(address, amount) {
    const currentPrice = this.priceOracle.currentPrice;
    const order = this.placeSellOrder(address, amount, currentPrice * 0.95); // 5% 슬리피지
    
    this.priceOracle.recordTrade('sell', amount, currentPrice);
    
    return order;
  }

  /**
   * 주문 매칭
   */
  matchOrders() {
    while (this.orderBook.buy.length > 0 && this.orderBook.sell.length > 0) {
      const buyOrder = this.orderBook.buy[0];
      const sellOrder = this.orderBook.sell[0];
      
      // 가격이 맞지 않으면 중단
      if (buyOrder.price < sellOrder.price) break;
      
      // 매칭 가능한 수량
      const matchAmount = Math.min(
        buyOrder.amount - buyOrder.filled,
        sellOrder.amount - sellOrder.filled
      );
      
      // 거래 체결
      const tradePrice = (buyOrder.price + sellOrder.price) / 2;
      
      // 매수자에게 POSTY 지급
      const buyerBalance = this.userBalances.get(buyOrder.address);
      buyerBalance.posty += matchAmount;
      this.userBalances.set(buyOrder.address, buyerBalance);
      
      // 매도자에게 USD 지급
      const sellerBalance = this.userBalances.get(sellOrder.address);
      sellerBalance.usd += matchAmount * tradePrice;
      this.userBalances.set(sellOrder.address, sellerBalance);
      
      // 주문 업데이트
      buyOrder.filled += matchAmount;
      sellOrder.filled += matchAmount;
      
      // 체결 기록
      this.completedTrades.push({
        buyOrder: buyOrder.id,
        sellOrder: sellOrder.id,
        amount: matchAmount,
        price: tradePrice,
        timestamp: Date.now()
      });
      
      // 가격 오라클에 기록
      this.priceOracle.recordTrade('match', matchAmount, tradePrice);
      
      // 완료된 주문 제거
      if (buyOrder.filled >= buyOrder.amount) {
        buyOrder.status = 'filled';
        this.orderBook.buy.shift();
      }
      
      if (sellOrder.filled >= sellOrder.amount) {
        sellOrder.status = 'filled';
        this.orderBook.sell.shift();
      }
    }
  }

  /**
   * 잔액 조회
   */
  getBalance(address) {
    return this.userBalances.get(address) || { usd: 0, posty: 0 };
  }

  /**
   * 주문 취소
   */
  cancelOrder(orderId, address) {
    let order = null;
    let orderType = null;
    
    // 매수 주문에서 찾기
    const buyIndex = this.orderBook.buy.findIndex(o => o.id === orderId && o.address === address);
    if (buyIndex !== -1) {
      order = this.orderBook.buy[buyIndex];
      orderType = 'buy';
      this.orderBook.buy.splice(buyIndex, 1);
    }
    
    // 매도 주문에서 찾기
    const sellIndex = this.orderBook.sell.findIndex(o => o.id === orderId && o.address === address);
    if (sellIndex !== -1) {
      order = this.orderBook.sell[sellIndex];
      orderType = 'sell';
      this.orderBook.sell.splice(sellIndex, 1);
    }
    
    if (!order) {
      throw new Error('주문을 찾을 수 없습니다');
    }
    
    // 동결된 자산 반환
    const balance = this.userBalances.get(address);
    const remainingAmount = order.amount - order.filled;
    
    if (orderType === 'buy') {
      balance.usd += remainingAmount * order.price;
    } else {
      balance.posty += remainingAmount;
    }
    
    this.userBalances.set(address, balance);
    order.status = 'cancelled';
    
    return order;
  }

  /**
   * 호가창 정보
   */
  getOrderBook(depth = 10) {
    return {
      buy: this.orderBook.buy.slice(0, depth),
      sell: this.orderBook.sell.slice(0, depth)
    };
  }

  /**
   * 최근 거래 내역
   */
  getRecentTrades(limit = 20) {
    return this.completedTrades.slice(-limit).reverse();
  }

  /**
   * 내 주문 조회
   */
  getMyOrders(address) {
    const buyOrders = this.orderBook.buy.filter(o => o.address === address);
    const sellOrders = this.orderBook.sell.filter(o => o.address === address);
    
    return {
      buy: buyOrders,
      sell: sellOrders
    };
  }
}

module.exports = Exchange;


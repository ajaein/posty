/**
 * DeFi 시스템 - 유동성 풀 & 스왑
 */
class DeFiPool {
  constructor() {
    this.liquidityPools = new Map();
    this.swapHistory = [];
    this.totalValueLocked = 0;
  }

  /**
   * 유동성 풀 생성
   */
  createPool(token0, token1, fee = 0.003) {
    const poolId = `${token0}-${token1}`;
    
    if (this.liquidityPools.has(poolId)) {
      throw new Error('이미 존재하는 풀입니다');
    }

    this.liquidityPools.set(poolId, {
      id: poolId,
      token0: token0,
      token1: token1,
      reserve0: 0,
      reserve1: 0,
      fee: fee,
      lpTokenSupply: 0,
      lpHolders: new Map(),
      createdAt: Date.now()
    });

    return this.liquidityPools.get(poolId);
  }

  /**
   * 유동성 추가
   */
  addLiquidity(poolId, amount0, amount1, provider) {
    const pool = this.liquidityPools.get(poolId);
    if (!pool) throw new Error('풀을 찾을 수 없습니다');

    let lpTokens;

    if (pool.lpTokenSupply === 0) {
      // 첫 유동성 공급
      lpTokens = Math.sqrt(amount0 * amount1);
    } else {
      // 기존 비율에 맞춰 LP 토큰 발행
      const lpTokens0 = (amount0 * pool.lpTokenSupply) / pool.reserve0;
      const lpTokens1 = (amount1 * pool.lpTokenSupply) / pool.reserve1;
      lpTokens = Math.min(lpTokens0, lpTokens1);
    }

    pool.reserve0 += amount0;
    pool.reserve1 += amount1;
    pool.lpTokenSupply += lpTokens;

    // LP 토큰 지급
    const currentLp = pool.lpHolders.get(provider) || 0;
    pool.lpHolders.set(provider, currentLp + lpTokens);

    this.updateTVL();

    return {
      success: true,
      lpTokens: lpTokens,
      poolShare: (lpTokens / pool.lpTokenSupply) * 100
    };
  }

  /**
   * 유동성 제거
   */
  removeLiquidity(poolId, lpTokens, provider) {
    const pool = this.liquidityPools.get(poolId);
    if (!pool) throw new Error('풀을 찾을 수 없습니다');

    const userLp = pool.lpHolders.get(provider) || 0;
    if (userLp < lpTokens) {
      throw new Error('LP 토큰이 부족합니다');
    }

    const share = lpTokens / pool.lpTokenSupply;
    const amount0 = pool.reserve0 * share;
    const amount1 = pool.reserve1 * share;

    pool.reserve0 -= amount0;
    pool.reserve1 -= amount1;
    pool.lpTokenSupply -= lpTokens;
    pool.lpHolders.set(provider, userLp - lpTokens);

    this.updateTVL();

    return {
      success: true,
      amount0: amount0,
      amount1: amount1
    };
  }

  /**
   * 스왑 (Uniswap V2 스타일)
   */
  swap(poolId, tokenIn, amountIn, minAmountOut = 0) {
    const pool = this.liquidityPools.get(poolId);
    if (!pool) throw new Error('풀을 찾을 수 없습니다');

    let reserveIn, reserveOut;
    if (tokenIn === pool.token0) {
      reserveIn = pool.reserve0;
      reserveOut = pool.reserve1;
    } else if (tokenIn === pool.token1) {
      reserveIn = pool.reserve1;
      reserveOut = pool.reserve0;
    } else {
      throw new Error('잘못된 토큰입니다');
    }

    // 수수료 차감
    const amountInWithFee = amountIn * (1 - pool.fee);

    // Constant Product Formula: x * y = k
    const amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

    if (amountOut < minAmountOut) {
      throw new Error('슬리피지가 너무 큽니다');
    }

    // 리저브 업데이트
    if (tokenIn === pool.token0) {
      pool.reserve0 += amountIn;
      pool.reserve1 -= amountOut;
    } else {
      pool.reserve1 += amountIn;
      pool.reserve0 -= amountOut;
    }

    // 스왑 기록
    this.swapHistory.push({
      poolId: poolId,
      tokenIn: tokenIn,
      tokenOut: tokenIn === pool.token0 ? pool.token1 : pool.token0,
      amountIn: amountIn,
      amountOut: amountOut,
      fee: amountIn * pool.fee,
      timestamp: Date.now()
    });

    return {
      success: true,
      amountOut: amountOut,
      priceImpact: this.calculatePriceImpact(reserveIn, reserveOut, amountIn, amountOut)
    };
  }

  /**
   * 가격 영향 계산
   */
  calculatePriceImpact(reserveIn, reserveOut, amountIn, amountOut) {
    const priceBefore = reserveOut / reserveIn;
    const priceAfter = (reserveOut - amountOut) / (reserveIn + amountIn);
    return ((priceAfter - priceBefore) / priceBefore) * 100;
  }

  /**
   * 스왑 예상 금액
   */
  getAmountOut(poolId, tokenIn, amountIn) {
    const pool = this.liquidityPools.get(poolId);
    if (!pool) return 0;

    let reserveIn, reserveOut;
    if (tokenIn === pool.token0) {
      reserveIn = pool.reserve0;
      reserveOut = pool.reserve1;
    } else {
      reserveIn = pool.reserve1;
      reserveOut = pool.reserve0;
    }

    const amountInWithFee = amountIn * (1 - pool.fee);
    return (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
  }

  /**
   * TVL 업데이트
   */
  updateTVL() {
    let tvl = 0;
    for (const pool of this.liquidityPools.values()) {
      tvl += pool.reserve0 + pool.reserve1; // 간단화: 모두 같은 가격 기준
    }
    this.totalValueLocked = tvl;
  }

  /**
   * 풀 정보
   */
  getPoolInfo(poolId) {
    const pool = this.liquidityPools.get(poolId);
    if (!pool) return null;

    return {
      ...pool,
      price0: pool.reserve1 / pool.reserve0,
      price1: pool.reserve0 / pool.reserve1,
      lpHolders: undefined
    };
  }

  /**
   * 모든 풀
   */
  getAllPools() {
    return Array.from(this.liquidityPools.values()).map(pool => this.getPoolInfo(pool.id));
  }

  /**
   * 사용자 유동성
   */
  getUserLiquidity(provider) {
    const liquidity = [];
    
    for (const pool of this.liquidityPools.values()) {
      const lpTokens = pool.lpHolders.get(provider);
      if (lpTokens && lpTokens > 0) {
        const share = lpTokens / pool.lpTokenSupply;
        liquidity.push({
          poolId: pool.id,
          lpTokens: lpTokens,
          share: share * 100,
          value0: pool.reserve0 * share,
          value1: pool.reserve1 * share
        });
      }
    }
    
    return liquidity;
  }
}

module.exports = DeFiPool;


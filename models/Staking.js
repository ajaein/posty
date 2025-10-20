/**
 * 스테이킹 시스템
 */
class Staking {
  constructor() {
    this.stakes = new Map(); // 주소별 스테이킹 정보
    this.pools = new Map(); // 스테이킹 풀
    this.totalStaked = 0;
    this.apr = 12; // 연 12% 수익률
    
    // 기본 풀 생성
    this.createPool('flexible', '자유 예치', 12, 0);
    this.createPool('locked30', '30일 고정', 18, 30);
    this.createPool('locked90', '90일 고정', 24, 90);
    this.createPool('locked180', '180일 고정', 36, 180);
  }

  /**
   * 풀 생성
   */
  createPool(id, name, apr, lockDays) {
    this.pools.set(id, {
      id: id,
      name: name,
      apr: apr,
      lockDays: lockDays,
      totalStaked: 0,
      stakers: 0
    });
  }

  /**
   * 스테이킹
   */
  stake(address, amount, poolId = 'flexible') {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error('존재하지 않는 풀입니다');
    }

    const userStake = this.stakes.get(address) || {
      pools: {}
    };

    if (!userStake.pools[poolId]) {
      userStake.pools[poolId] = {
        amount: 0,
        startTime: Date.now(),
        lastClaim: Date.now(),
        rewards: 0
      };
      pool.stakers++;
    }

    const stake = userStake.pools[poolId];
    stake.amount += amount;
    stake.startTime = Date.now();
    
    this.totalStaked += amount;
    pool.totalStaked += amount;
    
    this.stakes.set(address, userStake);

    return {
      success: true,
      pool: poolId,
      amount: stake.amount,
      apr: pool.apr
    };
  }

  /**
   * 언스테이킹
   */
  unstake(address, amount, poolId) {
    const userStake = this.stakes.get(address);
    if (!userStake || !userStake.pools[poolId]) {
      throw new Error('스테이킹 정보가 없습니다');
    }

    const stake = userStake.pools[poolId];
    const pool = this.pools.get(poolId);

    // 락업 기간 확인
    if (pool.lockDays > 0) {
      const lockEndTime = stake.startTime + (pool.lockDays * 24 * 60 * 60 * 1000);
      if (Date.now() < lockEndTime) {
        throw new Error(`아직 락업 기간입니다. ${Math.ceil((lockEndTime - Date.now()) / (24 * 60 * 60 * 1000))}일 남음`);
      }
    }

    if (stake.amount < amount) {
      throw new Error('스테이킹 잔액이 부족합니다');
    }

    // 보상 자동 청구
    const rewards = this.calculateRewards(address, poolId);
    stake.rewards += rewards;

    stake.amount -= amount;
    this.totalStaked -= amount;
    pool.totalStaked -= amount;

    if (stake.amount === 0) {
      delete userStake.pools[poolId];
      pool.stakers--;
    }

    this.stakes.set(address, userStake);

    return {
      success: true,
      unstaked: amount,
      rewards: rewards
    };
  }

  /**
   * 보상 계산
   */
  calculateRewards(address, poolId) {
    const userStake = this.stakes.get(address);
    if (!userStake || !userStake.pools[poolId]) {
      return 0;
    }

    const stake = userStake.pools[poolId];
    const pool = this.pools.get(poolId);
    
    const now = Date.now();
    const timeDiff = now - stake.lastClaim;
    const daysPassed = timeDiff / (24 * 60 * 60 * 1000);
    
    // APR 기반 보상 계산
    const rewards = stake.amount * (pool.apr / 100) * (daysPassed / 365);
    
    return rewards;
  }

  /**
   * 보상 청구
   */
  claimRewards(address, poolId) {
    const userStake = this.stakes.get(address);
    if (!userStake || !userStake.pools[poolId]) {
      throw new Error('스테이킹 정보가 없습니다');
    }

    const stake = userStake.pools[poolId];
    const rewards = this.calculateRewards(address, poolId);
    
    stake.rewards += rewards;
    stake.lastClaim = Date.now();
    
    const totalRewards = stake.rewards;
    stake.rewards = 0;
    
    this.stakes.set(address, userStake);

    return {
      success: true,
      rewards: totalRewards
    };
  }

  /**
   * 사용자 스테이킹 정보
   */
  getUserStaking(address) {
    const userStake = this.stakes.get(address);
    if (!userStake) {
      return {
        totalStaked: 0,
        pools: {}
      };
    }

    const poolsInfo = {};
    let totalStaked = 0;

    for (const [poolId, stake] of Object.entries(userStake.pools)) {
      const pool = this.pools.get(poolId);
      const pendingRewards = this.calculateRewards(address, poolId);
      
      poolsInfo[poolId] = {
        poolName: pool.name,
        amount: stake.amount,
        apr: pool.apr,
        startTime: stake.startTime,
        pendingRewards: pendingRewards,
        lockDays: pool.lockDays
      };
      
      totalStaked += stake.amount;
    }

    return {
      totalStaked: totalStaked,
      pools: poolsInfo
    };
  }

  /**
   * 모든 풀 정보
   */
  getAllPools() {
    return Array.from(this.pools.values());
  }

  /**
   * 스테이킹 통계
   */
  getStats() {
    return {
      totalStaked: this.totalStaked,
      totalPools: this.pools.size,
      pools: Array.from(this.pools.values()).map(pool => ({
        id: pool.id,
        name: pool.name,
        apr: pool.apr,
        totalStaked: pool.totalStaked,
        stakers: pool.stakers
      }))
    };
  }
}

module.exports = Staking;


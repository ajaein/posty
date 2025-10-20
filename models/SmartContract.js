const { v4: uuidv4 } = require('uuid');
const SHA256 = require('crypto-js/sha256');

/**
 * 스마트 컨트랙트 클래스
 */
class SmartContract {
  constructor(creator, code, name, description) {
    this.id = uuidv4();
    this.creator = creator;
    this.code = code;
    this.name = name;
    this.description = description;
    this.state = {};
    this.createdAt = Date.now();
    this.balance = 0;
    this.isActive = true;
  }

  /**
   * 컨트랙트 실행
   */
  execute(method, params, caller, value = 0) {
    if (!this.isActive) {
      throw new Error('비활성화된 컨트랙트입니다');
    }

    try {
      // 컨트랙트 환경 설정
      const context = {
        state: this.state,
        balance: this.balance,
        caller: caller,
        value: value,
        blockTime: Date.now(),
        contractAddress: this.id
      };

      // 컨트랙트 코드 실행
      const contractFunction = new Function('context', 'method', 'params', `
        ${this.code}
        return execute(context, method, params);
      `);

      const result = contractFunction(context, method, params);

      // 상태 업데이트
      this.state = context.state;
      this.balance = context.balance;

      return {
        success: true,
        result: result,
        gasUsed: this.calculateGas(method, params)
      };
    } catch (error) {
      throw new Error(`컨트랙트 실행 실패: ${error.message}`);
    }
  }

  /**
   * 가스 계산 (간단한 버전)
   */
  calculateGas(method, params) {
    const baseGas = 21000;
    const methodGas = method.length * 100;
    const paramsGas = JSON.stringify(params).length * 10;
    return baseGas + methodGas + paramsGas;
  }

  /**
   * 컨트랙트 비활성화
   */
  deactivate() {
    this.isActive = false;
  }

  /**
   * 컨트랙트 정보
   */
  getInfo() {
    return {
      id: this.id,
      creator: this.creator,
      name: this.name,
      description: this.description,
      balance: this.balance,
      isActive: this.isActive,
      createdAt: this.createdAt
    };
  }
}

/**
 * 스마트 컨트랙트 관리자
 */
class SmartContractManager {
  constructor() {
    this.contracts = new Map();
    this.deployedContracts = [];
  }

  /**
   * 컨트랙트 배포
   */
  deploy(creator, code, name, description) {
    const contract = new SmartContract(creator, code, name, description);
    this.contracts.set(contract.id, contract);
    this.deployedContracts.push({
      id: contract.id,
      name: name,
      creator: creator,
      deployedAt: Date.now()
    });

    return contract;
  }

  /**
   * 컨트랙트 조회
   */
  getContract(contractId) {
    return this.contracts.get(contractId);
  }

  /**
   * 컨트랙트 실행
   */
  executeContract(contractId, method, params, caller, value = 0) {
    const contract = this.getContract(contractId);
    if (!contract) {
      throw new Error('컨트랙트를 찾을 수 없습니다');
    }

    return contract.execute(method, params, caller, value);
  }

  /**
   * 모든 컨트랙트
   */
  getAllContracts() {
    return Array.from(this.contracts.values()).map(c => c.getInfo());
  }

  /**
   * 기본 컨트랙트 템플릿
   */
  static getTemplates() {
    return {
      token: `
        function execute(context, method, params) {
          if (!context.state.balances) {
            context.state.balances = {};
            context.state.totalSupply = 0;
          }
          
          if (method === 'mint') {
            const { to, amount } = params;
            context.state.balances[to] = (context.state.balances[to] || 0) + amount;
            context.state.totalSupply += amount;
            return { success: true, balance: context.state.balances[to] };
          }
          
          if (method === 'transfer') {
            const { from, to, amount } = params;
            if ((context.state.balances[from] || 0) < amount) {
              throw new Error('잔액 부족');
            }
            context.state.balances[from] -= amount;
            context.state.balances[to] = (context.state.balances[to] || 0) + amount;
            return { success: true };
          }
          
          if (method === 'balanceOf') {
            const { address } = params;
            return context.state.balances[address] || 0;
          }
          
          throw new Error('Unknown method');
        }
      `,
      
      staking: `
        function execute(context, method, params) {
          if (!context.state.stakes) {
            context.state.stakes = {};
            context.state.rewards = {};
          }
          
          if (method === 'stake') {
            const { user, amount } = params;
            context.state.stakes[user] = (context.state.stakes[user] || 0) + amount;
            context.state.rewards[user] = context.blockTime;
            return { success: true, totalStaked: context.state.stakes[user] };
          }
          
          if (method === 'unstake') {
            const { user, amount } = params;
            if ((context.state.stakes[user] || 0) < amount) {
              throw new Error('스테이킹 잔액 부족');
            }
            context.state.stakes[user] -= amount;
            return { success: true, totalStaked: context.state.stakes[user] };
          }
          
          if (method === 'getReward') {
            const { user } = params;
            const stakeTime = context.blockTime - (context.state.rewards[user] || context.blockTime);
            const reward = (context.state.stakes[user] || 0) * 0.0001 * (stakeTime / 86400000);
            return { reward: Math.floor(reward) };
          }
          
          throw new Error('Unknown method');
        }
      `,
      
      nft: `
        function execute(context, method, params) {
          if (!context.state.nfts) {
            context.state.nfts = {};
            context.state.owners = {};
            context.state.nextId = 1;
          }
          
          if (method === 'mint') {
            const { to, metadata } = params;
            const tokenId = context.state.nextId++;
            context.state.nfts[tokenId] = metadata;
            context.state.owners[tokenId] = to;
            return { success: true, tokenId: tokenId };
          }
          
          if (method === 'transfer') {
            const { from, to, tokenId } = params;
            if (context.state.owners[tokenId] !== from) {
              throw new Error('NFT 소유자가 아닙니다');
            }
            context.state.owners[tokenId] = to;
            return { success: true };
          }
          
          if (method === 'ownerOf') {
            const { tokenId } = params;
            return context.state.owners[tokenId];
          }
          
          throw new Error('Unknown method');
        }
      `
    };
  }
}

module.exports = { SmartContract, SmartContractManager };


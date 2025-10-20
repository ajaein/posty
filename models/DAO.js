const { v4: uuidv4 } = require('uuid');

/**
 * 탈중앙화 자율 조직 (DAO) - 거버넌스
 */
class DAO {
  constructor() {
    this.proposals = new Map();
    this.votes = new Map();
    this.members = new Map();
    this.votingPower = new Map(); // 주소 -> 투표권
    this.quorum = 0.1; // 10% 정족수
    this.votingPeriod = 7 * 24 * 60 * 60 * 1000; // 7일
  }

  /**
   * 멤버 등록 (토큰 보유량 기반)
   */
  registerMember(address, tokenAmount) {
    this.members.set(address, {
      address: address,
      joinedAt: Date.now(),
      proposalsCreated: 0,
      votesParticipated: 0
    });

    this.votingPower.set(address, tokenAmount);
  }

  /**
   * 투표권 업데이트
   */
  updateVotingPower(address, tokenAmount) {
    this.votingPower.set(address, tokenAmount);
  }

  /**
   * 제안 생성
   */
  createProposal(title, description, proposer, actions = []) {
    if (!this.members.has(proposer)) {
      throw new Error('DAO 멤버만 제안을 생성할 수 있습니다');
    }

    const proposalId = uuidv4();
    const now = Date.now();

    const proposal = {
      id: proposalId,
      title: title,
      description: description,
      proposer: proposer,
      actions: actions, // 실행할 액션 목록
      status: 'active',
      createdAt: now,
      startTime: now,
      endTime: now + this.votingPeriod,
      votesFor: 0,
      votesAgainst: 0,
      votersFor: [],
      votersAgainst: []
    };

    this.proposals.set(proposalId, proposal);

    const member = this.members.get(proposer);
    member.proposalsCreated++;

    return proposal;
  }

  /**
   * 투표
   */
  vote(proposalId, voter, support) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('제안을 찾을 수 없습니다');
    }

    if (!this.members.has(voter)) {
      throw new Error('DAO 멤버만 투표할 수 있습니다');
    }

    if (proposal.status !== 'active') {
      throw new Error('진행 중인 제안이 아닙니다');
    }

    if (Date.now() > proposal.endTime) {
      throw new Error('투표 기간이 종료되었습니다');
    }

    // 이미 투표했는지 확인
    const voteKey = `${proposalId}-${voter}`;
    if (this.votes.has(voteKey)) {
      throw new Error('이미 투표하셨습니다');
    }

    const votingPower = this.votingPower.get(voter) || 0;

    if (support) {
      proposal.votesFor += votingPower;
      proposal.votersFor.push(voter);
    } else {
      proposal.votesAgainst += votingPower;
      proposal.votersAgainst.push(voter);
    }

    this.votes.set(voteKey, {
      proposalId: proposalId,
      voter: voter,
      support: support,
      votingPower: votingPower,
      timestamp: Date.now()
    });

    const member = this.members.get(voter);
    member.votesParticipated++;

    return {
      success: true,
      votingPower: votingPower,
      currentVotes: {
        for: proposal.votesFor,
        against: proposal.votesAgainst
      }
    };
  }

  /**
   * 제안 마감
   */
  finalizeProposal(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('제안을 찾을 수 없습니다');
    }

    if (proposal.status !== 'active') {
      throw new Error('이미 처리된 제안입니다');
    }

    if (Date.now() < proposal.endTime) {
      throw new Error('아직 투표 기간입니다');
    }

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const totalVotingPower = Array.from(this.votingPower.values()).reduce((sum, v) => sum + v, 0);
    const participation = totalVotes / totalVotingPower;

    // 정족수 확인
    if (participation < this.quorum) {
      proposal.status = 'failed';
      proposal.reason = '정족수 미달';
      return { success: false, reason: '정족수 미달' };
    }

    // 투표 결과
    if (proposal.votesFor > proposal.votesAgainst) {
      proposal.status = 'passed';
      
      // 액션 실행 (시뮬레이션)
      this.executeActions(proposal.actions);
      
      return {
        success: true,
        status: 'passed',
        votesFor: proposal.votesFor,
        votesAgainst: proposal.votesAgainst
      };
    } else {
      proposal.status = 'rejected';
      return {
        success: false,
        status: 'rejected',
        votesFor: proposal.votesFor,
        votesAgainst: proposal.votesAgainst
      };
    }
  }

  /**
   * 액션 실행
   */
  executeActions(actions) {
    // 제안된 액션 실행 (예: 파라미터 변경, 자금 이동 등)
    actions.forEach(action => {
      console.log(`DAO 액션 실행: ${action.type}`, action.params);
    });
  }

  /**
   * 제안 정보
   */
  getProposal(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const totalVotingPower = Array.from(this.votingPower.values()).reduce((sum, v) => sum + v, 0);

    return {
      ...proposal,
      participation: totalVotes / totalVotingPower * 100,
      quorumReached: (totalVotes / totalVotingPower) >= this.quorum,
      timeLeft: Math.max(0, proposal.endTime - Date.now()),
      votersFor: undefined,
      votersAgainst: undefined,
      voterCount: {
        for: proposal.votersFor.length,
        against: proposal.votersAgainst.length
      }
    };
  }

  /**
   * 모든 제안
   */
  getAllProposals() {
    return Array.from(this.proposals.values())
      .map(p => this.getProposal(p.id))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 활성 제안
   */
  getActiveProposals() {
    return this.getAllProposals().filter(p => p.status === 'active');
  }

  /**
   * 사용자 투표 내역
   */
  getUserVotes(voter) {
    return Array.from(this.votes.values())
      .filter(v => v.voter === voter)
      .map(v => ({
        ...v,
        proposal: this.getProposal(v.proposalId)
      }));
  }

  /**
   * DAO 통계
   */
  getStats() {
    const totalMembers = this.members.size;
    const totalProposals = this.proposals.size;
    const activeProposals = this.getActiveProposals().length;
    const passed = Array.from(this.proposals.values()).filter(p => p.status === 'passed').length;

    return {
      totalMembers: totalMembers,
      totalProposals: totalProposals,
      activeProposals: activeProposals,
      passedProposals: passed,
      quorum: this.quorum * 100,
      votingPeriodDays: this.votingPeriod / (24 * 60 * 60 * 1000)
    };
  }
}

module.exports = DAO;


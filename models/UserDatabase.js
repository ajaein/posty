const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * 간단한 JSON 기반 사용자 데이터베이스
 */
class UserDatabase {
  constructor(dbPath = './data/users.json') {
    this.dbPath = dbPath;
    this.users = [];
    this.ensureDataDirectory();
    this.load();
  }

  ensureDataDirectory() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        this.users = JSON.parse(data);
      } else {
        this.users = [];
        this.save();
      }
    } catch (error) {
      console.error('사용자 데이터베이스 로드 오류:', error);
      this.users = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('사용자 데이터베이스 저장 오류:', error);
    }
  }

  /**
   * 사용자 등록
   */
  async register(email, password, username) {
    // 이메일 중복 체크
    if (this.findByEmail(email)) {
      throw new Error('이미 사용 중인 이메일입니다');
    }

    // 사용자명 중복 체크
    if (this.findByUsername(username)) {
      throw new Error('이미 사용 중인 사용자명입니다');
    }

    // 비밀번호 해시
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = {
      id: uuidv4(),
      email: email.toLowerCase(),
      username: username,
      passwordHash: passwordHash,
      createdAt: Date.now(),
      lastLogin: null,
      balance: 0,
      totalMined: 0,
      walletAddress: null
    };

    this.users.push(user);
    this.save();

    return this.sanitizeUser(user);
  }

  /**
   * 사용자 로그인
   */
  async login(email, password) {
    const user = this.findByEmail(email);
    
    if (!user) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 마지막 로그인 시간 업데이트
    user.lastLogin = Date.now();
    this.save();

    return this.sanitizeUser(user);
  }

  /**
   * 이메일로 사용자 찾기
   */
  findByEmail(email) {
    return this.users.find(u => u.email === email.toLowerCase());
  }

  /**
   * 사용자명으로 찾기
   */
  findByUsername(username) {
    return this.users.find(u => u.username === username);
  }

  /**
   * ID로 사용자 찾기
   */
  findById(id) {
    return this.users.find(u => u.id === id);
  }

  /**
   * 사용자 업데이트
   */
  updateUser(id, updates) {
    const user = this.findById(id);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    Object.assign(user, updates);
    this.save();

    return this.sanitizeUser(user);
  }

  /**
   * 민감한 정보 제거
   */
  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * 모든 사용자 가져오기 (관리자용)
   */
  getAllUsers() {
    return this.users.map(u => this.sanitizeUser(u));
  }

  /**
   * 사용자 수
   */
  getUserCount() {
    return this.users.length;
  }
}

module.exports = UserDatabase;


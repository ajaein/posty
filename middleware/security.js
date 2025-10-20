const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

/**
 * 보안 헤더 설정
 */
const securityHeaders = helmet({
  contentSecurityPolicy: false, // CSP 비활성화 (개발 단계)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Rate Limiting - API 요청 제한
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 채굴 Rate Limiting - 채굴 요청 제한
 */
const miningLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5분
  max: 20, // 최대 20회 채굴
  message: {
    success: false,
    message: '채굴 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  }
});

/**
 * 입력 검증 미들웨어
 */
const validateInput = {
  /**
   * 채굴자 등록 검증
   */
  minerRegister: (req, res, next) => {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: '유효한 이름을 입력해주세요.'
      });
    }
    
    // XSS 방지 - HTML 태그 제거
    if (name !== validator.escape(name)) {
      return res.status(400).json({
        success: false,
        message: '이름에 특수 문자를 사용할 수 없습니다.'
      });
    }
    
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: '이름은 2-50자 사이여야 합니다.'
      });
    }
    
    next();
  },
  
  /**
   * 트랜잭션 검증
   */
  transaction: (req, res, next) => {
    const { from, to, amount } = req.body;
    
    if (!from || !to || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: '발신자, 수신자, 금액이 모두 필요합니다.'
      });
    }
    
    if (typeof from !== 'string' || typeof to !== 'string') {
      return res.status(400).json({
        success: false,
        message: '유효한 주소를 입력해주세요.'
      });
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: '금액은 0보다 큰 숫자여야 합니다.'
      });
    }
    
    if (parsedAmount > 1000000) {
      return res.status(400).json({
        success: false,
        message: '한 번에 전송할 수 있는 최대 금액은 1,000,000 코인입니다.'
      });
    }
    
    next();
  },
  
  /**
   * 난이도 검증
   */
  difficulty: (req, res, next) => {
    const { difficulty } = req.body;
    
    if (!difficulty) {
      return res.status(400).json({
        success: false,
        message: '난이도 값이 필요합니다.'
      });
    }
    
    const parsedDifficulty = parseInt(difficulty);
    if (isNaN(parsedDifficulty) || parsedDifficulty < 1 || parsedDifficulty > 10) {
      return res.status(400).json({
        success: false,
        message: '난이도는 1에서 10 사이의 값이어야 합니다.'
      });
    }
    
    next();
  }
};

/**
 * XSS 보호 - 응답 데이터 정제
 */
const sanitizeOutput = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // 응답 데이터에서 민감한 정보 제거 가능
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * 에러 핸들러
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ 에러 발생:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : '서버 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  securityHeaders,
  apiLimiter,
  miningLimiter,
  validateInput,
  sanitizeOutput,
  errorHandler
};


const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * JWT 인증 미들웨어
 */
class AuthMiddleware {
  /**
   * 토큰 생성
   */
  static generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, config.security.jwtSecret, { expiresIn });
  }

  /**
   * 토큰 검증
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.security.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * 인증 미들웨어
   */
  static authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    const decoded = AuthMiddleware.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다'
      });
    }

    req.user = decoded;
    next();
  }

  /**
   * 선택적 인증 (토큰이 있으면 검증, 없어도 통과)
   */
  static optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      const decoded = AuthMiddleware.verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  }

  /**
   * 권한 체크 미들웨어
   */
  static requireRole(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: '권한이 없습니다'
        });
      }

      next();
    };
  }

  /**
   * 리프레시 토큰 생성
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.security.jwtSecret, { expiresIn: '7d' });
  }
}

module.exports = AuthMiddleware;


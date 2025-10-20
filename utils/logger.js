const fs = require('fs');
const path = require('path');

/**
 * 로깅 유틸리티
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
  }
  
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  getTimestamp() {
    return new Date().toISOString();
  }
  
  getLogFileName() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `app-${date}.log`);
  }
  
  writeToFile(level, message, data) {
    const logEntry = {
      timestamp: this.getTimestamp(),
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };
    
    const logString = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(this.getLogFileName(), logString);
    } catch (error) {
      console.error('로그 파일 쓰기 실패:', error.message);
    }
  }
  
  info(message, data) {
    console.log(`ℹ️  [INFO] ${message}`);
    this.writeToFile('info', message, data);
  }
  
  warn(message, data) {
    console.warn(`⚠️  [WARN] ${message}`);
    this.writeToFile('warn', message, data);
  }
  
  error(message, data) {
    console.error(`❌ [ERROR] ${message}`);
    this.writeToFile('error', message, data);
  }
  
  success(message, data) {
    console.log(`✅ [SUCCESS] ${message}`);
    this.writeToFile('success', message, data);
  }
  
  mining(message, data) {
    console.log(`⛏️  [MINING] ${message}`);
    this.writeToFile('mining', message, data);
  }
}

module.exports = new Logger();


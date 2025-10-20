// Posty Mining System V2.2 - JavaScript Application

// 전역 변수
let currentMiner = null;
let authToken = null;
let ws = null;
let currentTheme = 'light';
let priceChart = null;
let currentTab = 'mining';

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initTabs();
    initEventListeners();
    loadSavedSession();
    connectWebSocket();
    startPriceUpdates();
    
    // 데이터 로드
    await loadStats();
    await loadBlockchain();
    await loadMiners();
    await loadPriceData();
    
    // 주기적 업데이트
    setInterval(loadStats, 5000);
    setInterval(loadPriceData, 10000);
});

// 이벤트 리스너 초기화
function initEventListeners() {
    // 테마 토글
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // 등록 버튼 (레거시)
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', registerMiner);
    }
    
    // 채굴 버튼
    const mineBtn = document.getElementById('mineBtn');
    if (mineBtn) {
        mineBtn.addEventListener('click', startMining);
    }
    
    // 로그인 버튼
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => showAuthModal('login'));
    }
    
    // 회원가입 버튼
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.addEventListener('click', () => showAuthModal('register'));
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // 모달 닫기
    const closeAuthModal = document.getElementById('closeAuthModal');
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', hideAuthModal);
    }
    
    // 폼 전환
    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('register');
        });
    }
    
    const showLogin = document.getElementById('showLogin');
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthForm('login');
        });
    }
    
    // 로그인 폼 제출
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 회원가입 폼 제출
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // 모달 외부 클릭 시 닫기
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                hideAuthModal();
            }
        });
    }
}

// 테마 관리
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        currentTheme = saved;
        document.body.setAttribute('data-theme', currentTheme);
        updateThemeIcon();
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// 탭 관리
function initTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
    
    // 탭별 데이터 로드
    if (tabName === 'exchange') loadExchange();
    if (tabName === 'staking') loadStaking();
    if (tabName === 'contract') loadContracts();
}

// WebSocket
function connectWebSocket() {
    try {
        ws = new WebSocket(`ws://${window.location.host}`);
        
        ws.onopen = () => {
            // WebSocket 연결됨 (조용히 처리)
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        ws.onerror = () => {
            // WebSocket 오류 발생 (조용히 처리)
        };
        
        ws.onclose = () => {
            // 연결 종료 시 재연결 시도 (조용히 처리)
            setTimeout(connectWebSocket, 5000);
        };
    } catch (error) {
        // WebSocket 연결 실패 시 재시도
        setTimeout(connectWebSocket, 5000);
    }
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'init':
            // 초기 데이터 수신
            if (data.data.priceData) {
                updatePriceDisplay(data.data.priceData);
            }
            break;
        case 'blockMined':
            // 새 블록 채굴 시 데이터만 업데이트 (알림 없음)
            loadStats();
            loadBlockchain();
            break;
        case 'priceUpdate':
            updatePriceDisplay(data.data);
            break;
        case 'transactionAdded':
            // 새 트랜잭션 추가 시 데이터 업데이트
            loadStats();
            break;
    }
}

// 토스트 알림
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
        <div>${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// API 호출
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(endpoint, options);
    return await response.json();
}

// 통계 로드
async function loadStats() {
    const data = await apiCall('/api/stats');
    if (data.success) {
        updateStatsDisplay(data.data);
    }
}

function updateStatsDisplay(stats) {
    document.getElementById('blockCount').textContent = stats.blockchain.length;
    document.getElementById('difficulty').textContent = stats.blockchain.difficulty;
    document.getElementById('miningReward').textContent = stats.blockchain.currentReward.toFixed(2);
    document.getElementById('pendingTx').textContent = stats.blockchain.pendingTransactions;
    document.getElementById('totalMiners').textContent = stats.miners.total;
    document.getElementById('totalSupply').textContent = stats.blockchain.totalSupply.toFixed(2);
    
    // 가격 정보 업데이트
    if (stats.price) {
        updatePriceDisplay(stats.price);
    }
}

// 가격 업데이트
function startPriceUpdates() {
    // WebSocket으로 실시간 가격 업데이트 받음
    setInterval(loadPriceData, 10000);
}

function updatePriceDisplay(priceData) {
    const priceEl = document.getElementById('currentPrice');
    const changeEl = document.getElementById('priceChange');
    const capEl = document.getElementById('marketCap');
    
    if (priceEl && priceData) {
        priceEl.textContent = `$${priceData.currentPrice.toFixed(4)}`;
    }
    
    if (changeEl && priceData) {
        const change = priceData.change24h || 0;
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.className = `price-value price-change ${change >= 0 ? 'up' : 'down'}`;
    }
    
    if (capEl && priceData) {
        const cap = priceData.marketCap || 0;
        if (cap >= 1000000) {
            capEl.textContent = `$${(cap / 1000000).toFixed(2)}M`;
        } else if (cap >= 1000) {
            capEl.textContent = `$${(cap / 1000).toFixed(2)}K`;
        } else {
            capEl.textContent = `$${cap.toFixed(2)}`;
        }
    }
}

async function loadPriceData() {
    try {
        const data = await apiCall('/api/price');
        if (data.success) {
            updatePriceDisplay(data.data);
        }
    } catch (error) {
        // 가격 로드 실패 시 조용히 처리
    }
}

// 블록체인 로드
async function loadBlockchain() {
    const data = await apiCall('/api/chain?limit=20');
    if (data.success) {
        displayBlockchain(data.data.chain);
    }
}

function displayBlockchain(blocks) {
    const container = document.getElementById('blockchainList');
    if (!container) return;
    
    container.innerHTML = blocks.map(block => `
        <div class="block-item">
            <div class="block-header">
                <strong>블록 #${block.index}</strong>
                <span>${new Date(block.timestamp).toLocaleString('ko-KR')}</span>
            </div>
            <div class="block-detail">
                <strong>해시:</strong> ${block.hash.substring(0, 20)}...
            </div>
        </div>
    `).join('');
}

// 채굴자 목록
async function loadMiners() {
    const data = await apiCall('/api/miners');
    if (data.success) {
        displayMiners(data.data);
    }
}

function displayMiners(miners) {
    const container = document.getElementById('minersList');
    if (!container) return;
    
    const sorted = miners.sort((a, b) => b.balance - a.balance);
    
    container.innerHTML = sorted.map((miner, i) => `
        <div class="miner-item">
            <div>${i + 1}. ${miner.name}</div>
            <div class="badge primary">${miner.balance.toFixed(2)} POSTY</div>
        </div>
    `).join('');
}

// 채굴자 등록
async function registerMiner() {
    const name = document.getElementById('minerName')?.value.trim();
    if (!name) {
        showToast('이름을 입력하세요', 'warning');
        return;
    }
    
    const data = await apiCall('/api/auth/login', 'POST', { name });
    
    if (data.success) {
        currentMiner = data.data;
        authToken = data.data.token;
        saveSession();
        showToast('등록 완료!', 'success');
        updateMinerUI();
    } else {
        showToast(data.message, 'error');
    }
}

// 채굴 시작
async function startMining() {
    if (!authToken) {
        showToast('먼저 등록하세요', 'warning');
        return;
    }
    
    const btn = document.getElementById('mineBtn');
    btn.disabled = true;
    
    const data = await apiCall('/api/mine', 'POST');
    
    if (data.success) {
        showToast(`채굴 성공! ${data.data.reward} POSTY`, 'success');
        await loadStats();
        await loadBlockchain();
    } else {
        showToast(data.message, 'error');
    }
    
    btn.disabled = false;
}

// 세션 저장/로드
function saveSession() {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentMiner', JSON.stringify(currentMiner));
}

function loadSavedSession() {
    authToken = localStorage.getItem('authToken');
    const saved = localStorage.getItem('currentMiner');
    if (saved) {
        currentMiner = JSON.parse(saved);
        updateAuthUI();
    }
}

function updateMinerUI() {
    // 레거시 함수 - updateAuthUI 호출
    updateAuthUI();
}

// 거래소
async function loadExchange() {
    // 거래소 데이터 로드
}

// 스테이킹
async function loadStaking() {
    // 스테이킹 데이터 로드
}

// 스마트 컨트랙트
async function loadContracts() {
    // 컨트랙트 목록 로드
}

// 차트 초기화
function initPriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'POSTY 가격 (USD)',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// ==================== 회원 인증 기능 ====================

// 모달 표시
function showAuthModal(type) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    modal.classList.add('show');
    switchAuthForm(type);
}

// 모달 숨기기
function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    modal.classList.remove('show');
}

// 폼 전환
function switchAuthForm(type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('authModalTitle');
    
    if (type === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        title.textContent = '로그인';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        title.textContent = '회원가입';
    }
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('이메일과 비밀번호를 입력하세요', 'warning');
        return;
    }
    
    try {
        const data = await apiCall('/api/user/login', 'POST', { email, password });
        
        if (data.success) {
            currentMiner = data.data.user;
            authToken = data.data.token;
            saveSession();
            hideAuthModal();
            updateAuthUI();
            showToast(data.data.message, 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('로그인 중 오류가 발생했습니다', 'error');
    }
}

// 회원가입 처리
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (!username || !email || !password) {
        showToast('모든 필드를 입력하세요', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showToast('비밀번호는 최소 6자 이상이어야 합니다', 'warning');
        return;
    }
    
    try {
        const data = await apiCall('/api/user/register', 'POST', { username, email, password });
        
        if (data.success) {
            currentMiner = data.data.user;
            authToken = data.data.token;
            saveSession();
            hideAuthModal();
            updateAuthUI();
            showToast(data.data.message, 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('회원가입 중 오류가 발생했습니다', 'error');
    }
}

// 로그아웃
function logout() {
    currentMiner = null;
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentMiner');
    updateAuthUI();
    showToast('로그아웃되었습니다', 'info');
}

// 인증 UI 업데이트
function updateAuthUI() {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const username = document.getElementById('username');
    
    if (currentMiner && authToken) {
        if (userInfo) userInfo.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        if (username) username.textContent = currentMiner.username || currentMiner.name || '사용자';
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
    }
}


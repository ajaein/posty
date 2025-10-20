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
    ws = new WebSocket(`ws://${window.location.host}`);
    
    ws.onopen = () => {
        console.log('✅ WebSocket 연결');
        showToast('실시간 업데이트 연결됨', 'success');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onclose = () => {
        setTimeout(connectWebSocket, 3000);
    };
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'blockMined':
            showToast(`새 블록 채굴! #${data.data.block.index}`, 'success');
            loadStats();
            loadBlockchain();
            break;
        case 'priceUpdate':
            updatePriceDisplay(data.data);
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
}

// 가격 업데이트
let currentPrice = 1.0;
function startPriceUpdates() {
    setInterval(() => {
        // 간단한 가격 시뮬레이션
        const change = (Math.random() - 0.5) * 0.02;
        currentPrice = Math.max(0.01, currentPrice * (1 + change));
        updatePriceDisplay();
    }, 3000);
}

function updatePriceDisplay() {
    const priceEl = document.getElementById('currentPrice');
    if (priceEl) {
        priceEl.textContent = `$${currentPrice.toFixed(4)}`;
    }
}

async function loadPriceData() {
    // 가격 데이터 로드 및 차트 업데이트
    updatePriceDisplay();
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
        updateMinerUI();
    }
}

function updateMinerUI() {
    // UI 업데이트 로직
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


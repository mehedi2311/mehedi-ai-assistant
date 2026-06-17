const API_URL = '/api/chat';
const MAX_CHARS = 1000;
const STORAGE_KEY = 'chatMessages';

const messagesContainer = document.getElementById('messages');
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const charCount = document.getElementById('charCount');
const statusText = document.getElementById('statusText');
const typingIndicator = document.getElementById('typingIndicator');
const themeToggle = document.getElementById('themeToggle');

let isProcessing = false;
let messageHistory = [];

// ===== THEME =====
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}
function toggleTheme() {
    const current = getCurrentTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
}
function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
}

// ===== SESSION STORAGE (সুরক্ষিত) =====
function saveMessages() {
    try {
        const data = messagesContainer.innerHTML;
        sessionStorage.setItem(STORAGE_KEY, data);
    } catch (e) {}
}
function loadMessages() {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
            messagesContainer.innerHTML = saved;
            scrollToBottom();
            return true;
        }
    } catch (e) {}
    return false;
}

// ===== UI HELPERS =====
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
function getCurrentTime() {
    return new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
}
function setStatus(text, isOnline = true) {
    statusText.textContent = text;
    statusText.style.color = isOnline ? '#22c55e' : '#ef4444';
}
function showTyping() {
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
}
function hideTyping() {
    typingIndicator.classList.add('hidden');
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== ADD MESSAGE =====
function addMessage(text, sender = 'user') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.style.animation = 'fadeIn 0.3s ease';
    const avatarIcon = sender === 'user' ? 'fa-user' : 'fa-robot';
    const time = getCurrentTime();
    messageDiv.innerHTML = `
        <div class="avatar"><i class="fas ${avatarIcon}"></i></div>
        <div class="message-content">
            <div class="bubble">${escapeHtml(text)}</div>
            <div class="timestamp">${time}</div>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    saveMessages();
}

// ===== SEND MESSAGE =====
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || isProcessing || message.length > MAX_CHARS) return;

    userInput.value = '';
    updateCharCount();
    addMessage(message, 'user');
    setStatus('⏳ টাইপিং...', true);
    showTyping();
    isProcessing = true;
    sendBtn.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history: messageHistory })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        addMessage(data.reply, 'bot');
        messageHistory.push({ role: 'user', content: message });
        messageHistory.push({ role: 'assistant', content: data.reply });
        setStatus('🟢 অনলাইন', true);
    } catch (error) {
        console.error('Error:', error);
        setStatus('❌ এরর: ' + error.message, false);
        addMessage(`😅 সমস্যা: ${error.message}`, 'bot');
    } finally {
        hideTyping();
        isProcessing = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// ===== EVENT LISTENERS =====
function updateCharCount() {
    const length = userInput.value.length;
    charCount.textContent = length;
    userInput.style.color = length > MAX_CHARS ? '#ef4444' : '';
}
function autoResize() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('input', () => { updateCharCount(); autoResize(); });
userInput.addEventListener('keydown', handleKeyDown);
themeToggle.addEventListener('click', toggleTheme);

// ===== INIT =====
function init() {
    loadTheme();
    if (!loadMessages()) {
        const welcome = document.createElement('div');
        welcome.className = 'message bot-message';
        welcome.innerHTML = `
            <div class="avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="bubble">👋 হ্যালো! আমি Mehedi-এর AI সহকারী। তার সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।</div>
                <div class="timestamp">${getCurrentTime()}</div>
            </div>
        `;
        messagesContainer.appendChild(welcome);
        saveMessages();
    }
    userInput.focus();
    updateCharCount();
    scrollToBottom();
    setStatus('🟢 অনলাইন', true);
}
init();
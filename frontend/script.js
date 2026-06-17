/**
 * Mehedi AI Assistant - Frontend Application
 * Production-grade chat interface with theme support and session management
 */

// ============================================
// Constants & Configuration
// ============================================

const API_URL = '/api/chat';
const MAX_CHARS = 1000;
const STORAGE_KEY = 'chatMessages';
const TYPING_DELAY = 300;

// ============================================
// DOM Element References
// ============================================

const messagesContainer = document.getElementById('messages');
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const charCount = document.getElementById('charCount');
const statusText = document.getElementById('statusText');
const typingIndicator = document.getElementById('typingIndicator');
const themeToggle = document.getElementById('themeToggle');

// ============================================
// Application State
// ============================================

let isProcessing = false;
let messageHistory = [];

// ============================================
// Theme Management
// ============================================

/**
 * Get the current theme from the DOM
 * @returns {string} 'light' or 'dark'
 */
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Apply theme to the document and update the toggle icon
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const current = getCurrentTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
}

/**
 * Load saved theme preference or fallback to system preference
 */
function loadTheme() {
    const saved = localStorage.getItem('theme');
    
    if (saved) {
        setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }
}

// ============================================
// Session Storage Management
// ============================================

/**
 * Save current chat messages to session storage
 */
function saveMessages() {
    try {
        const data = messagesContainer.innerHTML;
        sessionStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
        // Silently handle storage errors
        console.debug('Failed to save messages:', error.message);
    }
}

/**
 * Load chat messages from session storage
 * @returns {boolean} True if messages were loaded successfully
 */
function loadMessages() {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
            messagesContainer.innerHTML = saved;
            scrollToBottom();
            return true;
        }
    } catch (error) {
        console.debug('Failed to load messages:', error.message);
    }
    return false;
}

// ============================================
// UI Helper Functions
// ============================================

/**
 * Scroll the chat container to show the latest message
 */
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Get the current time formatted for display
 * @returns {string} Formatted time string (e.g., "10:30 PM")
 */
function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * Update the status indicator with custom text and color
 * @param {string} text - Status message to display
 * @param {boolean} isOnline - True for online status (green), false for offline (red)
 */
function setStatus(text, isOnline = true) {
    statusText.textContent = text;
    statusText.style.color = isOnline ? '#22c55e' : '#ef4444';
}

/**
 * Show the typing indicator and scroll to it
 */
function showTyping() {
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
}

/**
 * Hide the typing indicator
 */
function hideTyping() {
    typingIndicator.classList.add('hidden');
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Raw text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Message Management
// ============================================

/**
 * Add a message to the chat interface
 * @param {string} text - Message content
 * @param {string} sender - 'user' or 'bot'
 */
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

// ============================================
// Message Sending Logic
// ============================================

/**
 * Send user message to the API and handle response
 */
async function sendMessage() {
    const message = userInput.value.trim();
    
    // Validate input
    if (!message || isProcessing || message.length > MAX_CHARS) {
        return;
    }

    // Clear input and update UI
    userInput.value = '';
    updateCharCount();
    addMessage(message, 'user');
    setStatus('Typing...', true);
    showTyping();
    
    isProcessing = true;
    sendBtn.disabled = true;

    try {
        // Send request to API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message, 
                history: messageHistory 
            })
        });

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // Parse response and update UI
        const data = await response.json();
        addMessage(data.reply, 'bot');
        
        // Update conversation history
        messageHistory.push({ role: 'user', content: message });
        messageHistory.push({ role: 'assistant', content: data.reply });
        
        setStatus('Online', true);
        
    } catch (error) {
        // Handle errors gracefully
        console.error('Chat error:', error);
        setStatus('Error: ' + error.message, false);
        addMessage(`😅 Error: ${error.message}`, 'bot');
        
    } finally {
        // Reset UI state
        hideTyping();
        isProcessing = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// ============================================
// Input Event Handlers
// ============================================

/**
 * Update character count display and validate length
 */
function updateCharCount() {
    const length = userInput.value.length;
    charCount.textContent = length;
    userInput.style.color = length > MAX_CHARS ? '#ef4444' : '';
}

/**
 * Auto-resize textarea based on content height
 */
function autoResize() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

/**
 * Handle keyboard events (Enter to send)
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// ============================================
// Event Listeners
// ============================================

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('input', () => {
    updateCharCount();
    autoResize();
});

userInput.addEventListener('keydown', handleKeyDown);
themeToggle.addEventListener('click', toggleTheme);

// ============================================
// Application Initialization
// ============================================

/**
 * Initialize the chat application
 */
function init() {
    // Load saved theme
    loadTheme();
    
    // Load saved messages or show welcome message
    if (!loadMessages()) {
        const welcome = document.createElement('div');
        welcome.className = 'message bot-message';
        welcome.innerHTML = `
            <div class="avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="bubble">👋 Hello! I am Mehedi's AI assistant. Feel free to ask me anything.</div>
                <div class="timestamp">${getCurrentTime()}</div>
            </div>
        `;
        messagesContainer.appendChild(welcome);
        saveMessages();
    }
    
    // Set initial UI state
    userInput.focus();
    updateCharCount();
    scrollToBottom();
    setStatus('Online', true);
}

// Start the application
init();
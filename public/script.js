// =========== DTEMPIRE AI TERMINAL v2.0 ===========
console.log('🚀 DTempire AI Terminal v2.0 Initializing...');

// DOM Elements
const promptInput = document.getElementById('promptInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const apiTestInput = document.getElementById('apiTestInput');
const testApiBtn = document.getElementById('testApiBtn');
const apiResponse = document.getElementById('apiResponse');
const apiStatus = document.getElementById('apiStatus');
const refreshStatus = document.getElementById('refreshStatus');
const activeChannel = document.getElementById('activeChannel');
const responseTime = document.getElementById('responseTime');
const systemTime = document.getElementById('systemTime');
const uptime = document.getElementById('uptime');
const lastCommandTime = document.getElementById('lastCommandTime');

// API Configuration
const API_BASE_URL = window.location.origin;

// State
let isProcessing = false;
let currentModel = 'dtempire';
let startTime = Date.now();
let lastCommandTimestamp = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Loaded');
    
    // Initialize components
    initializeModelSelector();
    initializeChannelTabs();
    updateSystemTime();
    updateUptime();
    checkApiStatus();
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    if (testApiBtn) testApiBtn.addEventListener('click', testApi);
    if (refreshStatus) refreshStatus.addEventListener('click', checkApiStatus);
    
    // Auto-focus
    promptInput.focus();
    
    // Update timers
    setInterval(updateSystemTime, 1000);
    setInterval(updateUptime, 1000);
    
    console.log('🎯 Terminal Ready');
});

// =========== CHANNEL TABS ===========
function initializeChannelTabs() {
    const channelTabs = document.querySelectorAll('.channel-tab');
    
    channelTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const model = this.dataset.model;
            
            // Update active tab
            channelTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update model select
            const modelSelect = document.getElementById('modelSelect');
            if (modelSelect) {
                modelSelect.value = model;
                currentModel = model;
                updateActiveChannelDisplay(model);
            }
            
            // Show notification
            showNotification(`Switched to ${model.toUpperCase()} channel`, 'info');
        });
    });
}

// =========== MODEL SELECTOR ===========
function initializeModelSelector() {
    const modelSelect = document.getElementById('modelSelect');
    if (!modelSelect) return;
    
    console.log('🔄 Initializing model selector...');
    
    // Set DTempire as default
    modelSelect.innerHTML = `
        <option value="dtempire" selected>DTempire AI (Default)</option>
        <option value="deepseek">DeepSeek</option>
        <option value="gpt5">GPT-5</option>
        <option value="grok">Grok</option>
        <option value="popcat">PopCat</option>
        <option value="claude">Claude</option>
        <option value="llama">Llama</option>
        <option value="gemma">Gemma</option>
        <option value="qwen">Qwen</option>
        <option value="nemotron">Nemotron</option>
        <option value="axentra">Axentra</option>
        <option value="img_flux">Image Flux</option>
        <option value="img_turbo">Image Turbo</option>
        <option value="img_gpt">Image GPT</option>
        <option value="img_stable">Image Stable</option>
    `;
    
    // Load saved model
    const savedModel = localStorage.getItem('selectedModel') || 'dtempire';
    modelSelect.value = savedModel;
    currentModel = savedModel;
    updateActiveChannelDisplay(savedModel);
    
    // Update channel tabs
    updateChannelTabs(savedModel);
    
    // Add change event
    modelSelect.addEventListener('change', function() {
        const selectedModel = this.value;
        const modelName = this.options[this.selectedIndex].text;
        
        console.log(`🔄 Switching to model: ${selectedModel} (${modelName})`);
        
        // Update state
        currentModel = selectedModel;
        updateActiveChannelDisplay(selectedModel);
        updateChannelTabs(selectedModel);
        
        // Save to localStorage
        localStorage.setItem('selectedModel', selectedModel);
        
        // Show notification
        showNotification(`Model switched to: ${modelName}`, 'info');
    });
}

function updateChannelTabs(model) {
    const channelTabs = document.querySelectorAll('.channel-tab');
    channelTabs.forEach(tab => {
        if (tab.dataset.model === model) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function updateActiveChannelDisplay(model) {
    if (!activeChannel) return;
    
    const modelSelect = document.getElementById('modelSelect');
    const modelName = modelSelect ? modelSelect.options[modelSelect.selectedIndex].text : 'DTempire AI';
    activeChannel.textContent = modelName.split('(')[0].trim();
    console.log(`📊 Active channel: ${modelName}`);
}

// =========== CHAT FUNCTIONS ===========
async function sendMessage() {
    if (isProcessing) {
        showNotification('Please wait for current request to complete', 'warning');
        return;
    }
    
    const prompt = promptInput.value.trim();
    const modelSelect = document.getElementById('modelSelect');
    const model = modelSelect ? modelSelect.value : 'dtempire';
    
    if (!prompt) {
        showNotification('Please enter a message', 'warning');
        return;
    }
    
    // Set processing state
    isProcessing = true;
    promptInput.disabled = true;
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-cog fa-spin"></i> PROCESSING';
    
    // Add user message
    addMessage(prompt, 'user');
    
    // Clear input
    promptInput.value = '';
    
    // Update last command time
    updateLastCommandTime();
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator(model);
    
    try {
        // Start timer
        const startTime = Date.now();
        
        // Send request
        console.log(`📡 Sending to ${model} API...`);
        
        // Handle image models differently
        let response;
        if (model.startsWith('img_')) {
            response = await fetch(`https://imggen-api.ankitgupta.com.np/api/ai-text/?prompt=${encodeURIComponent(prompt)}`);
        } else {
            response = await fetch(`${API_BASE_URL}/ai?prompt=${encodeURIComponent(prompt)}&model=${model}`);
        }
        
        const endTime = Date.now();
        
        // Calculate response time
        const responseTimeMs = endTime - startTime;
        if (responseTime) responseTime.textContent = `${responseTimeMs}ms`;
        
        // Process response
        const data = await response.json();
        removeTypingIndicator(typingIndicator);
        
        console.log(`📥 Response from ${data.model || model}:`, data.success ? 'Success' : 'Failed');
        
        if (data.success || response.ok) {
            // Format response
            let aiResponse = data.response || data.text || data;
            
            if (typeof aiResponse === 'object') {
                aiResponse = JSON.stringify(aiResponse, null, 2);
            }
            
            aiResponse = cleanResponse(aiResponse);
            
            // Add AI response
            const modelInfo = data.fallback_from ? 
                ` (${model} → DTempire fallback)` : 
                ` (${data.model || model})`;
            
            addMessage(aiResponse, 'bot', modelInfo);
            
            // Show success
            showNotification(`Response received from ${data.model || model}`, 'success');
            
        } else {
            throw new Error(data.error || 'Request failed');
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error);
        removeTypingIndicator(typingIndicator);
        
        // Add error message
        addMessage(`Error: ${error.message}`, 'system');
        showNotification('Request failed', 'error');
        
    } finally {
        // Reset processing state
        isProcessing = false;
        promptInput.disabled = false;
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> SEND MESSAGE';
        
        // Refocus input
        promptInput.focus();
    }
}

// =========== MESSAGE HANDLING ===========
function addMessage(content, sender, modelInfo = '') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Escape HTML
    const safeContent = escapeHtml(content).replace(/\n/g, '<br>');
    
    let messageHTML = '';
    
    if (sender === 'user') {
        messageHTML = `
            <div class="message-content">
                <span class="msg-label">USER:</span>
                <span class="msg-text">${safeContent}</span>
            </div>
            <div class="message-time">${timeString}</div>
        `;
    } else if (sender === 'bot') {
        const displayName = modelInfo.includes('fallback') ? 'DTempire AI' : currentModel.toUpperCase();
        messageHTML = `
            <div class="message-content">
                <span class="msg-label">${displayName}:</span>
                <span class="msg-text">${safeContent}</span>
            </div>
            <div class="message-time">${timeString}</div>
        `;
    } else {
        messageHTML = `
            <div class="message-content">
                <span class="msg-label">SYSTEM:</span>
                <span class="msg-text" style="color: #ff0000;">${safeContent}</span>
            </div>
            <div class="message-time">${timeString}</div>
        `;
    }
    
    messageDiv.innerHTML = messageHTML;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator(model) {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-content">
            <span class="msg-label">${model.toUpperCase()}:</span>
            <span class="msg-text"><i class="fas fa-spinner fa-spin"></i> Processing...</span>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

function removeTypingIndicator(typingDiv) {
    if (typingDiv && typingDiv.parentNode) {
        typingDiv.parentNode.removeChild(typingDiv);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function cleanResponse(text) {
    if (!text || text === 'undefined' || text === 'null') {
        return "No response received from the AI.";
    }
    
    if (typeof text === 'string' && (text.startsWith('{') || text.startsWith('['))) {
        try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object') {
                return JSON.stringify(parsed, null, 2);
            }
        } catch (e) {
            // Not JSON
        }
    }
    
    text = String(text).trim();
    
    // Remove any unwanted prefixes
    text = text.replace(/^(response:|answer:|ai:|assistant:)\s*/i, '');
    
    if (text.length > 2500) {
        text = text.substring(0, 2500) + '\n\n...[response truncated due to length]';
    }
    
    return text;
}

// =========== API TESTING ===========
async function testApi() {
    const prompt = apiTestInput.value.trim();
    const modelSelect = document.getElementById('modelSelect');
    const model = modelSelect ? modelSelect.value : 'dtempire';
    
    if (!prompt) {
        showNotification('Enter a test query', 'warning');
        return;
    }
    
    try {
        apiResponse.innerHTML = '<pre style="color: #00ff00;">Testing API...</pre>';
        
        let response;
        if (model.startsWith('img_')) {
            response = await fetch(`https://imggen-api.ankitgupta.com.np/api/ai-text/?prompt=${encodeURIComponent(prompt)}`);
        } else {
            response = await fetch(`${API_BASE_URL}/ai?prompt=${encodeURIComponent(prompt)}&model=${model}`);
        }
        
        const data = await response.json();
        
        if (data.success || response.ok) {
            let result = data.response || data.text || data;
            if (typeof result === 'object') {
                result = JSON.stringify(result, null, 2);
            }
            
            apiResponse.innerHTML = `
                <div style="color: #00ff00;">
                    <strong>✅ SUCCESS (${data.model || model})</strong>
                    <pre style="margin-top: 10px; white-space: pre-wrap; color: #ffffff;">${escapeHtml(result.substring(0, 500))}</pre>
                </div>
            `;
        } else {
            apiResponse.innerHTML = `
                <div style="color: #ff0000;">
                    <strong>❌ FAILED</strong>
                    <pre style="color: #ff6666;">${data.error || 'Unknown error'}</pre>
                </div>
            `;
        }
    } catch (error) {
        apiResponse.innerHTML = `
            <div style="color: #ff0000;">
                <strong>❌ ERROR</strong>
                <pre style="color: #ff6666;">${error.message}</pre>
            </div>
        `;
    }
}

// =========== SYSTEM FUNCTIONS ===========
async function checkApiStatus() {
    try {
        if (apiStatus) {
            apiStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
            
            const response = await fetch(`${API_BASE_URL}/health`);
            
            if (response.ok) {
                const data = await response.json();
                apiStatus.innerHTML = `
                    <span style="color: #00ff00;">
                        <i class="fas fa-check-circle"></i> ONLINE
                    </span>
                    <br>
                    <small>${data.service}</small>
                `;
            } else {
                throw new Error('Offline');
            }
        }
    } catch (error) {
        if (apiStatus) {
            apiStatus.innerHTML = `
                <span style="color: #ff0000;">
                    <i class="fas fa-times-circle"></i> OFFLINE
                </span>
                <br>
                <small>${error.message}</small>
            `;
        }
    }
}

function updateSystemTime() {
    if (!systemTime) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
    
    systemTime.textContent = timeString;
}

function updateUptime() {
    if (!uptime) return;
    
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    uptime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateLastCommandTime() {
    if (!lastCommandTime) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    lastCommandTime.textContent = timeString;
    lastCommandTimestamp = now;
}

// =========== NOTIFICATIONS ===========
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#002200' : type === 'error' ? '#220000' : type === 'warning' ? '#222200' : '#001a00'};
        color: ${type === 'success' ? '#00ff00' : type === 'error' ? '#ff0000' : type === 'warning' ? '#ffff00' : '#00ff00'};
        border: 1px solid ${type === 'success' ? '#00ff00' : type === 'error' ? '#ff0000' : type === 'warning' ? '#ffff00' : '#00ff00'};
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        z-index: 1000;
        animation: slideIn 0.3s;
        border-radius: 3px;
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        max-width: 300px;
        word-break: break-word;
    `;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ';
    notification.textContent = `${icon} ${message}`;
    document.body.appendChild(notification);
    
    // Auto-remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// =========== GLOBAL FUNCTIONS ===========
window.copyCode = function(button) {
    const code = button.parentElement.parentElement.querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = '#00ff00';
        showNotification('Copied to clipboard', 'success');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        showNotification('Copy failed', 'error');
    });
};

console.log('📡 DTempire AI Terminal v2.0 Script Loaded');
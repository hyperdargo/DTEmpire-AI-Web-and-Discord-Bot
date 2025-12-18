const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 25586;

// API Configuration
const RAKID_API_BASE = 'https://raqkidapiendpoint.vercel.app';
const DEFAULT_API = 'http://158.69.214.8:9853/dtempire-ai';
const IMAGE_API = 'https://imggen-api.ankitgupta.com.np/api/ai-text';
const API_KEY = 'Raqkid3Y0mT_free';

// Available models
const AVAILABLE_MODELS = {
    'dtempire': 'DTempire AI (Default)',
    'deepseek': 'DeepSeek',
    'llama': 'Llama',
    'nemotron': 'Nemotron',
    'gemma': 'Gemma',
    'qwen': 'Qwen',
    'axentra': 'Axentra',
    'grok': 'Grok',
    'popcat': 'PopCat',
    'claude': 'Claude',
    'gpt5': 'GPT-5',
    'img_flux': 'Image Flux',
    'img_turbo': 'Image Turbo',
    'img_gpt': 'Image GPT',
    'img_stable': 'Image Stable'
};

// Process AI request
async function processAIModel(model, prompt) {
    console.log(`[${model}] Processing: "${prompt.substring(0, 50)}..."`);
    
    // Handle image generation models
    if (model.startsWith('img_')) {
        try {
            console.log(`Using Image Generation API: ${IMAGE_API}`);
            const response = await axios.get(`${IMAGE_API}/?prompt=${encodeURIComponent(prompt)}`, { timeout: 10000 });
            
            return {
                success: true,
                model: model,
                source: 'image_api',
                response: response.data
            };
        } catch (error) {
            console.error(`Image API error: ${error.message}`);
            throw new Error(`Image generation failed: ${error.message}`);
        }
    }
    
    // If using DTempire API
    if (model === 'dtempire') {
        try {
            const url = `${DEFAULT_API}?prompt=${encodeURIComponent(prompt)}`;
            console.log(`Using DTempire API`);
            
            const response = await axios.get(url, { timeout: 8000 });
            let aiResponse = response.data;
            
            // Process response
            if (aiResponse && typeof aiResponse === 'object') {
                if (aiResponse.result && Array.isArray(aiResponse.result) && aiResponse.result[0]) {
                    aiResponse = aiResponse.result[0].response || aiResponse.result[0].message || 'No response';
                } else if (aiResponse.response) {
                    aiResponse = aiResponse.response;
                }
            }
            
            if (typeof aiResponse === 'object') {
                aiResponse = JSON.stringify(aiResponse);
            }
            
            return {
                success: true,
                model: 'dtempire',
                source: 'dtempire_api',
                response: aiResponse
            };
        } catch (error) {
            console.error(`DTempire API error: ${error.message}`);
            throw new Error(`DTempire API failed: ${error.message}`);
        }
    }
    
    // If using RaqKid API
    try {
        const apiUrl = `${RAKID_API_BASE}/${model}?prompt=${encodeURIComponent(prompt)}&key=${API_KEY}`;
        console.log(`Using RaqKid API: ${model}`);
        
        const response = await axios.get(apiUrl, { 
            timeout: 10000,
            headers: { 'User-Agent': 'DTempire-AI' }
        });
        
        let aiResponse = response.data;
        
        // Extract response from RaqKid format
        if (typeof aiResponse === 'string') {
            aiResponse = aiResponse.trim();
        } else if (aiResponse && typeof aiResponse === 'object') {
            if (aiResponse.response) aiResponse = aiResponse.response;
            else if (aiResponse.text) aiResponse = aiResponse.text;
            else if (aiResponse.message) aiResponse = aiResponse.message;
            else if (aiResponse.result) {
                if (Array.isArray(aiResponse.result) && aiResponse.result[0]) {
                    aiResponse = aiResponse.result[0].response || aiResponse.result[0].message;
                } else {
                    aiResponse = aiResponse.result;
                }
            } else {
                aiResponse = JSON.stringify(aiResponse);
            }
        }
        
        return {
            success: true,
            model: model,
            source: 'raqkid_api',
            response: aiResponse
        };
        
    } catch (raqkidError) {
        console.error(`RaqKid ${model} failed: ${raqkidError.message}`);
        
        // Fallback to DTempire if RaqKid fails
        try {
            console.log(`Falling back to DTempire API...`);
            const fallbackUrl = `${DEFAULT_API}?prompt=${encodeURIComponent(prompt)}`;
            const response = await axios.get(fallbackUrl, { timeout: 8000 });
            
            let aiResponse = response.data;
            if (aiResponse && typeof aiResponse === 'object') {
                if (aiResponse.result && Array.isArray(aiResponse.result) && aiResponse.result[0]) {
                    aiResponse = aiResponse.result[0].response || aiResponse.result[0].message;
                } else if (aiResponse.response) {
                    aiResponse = aiResponse.response;
                }
            }
            
            return {
                success: true,
                model: 'dtempire',
                source: 'dtempire_fallback',
                response: aiResponse,
                fallback_from: model
            };
            
        } catch (fallbackError) {
            throw new Error(`All APIs failed: ${raqkidError.message}`);
        }
    }
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Get available models
app.get('/api/models', (req, res) => {
    res.json({
        success: true,
        models: AVAILABLE_MODELS,
        default_model: 'dtempire',
        image_api: IMAGE_API,
        timestamp: new Date().toISOString()
    });
});

// Main AI endpoint
app.get('/ai', async (req, res) => {
    const prompt = req.query.prompt;
    const model = req.query.model || 'dtempire';
    
    if (!prompt) {
        return res.json({ 
            success: false, 
            error: 'Please provide a prompt' 
        });
    }
    
    if (!AVAILABLE_MODELS[model]) {
        return res.json({
            success: false,
            error: `Invalid model. Available: ${Object.keys(AVAILABLE_MODELS).join(', ')}`
        });
    }
    
    try {
        const result = await processAIModel(model, prompt);
        res.json({
            ...result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// POST endpoint
app.post('/ai', async (req, res) => {
    const { prompt, model = 'dtempire' } = req.body;
    
    if (!prompt) {
        return res.json({ 
            success: false, 
            error: 'Please provide a prompt' 
        });
    }
    
    if (!AVAILABLE_MODELS[model]) {
        return res.json({
            success: false,
            error: `Invalid model. Available: ${Object.keys(AVAILABLE_MODELS).join(', ')}`
        });
    }
    
    try {
        const result = await processAIModel(model, prompt);
        res.json({
            ...result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Image generation endpoint
app.get('/api/image', async (req, res) => {
    const prompt = req.query.prompt;
    
    if (!prompt) {
        return res.json({ 
            success: false, 
            error: 'Please provide a prompt' 
        });
    }
    
    try {
        const response = await axios.get(`${IMAGE_API}/?prompt=${encodeURIComponent(prompt)}`, { timeout: 15000 });
        res.json({
            success: true,
            source: 'image_api',
            response: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'online',
        service: 'DTempire AI v2.0',
        models: Object.keys(AVAILABLE_MODELS).length,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ DTempire AI Server v2.0 started on port ${PORT}`);
    console.log(`🌐 Web Interface: http://localhost:${PORT}`);
    console.log(`🤖 AI Endpoint: http://localhost:${PORT}/ai?prompt=hello`);
    console.log(`🖼️ Image API: ${IMAGE_API}`);
    console.log(`🎯 Available Models: ${Object.keys(AVAILABLE_MODELS).length}`);
    console.log(`🔧 Primary Channels: DTEmpire AI, DeepSeek, GPT-5, Grok, PopCat, Claude`);
});
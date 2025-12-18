const express = require('express');
const axios = require('axios');
const router = express.Router();

// Main AI endpoint
router.post('/ai', async (req, res) => {
    try {
        const { prompt, temperature, max_tokens } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Build the URL for external API
        let url = `http://158.69.214.8:9853/dtempire-ai?prompt=${encodeURIComponent(prompt)}`;
        
        // Add optional parameters if provided
        const params = [];
        if (temperature) params.push(`temperature=${temperature}`);
        if (max_tokens) params.push(`max_tokens=${max_tokens}`);
        
        if (params.length > 0) {
            url += '&' + params.join('&');
        }

        const response = await axios.get(url);
        
        res.json({
            success: true,
            data: response.data,
            metadata: {
                prompt: prompt,
                temperature: temperature || 'default',
                max_tokens: max_tokens || 'default',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// GET endpoint for AI
router.get('/ai', async (req, res) => {
    try {
        const { prompt, temperature, max_tokens } = req.query;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        let url = `http://158.69.214.8:9853/dtempire-ai?prompt=${encodeURIComponent(prompt)}`;
        
        const params = [];
        if (temperature) params.push(`temperature=${temperature}`);
        if (max_tokens) params.push(`max_tokens=${max_tokens}`);
        
        if (params.length > 0) {
            url += '&' + params.join('&');
        }

        const response = await axios.get(url);
        
        res.json({
            success: true,
            data: response.data,
            metadata: {
                prompt: prompt,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Batch processing endpoint
router.post('/batch', async (req, res) => {
    try {
        const { prompts } = req.body;
        
        if (!prompts || !Array.isArray(prompts)) {
            return res.status(400).json({ error: 'Prompts array is required' });
        }

        const results = [];
        
        for (const prompt of prompts) {
            try {
                const response = await axios.get(
                    `http://158.69.214.8:9853/dtempire-ai?prompt=${encodeURIComponent(prompt)}`
                );
                results.push({
                    prompt: prompt,
                    response: response.data,
                    success: true
                });
            } catch (error) {
                results.push({
                    prompt: prompt,
                    error: error.message,
                    success: false
                });
            }
        }

        res.json({
            success: true,
            total: prompts.length,
            processed: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Batch processing failed',
            details: error.message
        });
    }
});

module.exports = router;
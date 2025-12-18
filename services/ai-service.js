const axios = require('axios');

class AIService {
    constructor() {
        this.baseUrl = process.env.EXTERNAL_API_URL || 'http://158.69.214.8:9853/dtempire-ai';
        this.token = process.env.EXTERNAL_API_TOKEN || null;
        this.timeout = parseInt(process.env.API_TIMEOUT) || 30000;
    }

    // Build the API URL
    buildUrl(prompt, options = {}) {
        let url = `${this.baseUrl}?prompt=${encodeURIComponent(prompt)}`;
        
        // Add token if available
        if (this.token) {
            url += `&token=${encodeURIComponent(this.token)}`;
        }
        
        // Add other parameters
        const params = [];
        if (options.temperature) params.push(`temperature=${options.temperature}`);
        if (options.max_tokens) params.push(`max_tokens=${options.max_tokens}`);
        if (options.model) params.push(`model=${options.model}`);
        
        if (params.length > 0) {
            url += '&' + params.join('&');
        }
        
        return url;
    }

    // Process API response
    processResponse(data) {
        if (typeof data === 'string') {
            return data;
        } else if (data && typeof data === 'object') {
            // Try common response formats
            if (data.text) return data.text;
            if (data.response) return data.response;
            if (data.message) return data.message;
            if (data.content) return data.content;
            if (data.result) return data.result;
            if (data.choices && Array.isArray(data.choices) && data.choices[0]?.text) {
                return data.choices[0].text;
            }
            if (data.choices && Array.isArray(data.choices) && data.choices[0]?.message?.content) {
                return data.choices[0].message.content;
            }
            
            // Return stringified version
            try {
                return JSON.stringify(data, null, 2);
            } catch {
                return String(data);
            }
        }
        return String(data);
    }

    // Main method to get AI response
    async getAIResponse(prompt, options = {}) {
        try {
            if (!prompt || prompt.trim() === '') {
                throw new Error('Prompt cannot be empty');
            }

            const url = this.buildUrl(prompt, options);
            
            const response = await axios.get(url, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'DTempire-AI-Service/1.0',
                    'Accept': 'application/json'
                }
            });

            const processedResponse = this.processResponse(response.data);
            
            return {
                success: true,
                response: processedResponse,
                prompt: prompt,
                length: processedResponse.length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('AI Service Error:', error.message);
            
            let errorMessage = 'Failed to get AI response';
            if (error.response) {
                errorMessage = `External API error: ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'No response from AI service';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout';
            }
            
            return {
                success: false,
                error: errorMessage,
                details: error.message
            };
        }
    }

    // For Discord: Truncate long responses
    truncateForDiscord(text, maxLength = 2000) {
        if (text.length <= maxLength) return text;
        
        // Try to cut at a sentence or word boundary
        const truncated = text.substring(0, maxLength - 100);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastSpace = truncated.lastIndexOf(' ');
        
        if (lastPeriod > maxLength - 200) {
            return text.substring(0, lastPeriod + 1) + '\n\n*[Response truncated due to length]*';
        } else if (lastSpace > maxLength - 200) {
            return text.substring(0, lastSpace) + '...\n\n*[Response truncated]*';
        }
        
        return text.substring(0, maxLength - 50) + '...\n\n*[Response truncated]*';
    }
}

module.exports = new AIService();
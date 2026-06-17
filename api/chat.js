import helmet from 'helmet';
import crypto from 'crypto';

// ============================================
// 1. Rate Limiting (20 requests per minute)
// ============================================
const rateLimit = new Map();

/**
 * Check if an IP address has exceeded the rate limit
 * @param {string} ip - Client IP address
 * @returns {boolean} - True if rate limited
 */
function isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60000;
    
    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, []);
    }
    
    const timestamps = rateLimit.get(ip).filter(t => now - t < windowMs);
    
    if (timestamps.length >= 20) {
        return true;
    }
    
    timestamps.push(now);
    rateLimit.set(ip, timestamps);
    return false;
}

// ============================================
// 2. AES-256-GCM Encryption for Personal Data
// ============================================
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'default-secret-key-32bytes-long!!';
const ENCRYPTED_DATA = process.env.ENCRYPTED_PERSONAL_DATA;

/**
 * Decrypt AES-256-GCM encrypted data
 * @param {string} encryptedData - Encrypted data string (iv:authTag:encrypted)
 * @param {string} secret - 32-byte hex secret key
 * @returns {Object} - Decrypted JSON object
 */
function decryptData(encryptedData, secret) {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString('utf8'));
}

// ============================================
// 3. Personal Data - Mehedi Hasan
// ============================================
const DEFAULT_PERSONAL_DATA = {
    name: 'Mehedi Hasan',
    profession: 'AI Engineer | Software Developer',
    email: '1mehedihasan23.official@gmail.com',
    phone: '+8801616-231199, +8801771-803430',
    location: 'Bangladesh',
    education: {
        bsc: 'B.Sc in CSE, Green University of Bangladesh (CGPA: 3.21, 2025)',
        hsc: 'HSC, Gafargaon Govt. College (GPA: 4.75, 2019)',
        ssc: 'SSC, Gafargaon Islamia Govt. High School (GPA: 5.00, 2017)'
    },
    workExperience: [
        'Software Developer at DataSoft System Bangladesh Limited (Sept 2025 - Present)',
        'SQA Intern at 360 Pathshala (Oct 2025 - Mar 2026)'
    ],
    skills: [
        'Python', 'Java', 'JavaScript', 'TypeScript', 'LangChain', 'FastAPI',
        'Spring Boot', 'Docker', 'CI/CD', 'RAG Systems', 'Agentic AI', 'LoRA Fine-Tuning'
    ],
    achievements: [
        "Vice Chancellor's Award (Academic Excellence)",
        "Dean's Award (Academic Excellence)",
        'SEO Certification (2022)'
    ],
    leadership: [
        'Organizing Secretary - Green University Prothom Alo Bandhusova',
        'General Volunteer - Green University Computer Club (GUCC)',
        'General Volunteer - Gafargaon Helpline',
        'COVID-19 Relief Activities'
    ],
    researchInterests: [
        'AI Engineering', 'LLMs', 'Agentic AI', 'RAG Systems', 'LoRA/QLoRA Fine-Tuning'
    ],
    projects: [
        'Emergency Ambulance Reservation Software (PHP, MySQL, JS)',
        'Heal Point Healthcare Management System (Android, Java, SQLite)',
        'Agentic QA Automation Pipeline (Python, Playwright, MCP, Node.js)'
    ],
    hobbies: ['AI Experimentation', 'LLM Fine-Tuning', 'Building Agentic Systems'],
    careerGoals: 'Lead innovation in trustworthy AI architectures, agentic workflows, and end-to-end AI deployment at scale.',
    github: 'https://github.com/mehedihasan',
    linkedin: 'https://linkedin.com/in/mehedihasan'
};

let PERSONAL_DATA = DEFAULT_PERSONAL_DATA;

// Attempt to decrypt personal data if available
if (ENCRYPTED_DATA && ENCRYPTION_SECRET && ENCRYPTION_SECRET.length >= 32) {
    try {
        PERSONAL_DATA = decryptData(ENCRYPTED_DATA, ENCRYPTION_SECRET);
        console.log('✅ Personal data decrypted successfully');
    } catch (error) {
        console.error('❌ Decryption failed, using default data:', error.message);
    }
}

// ============================================
// 4. System Prompt Generation
// ============================================
/**
 * Generate the system prompt with personal data
 * @returns {string} - Complete system prompt
 */
function getSystemPrompt() {
    const data = PERSONAL_DATA;
    
    return `You are Mehedi Hasan's personal AI assistant. Your name is 'Mehedi AI'.

You have complete information about Mehedi:
- Name: ${data.name}
- Profession: ${data.profession}
- Email: ${data.email}
- Phone: ${data.phone}
- Location: ${data.location}
- Education: B.Sc CSE (CGPA: 3.21, 2025), HSC (GPA: 4.75), SSC (GPA: 5.00)
- Skills: ${data.skills.join(', ')}
- Experience: ${data.workExperience.join('; ')}
- Achievements: ${data.achievements.join('; ')}
- Leadership: ${data.leadership.join('; ')}
- Research Interests: ${data.researchInterests.join(', ')}
- Projects: ${data.projects.join('; ')}
- Hobbies: ${data.hobbies.join(', ')}
- Career Goal: ${data.careerGoals}
- GitHub: ${data.github}
- LinkedIn: ${data.linkedin}

**Important Instructions:**
- Respond in the same language as the user's question (Bengali/English/Banglish/Hindi).
- Keep responses friendly, professional, and concise.
- If you don't know an answer, clearly state that and offer to help with other topics.
- Never provide fabricated information or hallucinate.`;
}

// ============================================
// 5. OpenRouter API Integration
// ============================================
/**
 * Call OpenRouter API with chat completion
 * @param {string} message - User message
 * @param {Array} history - Conversation history
 * @returns {string} - AI response
 */
async function callOpenRouter(message, history = []) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not set');
    }

    const messages = [
        { role: 'system', content: getSystemPrompt() },
        ...history.slice(-10), // Only use last 10 messages for context
        { role: 'user', content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://mehedi-ai-assistant.vercel.app',
            'X-Title': 'Mehedi AI Assistant'
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-3.2-3b-instruct:free',
            messages,
            max_tokens: 500,
            temperature: 0.7,
            top_p: 0.9
        })
    });

    // Handle API errors
    if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        }
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your credentials.');
        }
        
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response structure');
    }

    return data.choices[0].message.content;
}

// ============================================
// 6. Vercel Serverless Function Handler
// ============================================
/**
 * Main Vercel serverless function handler
 * Handles POST requests with rate limiting, CORS, and security
 */
export default async function handler(req, res) {
    // Apply Helmet security headers
    helmet()(req, res, () => {});

    // CORS configuration
    const allowedOrigins = [
        'https://mehedi-ai-assistant.vercel.app',
        'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://mehedi-ai-assistant.vercel.app');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Apply rate limiting
    const clientIp = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    'unknown';
    
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ 
            error: 'Too many requests. Please wait a minute.' 
        });
    }

    try {
        // Validate request body
        const { message, history = [] } = req.body;
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Message is required and must be a string' 
            });
        }
        
        if (message.length > 1000) {
            return res.status(400).json({ 
                error: 'Message cannot exceed 1000 characters' 
            });
        }

        // Process the chat request
        const reply = await callOpenRouter(message, history);
        
        return res.status(200).json({ 
            reply, 
            status: 'success' 
        });
        
    } catch (error) {
        // Log the error for debugging
        console.error('Handler error:', error.message);
        
        // Determine appropriate status code
        let statusCode = 500;
        if (error.message.includes('rate limit')) statusCode = 429;
        else if (error.message.includes('API key')) statusCode = 401;
        
        return res.status(statusCode).json({ 
            error: error.message 
        });
    }
}
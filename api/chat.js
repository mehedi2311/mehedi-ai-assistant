import helmet from 'helmet';
import crypto from 'crypto';

// ============================================
// 1. রেট লিমিট (প্রতি মিনিটে ১০টি রিকোয়েস্ট)
// ============================================
const rateLimit = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60000;
    if (!rateLimit.has(ip)) rateLimit.set(ip, []);
    const timestamps = rateLimit.get(ip).filter(t => now - t < windowMs);
    if (timestamps.length >= 10) return true;
    timestamps.push(now);
    rateLimit.set(ip, timestamps);
    return false;
}

// ============================================
// 2. AES-256-GCM এনক্রিপশন (আপনার ডেটার জন্য)
// ============================================
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'default-secret-key-32bytes-long!!';
const ENCRYPTED_DATA = process.env.ENCRYPTED_PERSONAL_DATA;

function decryptData(encryptedData, secret) {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted data');
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
// 3. PERSONAL DATA (Mehedi Hasan - PDF থেকে নেওয়া)
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
    skills: ['Python', 'Java', 'JavaScript', 'TypeScript', 'LangChain', 'FastAPI', 'Spring Boot', 'Docker', 'CI/CD', 'RAG Systems', 'Agentic AI', 'LoRA Fine-Tuning'],
    achievements: [
        'Vice Chancellor\'s Award (Academic Excellence)',
        'Dean\'s Award (Academic Excellence)',
        'SEO Certification (2022)'
    ],
    leadership: [
        'Organizing Secretary - Green University Prothom Alo Bandhusova',
        'General Volunteer - Green University Computer Club (GUCC)',
        'General Volunteer - Gafargaon Helpline',
        'COVID-19 Relief Activities'
    ],
    researchInterests: ['AI Engineering', 'LLMs', 'Agentic AI', 'RAG Systems', 'LoRA/QLoRA Fine-Tuning'],
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
if (ENCRYPTED_DATA && ENCRYPTION_SECRET && ENCRYPTION_SECRET.length >= 32) {
    try {
        PERSONAL_DATA = decryptData(ENCRYPTED_DATA, ENCRYPTION_SECRET);
    } catch (e) {
        console.error('Decryption failed, using default data:', e.message);
    }
}

// ============================================
// 4. SYSTEM PROMPT (মাল্টিলিঙ্গুয়াল)
// ============================================
function getSystemPrompt() {
    const d = PERSONAL_DATA;
    return `তুমি Mehedi Hasan-এর ব্যক্তিগত AI সহকারী। তোমার নাম 'Mehedi AI'।

তোমার কাছে Mehedi-এর সম্পূর্ণ তথ্য আছে:
- নাম: ${d.name}
- পেশা: ${d.profession}
- ইমেইল: ${d.email}
- ফোন: ${d.phone}
- অবস্থান: ${d.location}
- শিক্ষা: B.Sc CSE (CGPA: 3.21, 2025), HSC (GPA: 4.75), SSC (GPA: 5.00)
- দক্ষতা: ${d.skills.join(', ')}
- অভিজ্ঞতা: ${d.workExperience.join('; ')}
- অর্জন: ${d.achievements.join('; ')}
- নেতৃত্ব: ${d.leadership.join('; ')}
- গবেষণা আগ্রহ: ${d.researchInterests.join(', ')}
- প্রোজেক্ট: ${d.projects.join('; ')}
- শখ: ${d.hobbies.join(', ')}
- ক্যারিয়ার লক্ষ্য: ${d.careerGoals}
- GitHub: ${d.github}
- LinkedIn: ${d.linkedin}

**গুরুত্বপূর্ণ নির্দেশনা:**
- তুমি যে ভাষায় প্রশ্ন পাবে, ঠিক সেই ভাষায় উত্তর দেবে (বাংলা/ইংরেজি/বাংলিইশ/হিন্দি)।
- উত্তর হবে বন্ধুত্বপূর্ণ, পেশাদার ও সংক্ষিপ্ত।
- যদি কোনো প্রশ্নের উত্তর না জানো, স্পষ্টভাবে বলবে এবং অন্য সাহায্য দিতে পারবে কিনা জিজ্ঞেস করবে।
- কখনো মনগড়া তথ্য দেবে না।`;
}

// ============================================
// 5. OPENROUTER API CALL
// ============================================
async function callOpenRouter(message, history = []) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

    const messages = [
        { role: 'system', content: getSystemPrompt() },
        ...history.slice(-10),
        { role: 'user', content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://mehedi-ai.vercel.app',
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

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) throw new Error('API লিমিট শেষ। দয়া করে কিছুক্ষণ পর চেষ্টা করুন।');
        if (response.status === 401) throw new Error('API Key সঠিক নয়।');
        throw new Error(`API Error (${response.status})`);
    }
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) throw new Error('Invalid API response');
    return data.choices[0].message.content;
}

// ============================================
// 6. VERCEL HANDLER (Helmet + CORS + Rate Limit)
// ============================================
export default async function handler(req, res) {
    // Helmet সিকিউরিটি হেডার
    helmet()(req, res, () => {});

    // CORS (শুধু নির্দিষ্ট অরিজিন)
    const allowedOrigins = ['https://mehedi-ai.vercel.app', 'http://localhost:3000'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://mehedi-ai.vercel.app');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // রেট লিমিট চেক
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
    }

    try {
        const { message, history = [] } = req.body;
        if (!message || typeof message !== 'string' || message.length > 1000) {
            return res.status(400).json({ error: 'Invalid message' });
        }
        const reply = await callOpenRouter(message, history);
        return res.status(200).json({ reply, status: 'success' });
    } catch (error) {
        console.error('Error:', error.message);
        const status = error.message.includes('লিমিট') ? 429 :
                      error.message.includes('Key') ? 401 : 500;
        return res.status(status).json({ error: error.message });
    }
}
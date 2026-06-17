# Mehedi Hasan - Personal AI Assistant 🤖

সর্বোচ্চ সুরক্ষিত AI চ্যাটবট যা Mehedi Hasan-এর ব্যক্তিগত তথ্যের উপর ভিত্তি করে উত্তর দেয়।

## 🔐 সিকিউরিটি ফিচার
- AES-256-GCM এনক্রিপশন (ব্যক্তিগত ডেটা)
- রেট লিমিট (১০ রিকোয়েস্ট/মিনিট)
- Helmet.js (XSS, MIME স্নিফিং ব্লক)
- CSP হেডার
- সেশন স্টোরেজ

## 🚀 ডিপ্লয়মেন্ট
1. OpenRouter-এ অ্যাকাউন্ট করে API Key নিন
2. Vercel-এ প্রজেক্ট ডিপ্লয় করুন
3. Environment Variables সেট করুন:
   - `OPENROUTER_API_KEY`
   - `ENCRYPTION_SECRET` (৩২ হেক্স অক্ষর)
   - `ENCRYPTED_PERSONAL_DATA`

## 🛠️ টেকনোলজি
- Frontend: HTML, CSS, JavaScript
- Backend: Vercel Serverless Functions
- AI: OpenRouter (Llama 3.2)
- Security: AES-256, Helmet, Rate Limiting
# Mehedi Hasan - Personal AI Assistant

Secure AI chatbot built with modern web technologies.

---

## 🚀 Overview

A personal AI assistant that responds to queries about Mehedi Hasan's professional background, skills, projects, and achievements. Features a modern UI with dark/light theme support, multi-language responses, and enterprise-grade security.

**Live Demo:** [https://mehedi-ai-assistant.vercel.app](https://mehedi-ai-assistant.vercel.app)

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Vercel Serverless Functions, Node.js |
| AI | OpenRouter API, Llama 3.2 3B Instruct |
| Security | AES-256-GCM, Helmet.js, CSP, Rate Limiting |
| Icons | Font Awesome |

---

## 🔐 Security Architecture

- **AES-256-GCM** – Personal data encrypted at rest
- **Rate Limiting** – 20 requests per minute per IP
- **Helmet.js** – XSS, MIME sniffing, clickjacking protection
- **CSP** – Content Security Policy headers
- **Session Storage** – Chat history not persisted long-term
- **HTML Sanitization** – XSS prevention

---

## 🏗️ Architecture

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RotateCcw, UploadCloud, Music, Trash2, Volume2, Clock, Loader2, Copy, AlertCircle, Activity, Server, Database, ShieldCheck, ImagePlus, Smartphone, Clapperboard, Type, Palette, Globe, MessageSquare, Monitor, Filter, Wand2, CloudRain, ChevronDown, Film, FileText, Layers, RefreshCw, Share2, Check, Link2, Newspaper, Scissors, ExternalLink, Eye } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';

// AI CLIENT Ã¢â‚¬â€ Fallback zinciri: NVIDIA (ÃƒÂ¼cretsiz) Ã¢â€ â€™ Gemini (ÃƒÂ¼cretsiz eski modeller)
// TÃƒÂ¼m metin ÃƒÂ¼retimi ÃƒÂ¶nce NVIDIA'ya, baÃ…Å¸arÃ„Â±sÃ„Â±z olursa Gemini ÃƒÂ¼cretsiz
// modellerine dÃƒÂ¼Ã…Å¸er. GÃƒÂ¶rsel/TTS iÃƒÂ§in ayrÃ„Â± uÃƒÂ§lar (generateImage/generateAudio) kullanÃ„Â±lÃ„Â±r.
// ============================================================
const NV_CHAT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
// KullanÃ„Â±cÃ„Â± UI'dan model seÃƒÂ§ebilir; varsayÃ„Â±lan ÃƒÂ¼cretsiz nemotron.
let NV_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';
const setNvidiaModel = (m) => { NV_MODEL = m; };

// Gemini ÃƒÂ¼cretsiz eski modeller (fallback). apiKey boÃ…Å¸sa bu modeller de ÃƒÂ§alÃ„Â±Ã…Å¸maz,
// ama kullanÃ„Â±cÃ„Â± Gemini key girerse devreye girer.
const GEMINI_FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];
const GEMINI_CHAT_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// ============================================================
// Ãƒâ€¡OKLU AI SAÃ„ÂLAYICI HAVUZU (OpenAI-uyumlu gateways)
// ÃƒÅ“cretsiz LLM kaynaklarÃ„Â±: cheahjs/free-llm-api-resources, mnfst/awesome-free-llm-apis,
// open-free-llm-api/awesome-freellm-apis ve benzeri repo'lardan derlendi.
// KullanÃ„Â±cÃ„Â± UI'dan saÃ„Å¸layÃ„Â±cÃ„Â± + key girer (sessionStorage). Kodda hardcoded key yok.
// SÃ„Â±ra: NVIDIA -> OpenAI-uyumlu gateways -> Gemini
// ============================================================
// Her saÃ„Å¸layÃ„Â±cÃ„Â± iÃƒÂ§in ayrÃ„Â± sessionStorage anahtarÃ„Â±
const PROVIDER_STORAGE = {
  openrouter: 'ns_k_openrouter',
  zenmux: 'ns_k_zenmux',
  bluesminds: 'ns_k_bluesminds',
  mimo: 'ns_k_mimo',
  groq: 'ns_k_groq',
  github: 'ns_k_github',
  cerebras: 'ns_k_cerebras',
  cohere: 'ns_k_cohere',
  mistral: 'ns_k_mistral',
  fireworks: 'ns_k_fireworks',
  hyperbolic: 'ns_k_hyperbolic',
  sambanova: 'ns_k_sambanova',
  nebius: 'ns_k_nebius',
  scaleway: 'ns_k_scaleway',
  huggingface: 'ns_k_huggingface',
  opencodezen: 'ns_k_opencodezen',
  vercel: 'ns_k_vercel',
  llm7: 'ns_k_llm7',
  kluster: 'ns_k_kluster',
  zhipu: 'ns_k_zhipu',
  xai: 'ns_k_xai',
  deepseek: 'ns_k_deepseek',
  siliconflow: 'ns_k_siliconflow',
  nscale: 'ns_k_nscale',
  ovh: 'ns_k_ovh',
  chutes: 'ns_k_chutes',
  modelscope: 'ns_k_modelscope',
  ai21: 'ns_k_ai21',
  pollinations: 'ns_k_pollinations',
  aion: 'ns_k_aion'
};
const getProviderKey = (id) => { try { return sessionStorage.getItem(PROVIDER_STORAGE[id] || '') || ''; } catch (e) { return ''; } };
const setProviderKey = (id, k) => { try { const s = PROVIDER_STORAGE[id]; if (!s) return; if (k) sessionStorage.setItem(s, k); else sessionStorage.removeItem(s); } catch (e) {} };

// OpenAI-uyumlu saÃ„Å¸layÃ„Â±cÃ„Â± tanÃ„Â±mlarÃ„Â± (ÃƒÂ¼cretsiz LLM kaynaklarÃ„Â±ndan)
const AI_PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1/chat/completions', models: ['openai/gpt-4o-mini', 'nvidia/nemotron-3-super-120b-a12b:free', 'meta-llama/llama-3.3-70b-instruct:free', 'google/gemini-flash-1.5', 'qwen/qwen3-coder:free'], isJsonOk: true },
  { id: 'zenmux', label: 'ZenMUX.ai', baseUrl: 'https://ai.zenmux.io/v1/chat/completions', models: ['gpt-4o-mini', 'claude-3.5-haiku', 'gemini-1.5-flash'], isJsonOk: true },
  { id: 'bluesminds', label: 'BluesMinds', baseUrl: 'https://api.bluesminds.com/v1/chat/completions', models: ['gpt-4o-mini', 'llama-3.1-70b', 'nemotron-70b'], isJsonOk: true },
  { id: 'mimo', label: 'Mimo', baseUrl: 'https://api.mimo.example/v1/chat/completions', models: ['gpt-4o-mini'], isJsonOk: true },
  { id: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1/chat/completions', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b', 'gemma2-9b-it'], isJsonOk: true },
  { id: 'github', label: 'GitHub Models', baseUrl: 'https://models.inference.ai.azure.com/chat/completions', models: ['gpt-4o', 'gpt-4o-mini', 'Phi-4', 'DeepSeek-R1', 'Llama-3.3-70B-Instruct'], isJsonOk: false },
  { id: 'cerebras', label: 'Cerebras', baseUrl: 'https://api.cerebras.ai/v1/chat/completions', models: ['llama-3.3-70b', 'gpt-oss-120b', 'llama3.1-8b'], isJsonOk: true },
  { id: 'cohere', label: 'Cohere', baseUrl: 'https://api.cohere.com/compatibility/v1/chat/completions', models: ['command-r-plus', 'command-r7b-12-2024', 'c4ai-aya-expanse-32b'], isJsonOk: true },
  { id: 'mistral', label: 'Mistral', baseUrl: 'https://api.mistral.ai/v1/chat/completions', models: ['mistral-small-latest', 'open-mistral-7b', 'ministral-3b-latest'], isJsonOk: true },
  { id: 'fireworks', label: 'Fireworks', baseUrl: 'https://api.fireworks.ai/inference/v1/chat/completions', models: ['accounts/fireworks/models/llama-v3p3-70b-instruct', 'accounts/fireworks/models/deepseek-r1'], isJsonOk: true },
  { id: 'hyperbolic', label: 'Hyperbolic', baseUrl: 'https://api.hyperbolic.xyz/v1/chat/completions', models: ['meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen3-235B-A22B'], isJsonOk: true },
  { id: 'sambanova', label: 'SambaNova', baseUrl: 'https://api.sambanova.ai/v1/chat/completions', models: ['Meta-Llama-3.3-70B-Instruct', 'DeepSeek-V3-0324', 'Qwen3-235B-A22B'], isJsonOk: true },
  { id: 'nebius', label: 'Nebius', baseUrl: 'https://api.nebius.ai/v1/chat/completions', models: ['meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen3-235B-A22B'], isJsonOk: true },
  { id: 'scaleway', label: 'Scaleway', baseUrl: 'https://api.scaleway.ai/v1/chat/completions', models: ['meta/llama-3.3-70b-instruct', 'qwen3-235b-a22b-instruct-2507', 'deepseek-v3.2'], isJsonOk: true },
  { id: 'huggingface', label: 'HuggingFace', baseUrl: 'https://router.huggingface.co/v1/chat/completions', models: ['meta-llama/Llama-3.3-70B-Instruct', 'Qwen/Qwen3-235B-A22B', 'deepseek-ai/DeepSeek-V3-0324'], isJsonOk: true },
  { id: 'opencodezen', label: 'OpenCode Zen', baseUrl: 'https://api.opencode.ai/v1/chat/completions', models: ['nemotron-3-super-free', 'deepseek-v4-flash-free', 'big-pickle-stealth'], isJsonOk: true },
  { id: 'vercel', label: 'Vercel AI GW', baseUrl: 'https://ai-gateway.vercel.sh/v1/chat/completions', models: ['gpt-4o-mini', 'meta/llama-3.3-70b-instruct', 'google/gemini-2.0-flash'], isJsonOk: true },
  { id: 'llm7', label: 'LLM7.io', baseUrl: 'https://api.llm7.io/v1/chat/completions', models: ['gpt-4o-mini', 'deepseek-r1', 'qwen2.5-coder-32b', 'llama-3.3-70b'], isJsonOk: true },
  { id: 'kluster', label: 'Kluster AI', baseUrl: 'https://api.kluster.ai/v1/chat/completions', models: ['deepseek-r1', 'llama-4-maverick', 'qwen3-235b'], isJsonOk: true },
  { id: 'zhipu', label: 'Zhipu AI (GLM)', baseUrl: 'https://open.bigmodel.cn/api/paite/v4/chat/completions', models: ['glm-4.7-flash', 'glm-4.5-flash', 'glm-4.6v-flash'], isJsonOk: true },
  { id: 'xai', label: 'xAI (Grok)', baseUrl: 'https://api.x.ai/v1/chat/completions', models: ['grok-3-mini', 'grok-2', 'grok-beta'], isJsonOk: true },
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1/chat/completions', models: ['deepseek-chat', 'deepseek-reasoner'], isJsonOk: true },
  { id: 'siliconflow', label: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1/chat/completions', models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen3-235B-A22B', 'meta-llama/Llama-3.3-70B-Instruct'], isJsonOk: true },
  { id: 'nscale', label: 'Nscale', baseUrl: 'https://api.nscale.com/v1/chat/completions', models: ['meta/llama-3.3-70b-instruct', 'deepseek/deepseek-v3', 'qwen/qwen3-235b'], isJsonOk: true },
  { id: 'ovh', label: 'OVHcloud AI', baseUrl: 'https://ai-endpoints.ovhcloud.com/api/openai/v1/chat/completions', models: ['DeepSeek-R1', 'Llama-3.3-70B-Instruct', 'Qwen2.5-72B-Instruct'], isJsonOk: true },
  { id: 'chutes', label: 'Chutes', baseUrl: 'https://llm.chutes.ai/v1/chat/completions', models: ['deepseek-ai/DeepSeek-V3', 'meta-llama/Llama-3.3-70B-Instruct', 'Qwen/Qwen3-235B-A22B'], isJsonOk: true },
  { id: 'modelscope', label: 'ModelScope', baseUrl: 'https://api.modelscope.cn/v1/chat/completions', models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen3-235B-A22B', 'meta-llama/Llama-3.3-70B-Instruct'], isJsonOk: true },
  { id: 'ai21', label: 'AI21', baseUrl: 'https://api.ai21.com/v1/chat/completions', models: ['jamba-1.5-large', 'jamba-1.5-mini', 'jamba2-90b'], isJsonOk: true },
  { id: 'pollinations', label: 'Pollinations AI', baseUrl: 'https://text.pollinations.ai/openai', models: ['openai', 'mistral', 'llama', 'gemini'], isJsonOk: true },
  { id: 'aion', label: 'Aion Labs', baseUrl: 'https://api.aionlabs.ai/v1/chat/completions', models: ['Aion 2.5', 'Aion 2.0', 'Aion-RP 1.0'], isJsonOk: true }
];
const getProviderById = (id) => AI_PROVIDERS.find(p => p.id === id);

// TÃƒÂ¼m OpenAI-uyumlu saÃ„Å¸layÃ„Â±cÃ„Â±lar iÃƒÂ§in ortak ÃƒÂ§aÃ„Å¸rÃ„Â±
const callOpenAICompatible = async (provider, systemPrompt, userPrompt, opts = {}) => {
    const key = getProviderKey(provider.id);
    if (!key) throw new Error(provider.label + ' anahtarÃ„Â± girilmemiÃ…Å¸.');
    const models = opts.model ? [opts.model] : provider.models;
    let lastErr = '';
    for (const model of models) {
        try {
            const body = {
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: opts.temperature != null ? opts.temperature : 0.7,
                max_tokens: opts.max_tokens || 4096,
                stream: false
            };
            if (opts.json && provider.isJsonOk) body.response_format = { type: 'json_object' };
            const headers = { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' };
            if (provider.id === 'openrouter') headers['HTTP-Referer'] = window.location.origin || 'https://example.com';
            const r = await fetch(provider.baseUrl, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!r.ok) { lastErr = provider.label + ' (' + model + ') ' + r.status; continue; }
            const data = await r.json();
            const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
            if (!content) { lastErr = provider.label + ' boÃ…Å¸ yanÃ„Â±t'; continue; }
            return _parseAIContent(content, opts.json);
        } catch (e) { lastErr = provider.label + ': ' + e.message; }
    }
    throw new Error(lastErr || provider.label + ' baÃ…Å¸arÃ„Â±sÃ„Â±z.');
};


// Metni NVIDIA'dan ÃƒÂ¼ret
const callNvidiaChat = async (systemPrompt, userPrompt, opts = {}) => {
    const key = getApiKey();
    if (!key) throw new Error('NVIDIA API anahtarÃ„Â± girilmemiÃ…Å¸.');
    const body = {
        model: opts.model || NV_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: opts.temperature != null ? opts.temperature : 0.7,
        max_tokens: opts.max_tokens || 4096,
        top_p: opts.top_p != null ? opts.top_p : 0.9,
        stream: false
    };
    if (opts.json) body.response_format = { type: 'json_object' };
    const r = await fetch(NV_CHAT_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!r.ok) {
        const errText = await r.text().catch(() => '');
        throw new Error(`NVIDIA API hatasÃ„Â± (${r.status}): ${errText.substring(0, 150)}`);
    }
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || '';
    return _parseAIContent(content, opts.json);
};

// Metni Gemini'den ÃƒÂ¼ret (fallback) Ã¢â‚¬â€ ayrÃ„Â± Gemini key kullanÃ„Â±r
const callGeminiChat = async (systemPrompt, userPrompt, opts = {}) => {
    const key = getGeminiKey();
    if (!key) throw new Error('Gemini API anahtarÃ„Â± girilmemiÃ…Å¸.');
    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: opts.temperature != null ? opts.temperature : 0.7, maxOutputTokens: opts.max_tokens || 4096 }
    };
    for (const model of (opts.geminiModels || GEMINI_FALLBACK_MODELS)) {
        try {
            const r = await fetch(GEMINI_CHAT_URL(model) + `?key=${key}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (!r.ok) continue;
            const data = await r.json();
            const content = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
            if (content) return _parseAIContent(content, opts.json);
        } catch (e) { /* sonraki modele geÃƒÂ§ */ }
    }
    throw new Error('Gemini fallback modelleri baÃ…Å¸arÃ„Â±sÃ„Â±z.');
};

// Ortak JSON temizleyici
const _parseAIContent = (content, isJson) => {
    if (!isJson) return content;
    try {
        let cleaned = content.trim();
        if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}');
        if (s !== -1 && e !== -1) cleaned = cleaned.substring(s, e + 1);
        return JSON.parse(cleaned);
    } catch (e) {
        addSystemLog('AI JSON parse hatasÃ„Â±, ham metin dÃƒÂ¶ndÃƒÂ¼rÃƒÂ¼lÃƒÂ¼yor.', 'warn');
        return content;
    }
};

// ANA FALLBACK ZÃ„Â°NCÃ„Â°RÃ„Â°: NVIDIA -> OpenAI-uyumlu saÃ„Å¸layÃ„Â±cÃ„Â±lar -> Gemini
// Herhangi biri baÃ…Å¸arÃ„Â±lÃ„Â± olursa dÃƒÂ¶ner; hepsi baÃ…Å¸arÃ„Â±sÃ„Â±zsa hata verir.
const callAI = async (systemPrompt, userPrompt, opts = {}) => {
    const errors = [];
    if (getApiKey()) {
        try {
            const res = await callNvidiaChat(systemPrompt, userPrompt, opts);
            addSystemLog('Metin NVIDIA ile ÃƒÂ¼retildi.', 'success');
            return res;
        } catch (e) { errors.push('NVIDIA: ' + e.message); addSystemLog('NVIDIA baÃ…Å¸arÃ„Â±sÃ„Â±z: ' + e.message, 'warn'); }
    }
    for (const provider of AI_PROVIDERS) {
        if (!getProviderKey(provider.id)) continue;
        try {
            const res = await callOpenAICompatible(provider, systemPrompt, userPrompt, opts);
            addSystemLog('Metin ' + provider.label + ' ile ÃƒÂ¼retildi.', 'success');
            return res;
        } catch (e) { errors.push(provider.label + ': ' + e.message); addSystemLog(provider.label + ' baÃ…Å¸arÃ„Â±sÃ„Â±z: ' + e.message, 'warn'); }
    }
    if (getGeminiKey()) {
        try {
            const res = await callGeminiChat(systemPrompt, userPrompt, opts);
            addSystemLog('Metin Gemini fallback ile ÃƒÂ¼retildi.', 'success');
            return res;
        } catch (e) { errors.push('Gemini: ' + e.message); addSystemLog('Gemini baÃ…Å¸arÃ„Â±sÃ„Â±z: ' + e.message, 'warn'); }
    }
    throw new Error('TÃƒÂ¼m AI saÃ„Å¸layÃ„Â±cÃ„Â±larÃ„Â± baÃ…Å¸arÃ„Â±sÃ„Â±z:\n' + errors.join('\n'));
};

// Yerel mÃƒÂ¼zik kÃƒÂ¼tÃƒÂ¼phanesinden id/url ile ÃƒÂ§ÃƒÂ¶zÃƒÂ¼m (GDrive kaldÃ„Â±rÃ„Â±ldÃ„Â± H1.152)
const fetchWithCorsProxy = async (url) => {
    if (url && (url.startsWith('/Muzik/') || url.startsWith('blob:') || url.startsWith('data:'))) {
        try { const r = await fetch(url); if (r.ok) return r; } catch(e) {}
    }
    const idMatch = typeof url === 'string' ? url.match(/local_([a-zA-Z0-9_]+)/) : null;
    if (idMatch) {
        const localUrl = (typeof getMusicUrlById === 'function') ? (getMusicUrlById(url) || getMusicUrlById('local_' + idMatch[1])) : null;
        if (localUrl) { try { const r = await fetch(localUrl); if (r.ok) return r; } catch(e) {} }
    }
    throw new Error('MÃƒÂ¼zik bulunamadÃ„Â±. public/Muzik/ klasÃƒÂ¶rÃƒÂ¼nÃƒÂ¼ kontrol edin.');
};

// API anahtarÃ„Â± artÃ„Â±k UI'dan girilir (sessionStorage). Kodda hardcoded deÃ„Å¸il.
// NVIDIA ve Gemini ayrÃ„Â± anahtarlarla ÃƒÂ§alÃ„Â±Ã…Å¸Ã„Â±r (farklÃ„Â± formatlarda).
const NV_API_KEY_STORAGE = 'ns_nvidiaKey';
const GEMINI_API_KEY_STORAGE = 'ns_geminiKey';
const getApiKey = () => {
    try { return sessionStorage.getItem(NV_API_KEY_STORAGE) || ''; } catch (e) { return ''; }
};
const setApiKey = (k) => {
    try { if (k) sessionStorage.setItem(NV_API_KEY_STORAGE, k); else sessionStorage.removeItem(NV_API_KEY_STORAGE); } catch (e) {}
};
const getGeminiKey = () => {
    try { return sessionStorage.getItem(GEMINI_API_KEY_STORAGE) || ''; } catch (e) { return ''; }
};
const setGeminiKey = (k) => {
    try { if (k) sessionStorage.setItem(GEMINI_API_KEY_STORAGE, k); else sessionStorage.removeItem(GEMINI_API_KEY_STORAGE); } catch (e) {}
};

// ============================================================
// YEREL MÃƒÅ“ZÃ„Â°K KÃƒÅ“TÃƒÅ“PHANESÃ„Â° (GDrive kaldÃ„Â±rÃ„Â±ldÃ„Â± H1.152)
const SafeStorage = {
    memoryStore: {},
    getItem: (key) => { try { return localStorage.getItem(key); } catch (e) { return SafeStorage.memoryStore[key] || null; } },
    setItem: (key, value) => { try { localStorage.setItem(key, value); } catch (e) { SafeStorage.memoryStore[key] = value; } }
};

const _getAudioCtx = () => {
    if (!window._globalAudioCtx) {
        window._globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (window._globalAudioCtx.state === 'suspended') {
        window._globalAudioCtx.resume().catch(() => {});
    }
    return window._globalAudioCtx;
};

const _suspendAudioCtx = () => {
    if (window._globalAudioCtx && window._globalAudioCtx.state === 'running') {
        window._globalAudioCtx.suspend().catch(() => {});
    }
};

class EventBus {
    constructor() { this.listeners = {}; }
    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    emit(event, data) { if (this.listeners[event]) this.listeners[event].forEach(cb => cb(data)); }
}
const sysEventBus = new EventBus();

const _logBuffer = [];
const _LOG_BUFFER_CAP = 500;
const addSystemLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    const entry = { text, type, timestamp: time };
    _logBuffer.push(entry);
    if (_logBuffer.length > _LOG_BUFFER_CAP) _logBuffer.splice(0, _logBuffer.length - _LOG_BUFFER_CAP);
    sysEventBus.emit('SYS_LOG_ADD', entry);
    console.log(`[SYS_LOG] [${type.toUpperCase()}] ${text}`);
};
window.addSystemLog = addSystemLog;

const exportWorkflowLog = (jobState) => {
    const lines = ['=== AI News Studio Workflow Log ===', `Tarih: ${new Date().toLocaleString('tr-TR')}`, `Versiyon: v1.0`, ''];
    lines.push('--- Sistem LoglarÃ„Â± ---');
    for (const e of _logBuffer) lines.push(`[${e.timestamp}] [${e.type.toUpperCase()}] ${e.text}`);
    lines.push('');
    lines.push('--- Workflow State ---');
    lines.push(`Job ID: ${jobState?.jobId || 'N/A'}`);
    lines.push(`Status: ${jobState?.status || 'N/A'}`);
    lines.push(`Slides: ${jobState?.script?.videoSlides?.length || 0}`);
    lines.push(`ImageBlocks: ${jobState?.script?.imageBlocks?.length || 0}`);
    lines.push(`Images generated: ${jobState?.assets?.images?.filter(Boolean).length || 0}/${jobState?.assets?.images?.length || 0}`);
    lines.push(`Audio generated: ${jobState?.assets?.audio?.filter(Boolean).length || 0}/${jobState?.assets?.audio?.length || 0}`);
    lines.push(`Config: ${JSON.stringify(jobState?.config || {}, null, 2)}`);
    lines.push('');
    lines.push('--- Slide Details ---');
    for (const [i, s] of (jobState?.script?.videoSlides || []).entries()) {
        lines.push(`S${i + 1}: "${(s.spokenText || '').substring(0, 80)}..." img=${!!jobState?.assets?.images?.[i]} aud=${!!jobState?.assets?.audio?.[i]}`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `workflow_log_${Date.now()}.txt`;
    a.click();
};
window.exportWorkflowLog = exportWorkflowLog;

const getWPS = (lang) => ({ 'en': 2.5, 'es': 2.6, 'fr': 2.4, 'tr': 2.2, 'ar': 2.2, 'de': 2.0, 'ru': 2.0 }[lang] || 2.2);

const getDurationBounds = (dur) => {
    if (dur === '15') return { min: 15.0, max: 30.0 };
    if (dur === '30') return { min: 30.0, max: 60.0 };
    if (dur === '60') return { min: 60.0, max: 90.0 };
    if (dur === '90') return { min: 90.0, max: 120.0 };
    return { min: 0.0, max: 9999.0 };
};

let app, auth, db, appId;
const initFirebase = () => {
    try {
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        if (Object.keys(firebaseConfig).length > 0) { app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; return true; }
    } catch (e) { console.warn("[INFRA] Firebase baÃ…Å¸latÃ„Â±lamadÃ„Â±, izole modda ÃƒÂ§alÃ„Â±Ã…Å¸Ã„Â±lÃ„Â±yor."); }
    return false;
};
const isFirebaseActive = initFirebase();

const attemptSilentReauth = async () => {
    try {
        if (auth) {
            addSystemLog("Yetkilendirme anahtarÃ„Â± yenileniyor (Silent Re-Auth)...", "warn");
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
            else await signInAnonymously(auth);
            addSystemLog("Oturum anahtarÃ„Â± arka planda baÃ…Å¸arÃ„Â±yla tazelendi!", "success");
            return true;
        }
    } catch (e) { addSystemLog("Sessiz re-auth denemesi baÃ…Å¸arÃ„Â±sÃ„Â±z oldu: " + e.message, "error"); }
    return false;
};

const NetworkUtils = {
    fetchWithRetry: async (url, options, retries = 5) => {
        const delays = [1000, 2000, 4000, 8000, 16000];
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(url, options);
                if (res.ok) return res;
                if (res.status === 400 || res.status === 403 || res.status === 404) throw new Error(`HTTP_FAIL_${res.status}`);
                if (res.status === 401) {
                    addSystemLog(`Oturum hatasÃ„Â± (401) algÃ„Â±landÃ„Â±, sessiz yenileme deneniyor...`, "warn");
                    const success = await attemptSilentReauth();
                    if (success) { addSystemLog(`Sessiz kimlik doÃ„Å¸rulama tazelendi, istek yeniden deneniyor.`, "success"); continue; }
                    if (i === retries - 1) { sysEventBus.emit('AUTH_EXPIRED', true); throw new Error("Oturum sÃƒÂ¼resi doldu (401)."); }
                    await new Promise(r => setTimeout(r, delays[i])); continue;
                }
                if (res.status === 429 || res.status >= 500) { addSystemLog(`YavaÃ…Å¸lÃ„Â±k (HTTP ${res.status}). Yeniden deneme (${i + 1}/${retries}) - ${delays[i] / 1000}sn...`, "warn"); await new Promise(r => setTimeout(r, delays[i])); continue; }
                throw new Error(`HTTP Error ${res.status}`);
            } catch (err) {
                if (err.message.startsWith('HTTP_FAIL_') || err.message.includes('Oturum sÃƒÂ¼resi doldu')) throw err;
                if (i === retries - 1) throw err;
                addSystemLog(`BaÃ„Å¸lantÃ„Â± kesintisi. Yeniden deneniyor (${i + 1}/${retries}) - ${delays[i] / 1000}sn...`, "warn");
                await new Promise(r => setTimeout(r, delays[i]));
            }
        }
        throw new Error('fetchWithRetry: tÃƒÂ¼m denemeler baÃ…Å¸arÃ„Â±sÃ„Â±z');
    },
    loadImage: (src) => new Promise((resolve) => { if (!src) return resolve(null); if (typeof src !== 'string') { console.warn('loadImage: src string deÃ„Å¸il', typeof src); return resolve(null); } const img = new Image(); if (src.startsWith('http')) img.crossOrigin = "Anonymous"; img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; }),
    fileToBase64: (file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); }),
    compressImage: (file) => new Promise((resolve) => {
        if (!file.type.startsWith('image/')) { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width; let h = img.height; const maxW = 1080;
                if (w > maxW || h > maxW) {
                    if (w > h) { h = Math.round((h / w) * maxW); w = maxW; }
                    else { w = Math.round((w / h) * maxW); h = maxW; }
                }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium';
                ctx.drawImage(img, 0, 0, w, h);
                const res = canvas.toDataURL('image/jpeg', 0.7);
                canvas.width = 0; canvas.height = 0; // Release canvas texture buffer
                resolve(res);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    })
};

const ASSET_DB = 'AINewsSaaS_Assets_v5';
const STORE_MEDIA = 'media_cache';
const STORE_JOBS = 'temporal_jobs';
const LIB_STORE = 'musicLib';
const DIR_STORE = 'dirHandles';

class AssetManagerService {
    static async getDB() { return new Promise((resolve, reject) => { const req = indexedDB.open(ASSET_DB, 2); req.onupgradeneeded = (e) => { const db = e.target.result; if (!db.objectStoreNames.contains(STORE_MEDIA)) db.createObjectStore(STORE_MEDIA, { keyPath: 'id' }); if (!db.objectStoreNames.contains(STORE_JOBS)) db.createObjectStore(STORE_JOBS, { keyPath: 'jobId' }); if (!db.objectStoreNames.contains(LIB_STORE)) db.createObjectStore(LIB_STORE, { keyPath: 'id' }); if (!db.objectStoreNames.contains(DIR_STORE)) db.createObjectStore(DIR_STORE, { keyPath: 'id' }); }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
    static async saveMedia(id, data) { try { const db = await this.getDB(); const tx = db.transaction(STORE_MEDIA, 'readwrite'); tx.objectStore(STORE_MEDIA).put({ id, data, timestamp: Date.now() }); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async loadMedia(id) { try { const db = await this.getDB(); const tx = db.transaction(STORE_MEDIA, 'readonly'); const req = tx.objectStore(STORE_MEDIA).get(id); return new Promise(r => req.onsuccess = () => r(req.result?.data || null)); } catch (e) { return null; } }
    static async deleteMedia(id) { try { const db = await this.getDB(); const tx = db.transaction(STORE_MEDIA, 'readwrite'); tx.objectStore(STORE_MEDIA).delete(id); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async saveJobState(jobData) { try { const db = await this.getDB(); const tx = db.transaction(STORE_JOBS, 'readwrite'); tx.objectStore(STORE_JOBS).put(jobData); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async getPendingJob() { try { const db = await this.getDB(); const tx = db.transaction(STORE_JOBS, 'readonly'); const req = tx.objectStore(STORE_JOBS).getAll(); return new Promise(r => req.onsuccess = () => { const jobs = req.result || []; const pending = jobs.find(j => j.status !== 'COMPLETED' && j.status !== 'FAILED'); r(pending || null); }); } catch (e) { return null; } }
    static async clearJob(jobId) { try { const db = await this.getDB(); const tx = db.transaction(STORE_JOBS, 'readwrite'); tx.objectStore(STORE_JOBS).delete(jobId); } catch (e) { } }
    static async saveMusicToLib(musicObj) { try { const db = await this.getDB(); const tx = db.transaction(LIB_STORE, 'readwrite'); tx.objectStore(LIB_STORE).put(musicObj); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async getAllMusicFromLib() { try { const db = await this.getDB(); const tx = db.transaction(LIB_STORE, 'readonly'); const req = tx.objectStore(LIB_STORE).getAll(); return new Promise(r => req.onsuccess = () => r(req.result || [])); } catch (e) { return []; } }
    static async getMusicFromLib(id) { try { const db = await this.getDB(); const tx = db.transaction(LIB_STORE, 'readonly'); const req = tx.objectStore(LIB_STORE).get(id); return new Promise(r => req.onsuccess = () => r(req.result || null)); } catch (e) { return null; } }
    static async removeMusicFromLib(id) { try { const db = await this.getDB(); const tx = db.transaction(LIB_STORE, 'readwrite'); tx.objectStore(LIB_STORE).delete(id); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async saveDirHandle(handle) { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readwrite'); tx.objectStore(DIR_STORE).put({ id: 'musicDir', handle, name: handle.name, lastSync: Date.now() }); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async getDirHandle() { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readonly'); const req = tx.objectStore(DIR_STORE).get('musicDir'); return new Promise(r => req.onsuccess = () => r(req.result || null)); } catch (e) { return null; } }
    static async removeDirHandle() { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readwrite'); tx.objectStore(DIR_STORE).delete('musicDir'); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    // Ã„Â°ndirilenler klasÃƒÂ¶rÃƒÂ¼ iÃƒÂ§in directory handle
    static async saveDownloadsDirHandle(handle) { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readwrite'); tx.objectStore(DIR_STORE).put({ id: 'downloadsDir', handle, name: handle.name, timestamp: Date.now() }); return new Promise(r => tx.oncomplete = () => r(true)); } catch (e) { return false; } }
    static async getDownloadsDirHandle() { try { const db = await this.getDB(); const tx = db.transaction(DIR_STORE, 'readonly'); const req = tx.objectStore(DIR_STORE).get('downloadsDir'); return new Promise(r => req.onsuccess = () => r(req.result || null)); } catch (e) { return null; } }
}

const syncMusicFromDir = async (dirHandle, existingMusic) => {
    const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'];
    const existingIds = new Set(existingMusic.map(m => m.id));
    let newCount = 0;
    try {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && audioExts.some(ext => entry.name.toLowerCase().endsWith(ext))) {
                const file = await entry.getFile();
                const id = "fm_" + file.name.replace(/[^a-zA-Z0-9]/g, '_') + "_" + file.size;
                if (existingIds.has(id)) continue;
                const b64 = await NetworkUtils.fileToBase64(file);
                await AssetManagerService.saveMusicToLib({ id, name: file.name, data: b64 });
                newCount++;
            }
        }
        if (dirHandle.name) {
            const db = await AssetManagerService.getDB();
            const tx = db.transaction(DIR_STORE, 'readwrite');
            tx.objectStore(DIR_STORE).put({ id: 'musicDir', handle: dirHandle, name: dirHandle.name, lastSync: Date.now() });
        }
    } catch (e) {
        console.warn("Otomatik senkronizasyon hatasÃ„Â±:", e);
    }
    return newCount;
};

const analyzeQuoteEmotion = (text) => {
    const lower = text.toLowerCase();
    const mutluKelimeler = ['mutlu', 'sevinÃƒÂ§', 'neÃ…Å¸e', 'gÃƒÂ¼le', 'eÃ„Å¸len', 'coÃ…Å¸ku', 'baÃ…Å¸arÃ„Â±', 'zafer', 'kazan', 'umut', 'gÃƒÂ¼neÃ…Å¸', 'aydÃ„Â±nlÃ„Â±k', 'gÃƒÂ¼zel', 'sevgi', 'aÃ…Å¸k', 'sev', 'tatlÃ„Â±', 'tat', 'bal', 'ÃƒÂ§iÃƒÂ§ek', 'bahar', 'yaz', 'dÃƒÂ¼nya', 'yaÃ…Å¸am', 'hayat'];
    const hÃƒÂ¼zÃƒÂ¼nlÃƒÂ¼Kelimeler = ['hÃƒÂ¼zÃƒÂ¼n', 'ÃƒÂ¼zgÃƒÂ¼n', 'aÃ„Å¸la', 'gÃƒÂ¶z yaÃ…Å¸', 'keder', 'acÃ„Â±', 'kayÃ„Â±p', 'ÃƒÂ¶lÃƒÂ¼m', 'ayrÃ„Â±lÃ„Â±k', 'yalnÃ„Â±z', 'yalnÃ„Â±zlÃ„Â±k', 'karanlÃ„Â±k', 'gece', 'son', 'bitiÃ…Å¸', 'veda', 'gÃƒÂ¶ÃƒÂ§', 'hÃ„Â±ÃƒÂ§kÃ„Â±rÃ„Â±k', 'fÃ„Â±rtÃ„Â±na', 'yaÃ„Å¸mur', 'kÃ„Â±Ã…Å¸', 'soÃ„Å¸uk', 'don', 'gÃƒÂ¶z yaÃ…Å¸'];
    const romantikKelimeler = ['aÃ…Å¸k', 'sevda', 'sevgili', 'kalp', 'gÃƒÂ¶nÃƒÂ¼l', 'dudak', 'ÃƒÂ¶p', 'sarÃ„Â±', 'kokla', 'tatlÃ„Â±', 'bal', 'gÃƒÂ¼l', 'ay', 'yÃ„Â±ldÃ„Â±z', 'gece', 'rk', 'dÃƒÂ¼Ã…Å¸', 'rÃƒÂ¼ya', 'ÃƒÂ¶zlem', 'bekle', 'hasret', 'vuslat', 'buluÃ…Å¸'];
    let mutluSkor = 0, hÃƒÂ¼zÃƒÂ¼nlÃƒÂ¼Skor = 0, romantikSkor = 0;
    mutluKelimeler.forEach(k => { if (lower.includes(k)) mutluSkor++; });
    hÃƒÂ¼zÃƒÂ¼nlÃƒÂ¼Kelimeler.forEach(k => { if (lower.includes(k)) hÃƒÂ¼zÃƒÂ¼nlÃƒÂ¼Skor++; });
    romantikKelimeler.forEach(k => { if (lower.includes(k)) romantikSkor++; });
    const maxSkor = Math.max(mutluSkor, hÃƒÂ¼zÃƒÂ¼nlÃƒÂ¼Skor, romantikSkor);
    if (maxSkor === 0) return 'notr';
    if (mutluSkor === maxSkor) return 'mutlu';
    if (hÃƒÂ¼zÃƒÂ¼nlÃƒÂ¼Skor === maxSkor) return 'hÃƒÂ¼zÃƒÂ¼nlÃƒÂ¼';
    return 'romantik';
};

const matchMusicToEmotion = (emotion, musicList) => {
    if (!musicList || musicList.length === 0) return null;
    const emotionKeywords = {
        'mutlu': ['happy', 'upbeat', 'energetic', 'pop', 'joy', 'dance', 'fun', 'bright', 'major', 'optimistic', 'mutlu', 'neÃ…Å¸eli', 'coÃ…Å¸kulu', 'eÃ„Å¸lence'],
        'hÃƒÂ¼zÃƒÂ¼nlÃƒÂ¼': ['sad', 'melancholy', 'emotional', 'piano', 'strings', 'slow', 'deep', 'minor', 'cry', 'sorrow', 'hÃƒÂ¼zÃƒÂ¼n', 'ÃƒÂ¼zÃƒÂ¼ntÃƒÂ¼', 'agir', 'yavas', 'duygusal'],
        'romantik': ['romantic', 'love', 'soft', 'gentle', 'dream', 'ambient', 'chill', 'relax', 'calm', 'aÃ…Å¸k', 'sevgi', 'roma', 'duygusal', 'yavas'],
        'notr': ['background', 'ambient', 'chill', 'lofi', 'calm', 'soft', 'neutral', 'minimal']
    };
    const keywords = emotionKeywords[emotion] || emotionKeywords['notr'];
    let bestMatch = null;
    let bestScore = -1;
    for (const track of musicList) {
        const name = (track.name || '').toLowerCase();
        let score = 0;
        for (const kw of keywords) {
            if (name.includes(kw)) score += 2;
        }
        const ext = name.split('.').pop();
        if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) score += 0.5;
        if (score > bestScore) { bestScore = score; bestMatch = track; }
    }
    if (bestScore <= 0) {
        const idx = Math.floor(Math.random() * musicList.length);
        return musicList[idx];
    }
    return bestMatch;
};

class LogicEngineService {
    
    
    static validateCurrency(text) {
        if (!text) return text;
        // Prevent $ for Turkish economic data
        if (text.indexOf('$') > -1 && (text.indexOf('aclik') > -1 || text.indexOf('asgari') > -1 || text.indexOf('emekli') > -1 || text.indexOf('yoksulluk') > -1 || text.indexOf('maas') > -1)) {
            text = text.replace(/\$/g, 'TL');
        }
        return text;
    }

    static validateTurkishText(text) {
        if (!text) return text;
        var fixes = {
            'Turkiye': 'T\u00FCrkiye', 'turkiye': 't\u00FCrkiye',
            'Istanbul': '\u0130stanbul', 'istanbul': 'istanbul',
            'Izmir': '\u0130zmir', 'izmir': 'izmir',
            'Ankara': 'Ankara', 'ankara': 'ankara',
            'asgari ucret': 'asgari \u00FCcret', 'Asgari Ucret': 'Asgari \u00FCcret',
            'issizlik': 'i\u015Fsizlik', 'Issizlik': '\u0130\u015Fsizlik',
            'buyume': 'b\u00FCy\u00FCme', 'Buyume': 'B\u00FCy\u00FCme',
            'doviz': 'd\u00F6viz', 'Doviz': 'D\u00F6viz',
            'borc': 'bor\u00E7', 'Borc': 'Bor\u00E7',
            'butce': 'b\u00FCt\u00E7e', 'Butce': 'B\u00FCt\u00E7e',
            'enflasyon': 'enflasyon', 'Enflasyon': 'Enflasyon',
            'faiz': 'faiz', 'Faiz': 'Faiz',
            'maas': 'maa\u015F', 'Maas': 'Maa\u015F',
            'ucurum': 'u\u00E7urum', 'Ucurum': 'U\u00E7urum',
            'yuzde': 'y\u00FCzde', 'Yuzde': 'Y\u00FCzde',
            'Turk': 'T\u00FCrk', 'turk': 't\u00FCrk',
            'Turkce': 'T\u00FCrk\u00E7e', 'turkce': 't\u00FCrk\u00E7e',
            'Aclik': 'A\u00E7l\u0131k', 'aclik': 'a\u00E7l\u0131k',
            'Yoksulluk': 'Yoksulluk', 'yoksulluk': 'yoksulluk',
            'Emekli': 'Emekli', 'emekli': 'emekli',
            'Memur': 'Memur', 'memur': 'memur',
            'isci': 'i\u015F\u00E7i', 'Isci': '\u0130\u015F\u00E7i',
            'ogretmen': '\u00F6\u011Fretmen', 'Ogretmen': '\u00D6\u011Fretmen',
            'doktor': 'doktor', 'Doktor': 'Doktor',
            'hemsire': 'hem\u015Fire', 'Hemsire': 'Hem\u015Fire',
            'muhendis': 'm\u00FChendis', 'Muhendis': 'M\u00FChendis',
            'avukat': 'avukat', 'Avukat': 'Avukat',
        };
        Object.keys(fixes).forEach(function(wrong) {
            text = text.split(wrong).join(fixes[wrong]);
        });
        return text;
    }

    static validateEconomyData(data) {
        var errors = [];
        if (!data || !data.videoSlides) return errors;
        data.videoSlides.forEach(function(slide, i) {
            var text = (slide.spokenText || '') + ' ' + (slide.topText || '');
            if (text.indexOf('Turkiye') > -1 || text.indexOf('turkiye') > -1) {
                errors.push('Sahne ' + (i+1) + ': Turkiye yerine T\u00FCrkiye yaz\u0131lmal\u0131');
            }
            if (text.indexOf('$') > -1 && (text.indexOf('a\u00E7l\u0131k') > -1 || text.indexOf('asgari') > -1 || text.indexOf('emekli') > -1)) {
                errors.push('Sahne ' + (i+1) + ': T\u00FCrk ekonomik verisi $ ile g\u00F6sterilmi\u015F, TL olmal\u0131');
            }
        });
        return errors;
    }

    static getEconomyDataPrompt() {
        return 'ZORUNLU EKONOMI VERILERI:\n' +
            'T\u00DCFE, TCMB Beklentisi, Politika Faizi, A\u00E7l\u0131k S\u0131n\u0131r\u0131, Yoksulluk S\u0131n\u0131r\u0131, ' +
            'Asgari \u00DCcret, Emekli Maa\u015F\u0131, Memur Maa\u015F\u0131, \u0130\u015F\u00E7i Maa\u015F\u0131, ' +
            'Dolar/TL, Euro/TL, Gram Alt\u0131n, \u00C7eyrek Alt\u0131n, \u0130\u015Fsizlik, B\u00FCy\u00FCme\n' +
            'KURALLAR: T\u00FCrk\u00E7e karakter, TL para birimi, 85.450 TL say\u0131 bi\u00E7imi, kaynak belirt\n';
    }

    static async analyzeContent(inputData, inputType, config) {
        addSystemLog('Ã„Â°ÃƒÂ§erik analiz ediliyor (NVIDIA)...', 'info');
        // NVIDIA chat API'si gÃƒÂ¶rsel girdiyi desteklemez; media/url giriÃ…Å¸leri metin-prompt'a dÃƒÂ¼Ã…Å¸ÃƒÂ¼rÃƒÂ¼lÃƒÂ¼r.
        if (!(inputType === 'prompt' || inputType === 'text' || inputType === 'url' || inputType === 'topic')) {
            if (inputType === 'media' && Array.isArray(inputData)) {
                addSystemLog('NVIDIA gÃƒÂ¶rsel girdiyi iÃ…Å¸leyemez; medya yerine aÃƒÂ§Ã„Â±klama metni kullanÃ„Â±lacak.', 'warn');
                const descs = inputData.map(f => f.name || f.type || 'medya').join(', ');
                inputData = `KullanÃ„Â±cÃ„Â± Ã…Å¸u medyayÃ„Â± yÃƒÂ¼kledi: ${descs}. Bu medya hakkÃ„Â±nda haber senaryosu ÃƒÂ¼ret.`;
                inputType = 'prompt';
            } else {
                inputType = 'prompt';
            }
        }

        if (config.tip === 'guzel_soz') {
            return LogicEngineService._buildGuzelSozScript(inputData, inputType, config);
        }
        if (config.tip === 'iddia_analizi') {
            return LogicEngineService._analyzeIddia(inputData, inputType, config);
        }
        let isUnlimited = config.duration === 'unlimited';
        let targetSec = isUnlimited ? 0 : (config.duration === '15' ? 30 : config.duration === '30' ? 60 : config.duration === '60' ? 90 : config.duration === '90' ? 120 : 60);
        let sceneCount = 4; let words = "80-95";
        const useForceExact = !isUnlimited;
        if (useForceExact) {
            const wps = getWPS(config.language);
            if (config.duration === '15') { sceneCount = 4; words = `${Math.floor(15 * wps)}-${Math.floor(25 * wps)}`; }
            else if (config.duration === '30') { sceneCount = 6; words = `${Math.floor(30 * wps)}-${Math.floor(52 * wps)}`; }
            else if (config.duration === '60') { sceneCount = 9; words = `${Math.floor(60 * wps)}-${Math.floor(82 * wps)}`; }
            else if (config.duration === '90') { sceneCount = 13; words = `${Math.floor(90 * wps)}-${Math.floor(112 * wps)}`; }
        } else { sceneCount = "Ã„Â°ÃƒÂ§eriÃ„Å¸e gÃƒÂ¶re en az 10, ortalama 18-25 sahne"; words = "Ã„Â°ÃƒÂ§eriÃ„Å¸i eksiksiz anlatacak kadar esnek"; }

        let styleInstruction = "Video stili: TarafsÃ„Â±z, analitik, ciddi ve keskin bir haber editÃƒÂ¶rÃƒÂ¼.";
        if (config.videoStyle === 'prompt_output') styleInstruction = "Video stili: Ãƒâ€“zel Prompt Ãƒâ€¡Ã„Â±ktÃ„Â±sÃ„Â±. KullanÃ„Â±cÃ„Â±nÃ„Â±n girdiÃ„Å¸i metni doÃ„Å¸rudan uygula.";

        let langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU TÃƒÅ“RKÃƒâ€¡E YAZACAKSIN.";
        if (config.language === 'en') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU Ã„Â°NGÃ„Â°LÃ„Â°ZCE YAZACAKSIN.";
        if (config.language === 'fr') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU FRANSIZCA YAZACAKSIN.";
        if (config.language === 'de') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU ALMANCA YAZACAKSIN.";
        if (config.language === 'es') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU Ã„Â°SPANYOLCA YAZACAKSIN.";
        if (config.language === 'ar') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU ARAPÃƒâ€¡A YAZACAKSIN.";
        if (config.language === 'ru') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU RUSÃƒâ€¡A YAZACAKSIN.";

        const isImageOutput = config.outputType === 'image';
        let timeConstraint = isUnlimited ? `SÃƒÅ“RE SINIRI YOKTUR. OlayÃ„Â± detaylÃ„Â±ca anlat.` : `DÃ„Â°NAMÃ„Â°K KISITLAYICI: Videonun hedef sÃƒÂ¼resi ${config.duration === '15' ? '15-30' : config.duration === '30' ? '30-60' : config.duration === '60' ? '60-90' : '90-120'} saniyedir. Maksimum ${words.split('-')[1]} KELÃ„Â°ME.`;

        let dynamicRules = "";
        if (config.analysisMode === 'yorumsuz') {
            dynamicRules = `BÃ„Â°RÃ„Â°NCÃ„Â° KURAL (SADECE HABER - YORUMSUZ): Girdiyi dikkatlice incele. SADECE haberi tarafsÃ„Â±zca anlat. 5N1K kurallarÃ„Â±nÃ„Â± uygula. Kendi yorumunu katma.\nÃ„Â°KÃ„Â°NCÃ„Â° KURAL: 'mediaBlackout.show' deÃ„Å¸erini false yap.\nÃƒÅ“Ãƒâ€¡ÃƒÅ“NCÃƒÅ“ KURAL: 'sonSoz' alanÃ„Â±nÃ„Â± tekrarlama.\nDÃƒâ€“RDÃƒÅ“NCÃƒÅ“ KURAL: Her sahnenin 'spokenText' metni NOKTA Ã„Â°LE BÃ„Â°TEN BÃ„Â°R CÃƒÅ“MLE OLMALIDIR.\n${timeConstraint}`;
        } else if (config.analysisMode === 'deep_analysis') {
            dynamicRules = `BÃ„Â°RÃ„Â°NCÃ„Â° KURAL (DERÃ„Â°N ANALÃ„Â°Z): 5N1K dengesini sorgula ve sosyolojik/ekonomik etkileri analiz et.\nÃ„Â°KÃ„Â°NCÃ„Â° KURAL: Skandalsa 'mediaBlackout.show' true yap.\nÃƒÅ“Ãƒâ€¡ÃƒÅ“NCÃƒÅ“ KURAL: 'sonSoz' alanÃ„Â±nÃ„Â± tekrarlama.\nDÃƒâ€“RDÃƒÅ“NCÃƒÅ“ KURAL: Her sahnenin 'spokenText' metni NOKTA Ã„Â°LE BÃ„Â°TEN BÃ„Â°R CÃƒÅ“MLE OLMALIDIR.\n${timeConstraint}`;
        } else {
            dynamicRules = `BÃ„Â°RÃ„Â°NCÃ„Â° KURAL (HABER 5N1K): Girdiyi incele, 5N1K kuralÃ„Â±na sadÃ„Â±k kalarak ÃƒÂ¶zetle.\nÃ„Â°KÃ„Â°NCÃ„Â° KURAL: Skandal deÃ„Å¸ilse 'mediaBlackout.show' false yap.\nÃƒÅ“Ãƒâ€¡ÃƒÅ“NCÃƒÅ“ KURAL: 'sonSoz' alanÃ„Â±nÃ„Â± tekrarlama.\nDÃƒâ€“RDÃƒÅ“NCÃƒÅ“ KURAL: Her sahnenin 'spokenText' metni NOKTA Ã„Â°LE BÃ„Â°TEN BÃ„Â°R CÃƒÅ“MLE OLMALIDIR.\n${timeConstraint}`;
        }

        let sonSozInstruction = "";
        if (!isImageOutput) sonSozInstruction = `\n\nYEDÃ„Â°NCÃ„Â° KURAL (SON SÃƒâ€“Z): Konuya cuk diye oturan ÃƒÂ§ok vurucu bir ATASÃƒâ€“ZÃƒÅ“ veya Ãƒâ€“ZLÃƒÅ“ SÃƒâ€“Z belirle. Bunu 'sonSoz' alanÃ„Â±na kaydet.`;

        const sysPrompt = `Sen TikTok ve Instagram Reels iÃƒÂ§in viral iÃƒÂ§erikler ÃƒÂ¼reten profesyonel bir iÃƒÂ§erik ÃƒÂ¼reticisisin. Karakterin: Zeki, gerÃƒÂ§ekleri sÃƒÂ¶yleyen, 20 yaÃ…Å¸Ã„Â±nda dertli bir genÃƒÂ§.\n\nSENARYOYU ${isImageOutput ? 1 : sceneCount} SAHNE olacak Ã…Å¸ekilde bÃƒÂ¶l!\nToplam konuÃ…Å¸ma metni ${words} kelime aralÃ„Â±Ã„Å¸Ã„Â±nda olmalÃ„Â±dÃ„Â±r.\n\nDÃ„Â°L KURALI: ${langInstruction}\n${styleInstruction}\n${dynamicRules}\n\nSES DOSYASI KURALI: EÃ„Å¸er sana bir ses dosyasÃ„Â± (audio) gÃƒÂ¶nderildiyse, Ãƒâ€“NCELÃ„Â°KLE sesi dikkatle dinle ve konuÃ…Å¸ulan her kelimeyi yazÃ„Â±ya dÃƒÂ¶k (transkribe et). Transkripti analiz et ve haber senaryosunu bu transkript ÃƒÂ¼zerinden ÃƒÂ¼ret. MÃƒÂ¼zik dosyasÃ„Â± ise (konuÃ…Å¸ma yoksa), dosya adÃ„Â±ndan ve mÃƒÂ¼zik tÃƒÂ¼rÃƒÂ¼nden anlam ÃƒÂ§Ã„Â±karmaya ÃƒÂ§alÃ„Â±Ã…Å¸.\n\nEKONOMI KURALLARI (ekonomi haberi ise): Turkce karakter kullan, TL para birimi, sayi bicimi 85.450 TL, kaynak belirt (TUIK, TCMB, TURK-IS), aclik/yoksulluk siniri guncel olsun. Bilgi kartlari olustur: ENFLASYON %XX, ACLIK SINIRI XX.XXX TL.\n\nGAZETE BAÃ…ÂLIKLARI: GÃƒÂ¶rseldeki TÃƒÅ“M haber baÃ…Å¸lÃ„Â±klarÃ„Â±nÃ„Â± ÃƒÂ§Ã„Â±kar. Her baÃ…Å¸lÃ„Â±k iÃƒÂ§in:
- 'baslik': baÃ…Å¸lÃ„Â±k metni
- 'aciklama': haberin 2-3 cÃƒÂ¼mlelik ÃƒÂ¶zeti
- 'x': baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±n sol ÃƒÂ¼st x koordinatÃ„Â± (0-100 arasÃ„Â± yÃƒÂ¼zde)
- 'y': baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±n sol ÃƒÂ¼st y koordinatÃ„Â± (0-100 arasÃ„Â± yÃƒÂ¼zde)
- 'w': baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±n geniÃ…Å¸liÃ„Å¸i (0-100 arasÃ„Â± yÃƒÂ¼zde)
- 'h': baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±n yÃƒÂ¼ksekliÃ„Å¸i (0-100 arasÃ„Â± yÃƒÂ¼zde)
En az 1, en fazla 15 baÃ…Å¸lÃ„Â±k ÃƒÂ§Ã„Â±kar. KalÃ„Â±n siyah veya kÃ„Â±rmÃ„Â±zÃ„Â± yazÃ„Â± ile yazÃ„Â±lan baÃ…Å¸lÃ„Â±klarÃ„Â± al. Reklam, bulmaca, ilan HARÃ„Â°Ãƒâ€¡.

KAPAK DÃ„Â°LÃ„Â°: 'thumbnailText' ${config.language} dilinde olmalÃ„Â±dÃ„Â±r. Clickbait baÃ…Å¸lÃ„Â±k olmalÃ„Â±dÃ„Â±r.\nGRAFÃ„Â°KLER: Ã„Â°statistik yoksa 'chartData.show' false yap.\nGÃƒâ€“RSEL UYUMU: 'imagePrompts' alanÃ„Â±na yazacaÃ„Å¸Ã„Â±n Ã„Â°ngilizce komutlar, spokenText'teki ana gÃƒÂ¶rsel unsurlarÃ„Â± birebir tanÃ„Â±mlamalÃ„Â±dÃ„Â±r. KiÃ…Å¸i varsa yÃƒÂ¼z tanÃ„Â±mlÃ„Â±, mekan varsa detaylÃ„Â±, nesne varsa belirgin olmalÃ„Â±dÃ„Â±r. Her sahne iÃƒÂ§in tek bir gÃƒÂ¼ÃƒÂ§lÃƒÂ¼ prompt yaz.\nSIFIR HALÃƒÅ“SÃ„Â°NASYON: OkuyamadÃ„Â±ysan 'isContentUnreadable' true yap.\nATATÃƒÅ“RK HASSASÃ„Â°YETÃ„Â°: 'AtatÃƒÂ¼rk' geÃƒÂ§erse 'imagePrompts' kÃ„Â±smÃ„Â±na "Mustafa Kemal AtatÃƒÂ¼rk, highly detailed, respectful portrait" ekle!${sonSozInstruction}\n\nDÃƒÂ¶nÃƒÂ¼Ã…Å¸ ZORUNLU olarak JSON formatÃ„Â±nda olmalÃ„Â±.`;

        let userPrompt = "";
        let extractStatsHint = "OlayÃ„Â± tam anla ve KISA BÃ„Â°R Ãƒâ€“ZET ver.";
        if (config.analysisMode === 'yorumsuz') extractStatsHint = "SADECE haberi tarafsÃ„Â±zca oku.";

        if (inputType === 'prompt' || inputType === 'media') {
            userPrompt = `AÃ…ÂAÃ„ÂIDAKÃ„Â° TALÃ„Â°MATI UYGULA:\n\n${inputData}\n\n${extractStatsHint}`;
        }
        else if (inputType === 'url') {
            userPrompt = `[KRÃ„Â°TÃ„Â°K GÃƒâ€“REV]: URL'yi araÃ…Å¸tÃ„Â±r. \nURL: ${inputData}\n\nÃ„Â°ÃƒÂ§eriÃ„Å¸e ulaÃ…Å¸tÃ„Â±ysan haberi ÃƒÂ¶zetle. ${extractStatsHint}\nNOT: Ã„Â°nternet eriÃ…Å¸imin yoksa, bu URL hakkÃ„Â±nda makul bir haber senaryosu ÃƒÂ¼ret.`;
        }
        else {
            userPrompt = `AÃ…Å¸aÃ„Å¸Ã„Â±daki konuyu araÃ…Å¸tÃ„Â±r. Haberi ÃƒÂ¶zetle. \n\n${inputData}\n\n${extractStatsHint}`;
        }

        // NVIDIA chat completions ile JSON ÃƒÂ§Ã„Â±kÃ„Â±Ã…Å¸Ã„Â±
        try {
            const parsedData = await callAI(sysPrompt, userPrompt, { json: true, temperature: 0.7, max_tokens: 4096 });
            if (typeof parsedData === 'string') throw new Error('JSON ayrÃ„Â±Ã…Å¸madÃ„Â±: ' + parsedData.substring(0, 100));
            if (parsedData.isContentUnreadable) throw new Error("Orijinal metne ulaÃ…Å¸Ã„Â±lamadÃ„Â±.");
            if (parsedData.videoSlides) {
                const errPatterns = [/gÃƒÂ¶rselde.*metin.*bulunmamaktadÃ„Â±r/i, /no.*text.*found/i, /metin.*bulunamadÃ„Â±/i, /cannot.*read.*text/i];
                parsedData.videoSlides = parsedData.videoSlides.map(slide => {
                    if (slide.spokenText && errPatterns.some(p => p.test(slide.spokenText))) {
                        return { ...slide, spokenText: slide.topText || "Bu gÃƒÂ¶rseldeki iÃƒÂ§erik hakkÃ„Â±nda bilgi veriliyor." };
                    }
                    return slide;
                });
            }
            return parsedData;
        } catch (e) {
            if (e.message.includes('metne ulaÃ…Å¸Ã„Â±lamadÃ„Â±')) throw e;
            throw new Error(`NVIDIA analiz hatasÃ„Â±: ${e.message}`);
        }
    }

    // Tek bir gÃƒÂ¶rsel iÃƒÂ§in 2-3 sahne ÃƒÂ¼retir (sÃ„Â±ralÃ„Â± akÃ„Â±Ã…Å¸ iÃƒÂ§in)
    static async analyzeContentForImage(inputData, inputType, config, imageIndex, totalImages, previousContext) {
        addSystemLog(`GÃƒÂ¶rsel ${imageIndex + 1}/${totalImages} iÃƒÂ§in sahneler ÃƒÂ¼retiliyor (NVIDIA)...`, 'info');
        // NVIDIA gÃƒÂ¶rsel girdiyi desteklemez
        if (inputType === 'media' && Array.isArray(inputData)) {
            const descs = inputData.map(f => f.name || f.type).join(', ');
            inputData = `GÃƒÂ¶rsel aÃƒÂ§Ã„Â±klamasÃ„Â±: ${descs}. Bu gÃƒÂ¶rseldeki haberi/konuyu detaylÃ„Â±ca anlat.`;
            inputType = 'prompt';
        }

        let styleInstruction = "Video stili: TarafsÃ„Â±z, analitik, ciddi ve keskin bir haber editÃƒÂ¶rÃƒÂ¼.";
        if (config.videoStyle === 'prompt_output') styleInstruction = "Video stili: Ãƒâ€“zel Prompt Ãƒâ€¡Ã„Â±ktÃ„Â±sÃ„Â±. KullanÃ„Â±cÃ„Â±nÃ„Â±n girdiÃ„Å¸i metni doÃ„Å¸rudan uygula.";

        let langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU TÃƒÅ“RKÃƒâ€¡E YAZACAKSIN.";
        if (config.language === 'en') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU Ã„Â°NGÃ„Â°LÃ„Â°ZCE YAZACAKSIN.";
        if (config.language === 'fr') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU FRANSIZCA YAZACAKSIN.";
        if (config.language === 'de') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU ALMANCA YAZACAKSIN.";
        if (config.language === 'es') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU Ã„Â°SPANYOLCA YAZACAKSIN.";
        if (config.language === 'ar') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU ARAPÃƒâ€¡A YAZACAKSIN.";
        if (config.language === 'ru') langInstruction = "BÃƒÅ“TÃƒÅ“N SENARYOYU RUSÃƒâ€¡A YAZACAKSIN.";

        let dynamicRules = "";
        if (config.analysisMode === 'yorumsuz') {
            dynamicRules = `BÃ„Â°RÃ„Â°NCÃ„Â° KURAL (SADECE HABER - YORUMSUZ): Girdiyi dikkatlice incele. SADECE haberi tarafsÃ„Â±zca anlat. 5N1K kurallarÃ„Â±nÃ„Â± uygula. Kendi yorumunu katma.\nÃ„Â°KÃ„Â°NCÃ„Â° KURAL: 'mediaBlackout.show' deÃ„Å¸erini false yap.\nÃƒÅ“Ãƒâ€¡ÃƒÅ“NCÃƒÅ“ KURAL: Her sahnenin 'spokenText' metni NOKTA Ã„Â°LE BÃ„Â°TEN BÃ„Â°R CÃƒÅ“MLE OLMALIDIR.`;
        } else if (config.analysisMode === 'deep_analysis') {
            dynamicRules = `BÃ„Â°RÃ„Â°NCÃ„Â° KURAL (DERÃ„Â°N ANALÃ„Â°Z): 5N1K dengesini sorgula ve sosyolojik/ekonomik etkileri analiz et.\nÃ„Â°KÃ„Â°NCÃ„Â° KURAL: Skandalsa 'mediaBlackout.show' true yap.\nÃƒÅ“Ãƒâ€¡ÃƒÅ“NCÃƒÅ“ KURAL: Her sahnenin 'spokenText' metni NOKTA Ã„Â°LE BÃ„Â°TEN BÃ„Â°R CÃƒÅ“MLE OLMALIDIR.`;
        } else {
            dynamicRules = `BÃ„Â°RÃ„Â°NCÃ„Â° KURAL (HABER 5N1K): Girdiyi incele, 5N1K kuralÃ„Â±na sadÃ„Â±k kalarak ÃƒÂ¶zetle.\nÃ„Â°KÃ„Â°NCÃ„Â° KURAL: Skandal deÃ„Å¸ilse 'mediaBlackout.show' false yap.\nÃƒÅ“Ãƒâ€¡ÃƒÅ“NCÃƒÅ“ KURAL: Her sahnenin 'spokenText' metni NOKTA Ã„Â°LE BÃ„Â°TEN BÃ„Â°R CÃƒÅ“MLE OLMALIDIR.`;
        }

        const contextBlock = previousContext ? `\nÃƒâ€“NCEKÃ„Â° BLOKLARIN Ãƒâ€“ZETÃ„Â°: ${previousContext}\nBu bilgileri tekrarlama, SADECE bu gÃƒÂ¶rsel/eÃ„Å¸erseldeki yeni iÃƒÂ§eriÃ„Å¸e odaklan.` : "";
        const isLastImage = imageIndex === totalImages - 1;
        const sonSozRule = isLastImage ? `\n\nYEDÃ„Â°NCÃ„Â° KURAL (SON SÃƒâ€“Z): Konuya cuk diye oturan ÃƒÂ§ok vurucu bir ATASÃƒâ€“ZÃƒÅ“ veya Ãƒâ€“ZLÃƒÅ“ SÃƒâ€“Z belirle. Bunu 'sonSoz' alanÃ„Â±na kaydet.` : "";

        const sysPrompt = `Bu, ${totalImages} gÃƒÂ¶rsellik bir videonun ${imageIndex + 1}. bloÃ„Å¸udur.\nSen TikTok ve Instagram Reels iÃƒÂ§in viral iÃƒÂ§erikler ÃƒÂ¼reten profesyonel bir iÃƒÂ§erik ÃƒÂ¼reticisisin.\n\nSENARYOYU TAM OLARAK 2 SAHNE olacak Ã…Å¸ekilde bÃƒÂ¶l! GÃƒÂ¶rseldeki haberi/konuyu 2 farklÃ„Â± aÃƒÂ§Ã„Â±dan anlat.\nHer sahne bu gÃƒÂ¶rsele ait haberi anlatmalÃ„Â±.\nToplam konuÃ…Å¸ma metni bu blok iÃƒÂ§in 30-50 kelime aralÃ„Â±Ã„Å¸Ã„Â±nda olmalÃ„Â±dÃ„Â±r.\n\nDÃ„Â°L KURALI: ${langInstruction}\n${styleInstruction}\n${dynamicRules}\n${contextBlock}\n\nGAZETE BAÃ…ÂLIKLARI: GÃƒÂ¶rseldeki TÃƒÅ“M haber baÃ…Å¸lÃ„Â±klarÃ„Â±nÃ„Â± ÃƒÂ§Ã„Â±kar. Her baÃ…Å¸lÃ„Â±k iÃƒÂ§in:
- 'baslik': baÃ…Å¸lÃ„Â±k metni
- 'aciklama': haberin 2-3 cÃƒÂ¼mlelik ÃƒÂ¶zeti
- 'x': baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±n sol ÃƒÂ¼st x koordinatÃ„Â± (0-100 arasÃ„Â± yÃƒÂ¼zde)
- 'y': baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±n sol ÃƒÂ¼st y koordinatÃ„Â± (0-100 arasÃ„Â± yÃƒÂ¼zde)
- 'w': baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±n geniÃ…Å¸liÃ„Å¸i (0-100 arasÃ„Â± yÃƒÂ¼zde)
- 'h': baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±n yÃƒÂ¼ksekliÃ„Å¸i (0-100 arasÃ„Â± yÃƒÂ¼zde)
En az 1, en fazla 15 baÃ…Å¸lÃ„Â±k ÃƒÂ§Ã„Â±kar. KalÃ„Â±n siyah veya kÃ„Â±rmÃ„Â±zÃ„Â± yazÃ„Â± ile yazÃ„Â±lan baÃ…Å¸lÃ„Â±klarÃ„Â± al. Reklam, bulmaca, ilan HARÃ„Â°Ãƒâ€¡.

KAPAK DÃ„Â°LÃ„Â°: 'thumbnailText' ${config.language} dilinde olmalÃ„Â±dÃ„Â±r. Clickbait baÃ…Å¸lÃ„Â±k olmalÃ„Â±dÃ„Â±r.\nGRAFÃ„Â°KLER: Ã„Â°statistik yoksa 'chartData.show' false yap.\nGÃƒâ€“RSEL UYUMU: 'imagePrompts' alanÃ„Â±na yazacaÃ„Å¸Ã„Â±n Ã„Â°ngilizce komutlar, spokenText'teki ana gÃƒÂ¶rsel unsurlarÃ„Â± birebir tanÃ„Â±mlamalÃ„Â±dÃ„Â±r.\nATATÃƒÅ“RK HASSASÃ„Â°YETÃ„Â°: 'AtatÃƒÂ¼rk' geÃƒÂ§erse 'imagePrompts' kÃ„Â±smÃ„Â±na "Mustafa Kemal AtatÃƒÂ¼rk, highly detailed, respectful portrait" ekle!${sonSozRule}\n\nDÃƒÂ¶nÃƒÂ¼Ã…Å¸ ZORUNLU olarak JSON formatÃ„Â±nda olmalÃ„Â±.`;

        let userPrompt = "";
        let extractStatsHint = "OlayÃ„Â± tam anla ve KISA BÃ„Â°R Ãƒâ€“ZET ver.";
        if (config.analysisMode === 'yorumsuz') extractStatsHint = "SADECE haberi tarafsÃ„Â±zca oku.";

        if (inputType === 'prompt' || inputType === 'media') {
            userPrompt = `AÃ…ÂAÃ„ÂIDAKÃ„Â° TALÃ„Â°MATI UYGULA (Bu ${imageIndex + 1}/${totalImages} blok):\n\n${inputData}\n\n${extractStatsHint}`;
        } else if (inputType === 'url') {
            userPrompt = `URL'yi araÃ…Å¸tÃ„Â±r (Bu ${imageIndex + 1}/${totalImages} blok):\nURL: ${inputData}\n${extractStatsHint}`;
        } else {
            userPrompt = `Konuyu araÃ…Å¸tÃ„Â±r (Bu ${imageIndex + 1}/${totalImages} blok):\n${inputData}\n${extractStatsHint}`;
        }

        try {
            const parsedData = await callAI(sysPrompt, userPrompt, { json: true, temperature: 0.7, max_tokens: 2048 });
            if (typeof parsedData === 'string') throw new Error('JSON ayrÃ„Â±Ã…Å¸madÃ„Â±');
            if (parsedData.isContentUnreadable) throw new Error("Orijinal metne ulaÃ…Å¸Ã„Â±lamadÃ„Â±.");
            if (parsedData.videoSlides) {
                const errPatterns = [/gÃƒÂ¶rselde.*metin.*bulunmamaktadÃ„Â±r/i, /no.*text.*found/i, /metin.*bulunamadÃ„Â±/i, /cannot.*read.*text/i];
                parsedData.videoSlides = parsedData.videoSlides.map(slide => {
                    if (slide.spokenText && errPatterns.some(p => p.test(slide.spokenText))) {
                        return { ...slide, spokenText: slide.topText || "Bu gÃƒÂ¶rseldeki iÃƒÂ§erik hakkÃ„Â±nda bilgi veriliyor." };
                    }
                    return slide;
                });
            }
            addSystemLog(`GÃƒÂ¶rsel ${imageIndex + 1} iÃƒÂ§in ${parsedData.videoSlides?.length || 0} sahne ÃƒÂ¼retildi.`, 'success');
            return parsedData;
        } catch (e) {
            if (e.message.includes('metne ulaÃ…Å¸Ã„Â±lamadÃ„Â±')) throw e;
            throw new Error(`JSON format hatasÃ„Â± (GÃƒÂ¶rsel ${imageIndex + 1}): ${e.message}`);
        }
    }

    
    static async _buildElestiriScript(inputData, inputType, config) {
        addSystemLog('EleÃ…Å¸tiri analizi baÃ…Å¸lÃ„Â±yor...', 'info');
        // NVIDIA gÃƒÂ¶rsel girdiyi desteklemez
        if (inputType === 'media' && Array.isArray(inputData)) {
            const descs = inputData.map(f => f.name || f.type).join(', ');
            inputData = `Medya aÃƒÂ§Ã„Â±klamasÃ„Â±: ${descs}. Bu iÃƒÂ§eriÃ„Å¸i analiz et.`;
            inputType = 'prompt';
        }

        // 1. Ã„Â°ÃƒÂ§eriÃ„Å¸i analiz et
        let parts = [];
        let contentText = '';

        if (inputType === 'prompt' || inputType === 'text' || inputType === 'media') {
            contentText = typeof inputData === 'string' ? inputData : '';
            parts = [{ text: `AÃ…Å¸aÃ„Å¸Ã„Â±daki iÃƒÂ§eriÃ„Å¸i analiz et:\n\n${contentText}` }];
        } else if (inputType === 'url') {
            parts = [{ text: `Bu URL'deki iÃƒÂ§eriÃ„Å¸i araÃ…Å¸tÃ„Â±r ve analiz et: ${inputData}` }];
        }

        // 2. TÃƒÂ¼rkiye gerÃƒÂ§ekleri ile karÃ…Å¸Ã„Â±laÃ…Å¸tÃ„Â±rmalÃ„Â± analiz
        const sysPrompt = `Sen bir TÃƒÂ¼rk medya eleÃ…Å¸tirmeni ve fact-checker'sÃ„Â±n. GÃƒÂ¶revin:

1. Verilen iÃƒÂ§eriÃ„Å¸i dikkatle analiz et
2. Ã„Â°ÃƒÂ§erideki iddialarÃ„Â±, savunulan gÃƒÂ¶rÃƒÂ¼Ã…Å¸leri tespit et
3. Her iddiayÃ„Â± TÃƒÂ¼rkiye'nin GÃƒÅ“NCEL GERÃƒâ€¡EKLERÃ„Â° ile karÃ…Å¸Ã„Â±laÃ…Å¸tÃ„Â±r

GÃƒÅ“NCEL VERÃ„Â° ZORUNLULUÃ„ÂU (2026):
- En gÃƒÂ¼ncel TÃƒÅ“Ã„Â°K verilerini kullan (MayÃ„Â±s-Haziran 2026)
- En gÃƒÂ¼ncel TCMB verilerini kullan (Haziran 2026)
- En gÃƒÂ¼ncel Hazine verilerini kullan
- Verilerin tarihini BELÃ„Â°RT (ÃƒÂ¶rn: "TÃƒÅ“Ã„Â°K Haziran 2026 verilerine gÃƒÂ¶re...")
- Eski veri kullanma, gÃƒÂ¼ncel olanÃ„Â± bul

KAYNAKLAR (her sahne sonunda link ekle):
- TÃƒÅ“Ã„Â°K: https://data.tuik.gov.tr
- TCMB: https://www.tcmb.gov.tr
- Hazine: https://www.hmb.gov.tr
- DÃ„Â°SK-AR: https://disk.org.tr/arastirma/
- IMF: https://www.imf.org
- DÃƒÂ¼nya BankasÃ„Â±: https://data.worldbank.org

ELE ALINACAK KONULAR:
- Ekonomi: Enflasyon (TÃƒÅ“FE/ÃƒÅ“FE), faiz, dÃƒÂ¶viz kuru (USD/TRY), dÃ„Â±Ã…Å¸ borÃƒÂ§, GSMH, iÃ…Å¸sizlik, asgari ÃƒÂ¼cret
- Sosyal: Yoksulluk oranÃ„Â±, gelir daÃ„Å¸Ã„Â±lÃ„Â±mÃ„Â± (Gini), aÃƒÂ§lÃ„Â±k/yoksulluk sÃ„Â±nÃ„Â±rÃ„Â±, ultra zengin vs fakir sayÃ„Â±sÃ„Â±
- EÃ„Å¸itim: PISA sonuÃƒÂ§larÃ„Â±, ÃƒÂ¶Ã„Å¸retmen maaÃ…Å¸larÃ„Â±
- SaÃ„Å¸lÃ„Â±k: OECD karÃ…Å¸Ã„Â±laÃ…Å¸tÃ„Â±rmalarÃ„Â±

Ãƒâ€¡IKTI FORMATI:
- Her sahne: Ã„Â°DDÃ„Â°A Ã¢â€ â€™ GERÃƒâ€¡EK Ã¢â€ â€™ KAYNAK (link ile)
- DoÃ„Å¸ruysa: Ãƒâ€“rneklerle destekle
- YanlÃ„Â±Ã…Å¸sa: Resmi verilerle ÃƒÂ§ÃƒÂ¼rÃƒÂ¼t + kaynak linki
- Tarih belirt (ÃƒÂ¶rn: "Haziran 2026")
- TarafsÃ„Â±z ve objektif ol

SON SAHNE (KAYNAKLAR LÃ„Â°STESÃ„Â°):
- TÃƒÂ¼m kaynaklarÃ„Â± listele (baÃ…Å¸lÃ„Â±k + URL + tarih)

KURALLAR:
- 'dezenformasyon' kelimesini kullanma
- 5N1K kuralÃ„Â±na uy
- Her sahne NOKTA ile biten cÃƒÂ¼mle olmalÃ„Â±
- Clickbait: sansasyonel ama doÃ„Å¸ru`

        const userPrompt = parts.map(p => p.text).join('\n');
        try {
            const parsedData = await callAI(sysPrompt, userPrompt, { json: true, temperature: 0.5, max_tokens: 4096 });
            if (typeof parsedData === 'string') throw new Error('JSON ayrÃ„Â±Ã…Å¸madÃ„Â±');
            if (parsedData.isContentUnreadable) throw new Error("Ã„Â°ÃƒÂ§erik okunamadÃ„Â±.");
            addSystemLog(`EleÃ…Å¸tiri analizi tamamlandÃ„Â±: ${parsedData.videoSlides?.length || 0} sahne.`, 'success');
            return parsedData;
        } catch (e) {
            if (e.message.includes('okunamadÃ„Â±')) throw e;
            throw new Error(`JSON format hatasÃ„Â±: ${e.message}`);
        }
    }


    
    static async _analyzeIddia(inputData, inputType, config) {
        addSystemLog('Ã„Â°ddia Analizi baÃ…Å¸lÃ„Â±yor (NVIDIA)...', 'info');
        // NVIDIA gÃƒÂ¶rsel girdiyi desteklemez
        if (inputType === 'media' && Array.isArray(inputData)) {
            var descs = inputData.map(function(f) { return f.name || f.type; }).join(', ');
            inputData = 'Medya aÃƒÂ§Ã„Â±klamasÃ„Â±: ' + descs + '. Ã„Â°ÃƒÂ§indeki doÃ„Å¸rulanabilir iddialarÃ„Â± ÃƒÂ§Ã„Â±kar.';
            inputType = 'prompt';
        }

        var parts = [];
        if (inputType === 'media') {
            parts = [{ text: 'AÃ…Å¸aÃ„Å¸Ã„Â±daki metindeki doÃ„Å¸rulanabilir iddialarÃ„Â± ÃƒÂ§Ã„Â±kar: ' + (typeof inputData === 'string' ? inputData : '') }];
        } else if (inputType === 'prompt' || inputType === 'text') {
            parts = [{ text: 'AÃ…Å¸aÃ„Å¸Ã„Â±daki metindeki doÃ„Å¸rulanabilir iddialarÃ„Â± ÃƒÂ§Ã„Â±kar: ' + (typeof inputData === 'string' ? inputData : '') }];
        } else if (inputType === 'url') {
            parts = [{ text: 'Bu URL icindeki icerigi arastir. Dogrulanabilir iddialari cikar: ' + inputData }];
        }

        var sysPrompt = 'Sen bir fact-check ve ekonomi analiz uzmanisin. ASAGIDAKI GUNCEL VERILERI MUTLAKA KULLAN (Haziran 2026):\n\nGUNCEL EKONOMI VERILERI (Haziran 2026):\n- Aclik Siniri: 35.759 TL (dort kisilik aile, TÃƒÅ“RK-Ã„Â°Ã…Â Haziran 2026)\n- Yoksulluk Siniri: 116.478 TL (dort kisilik aile, TÃƒÅ“RK-Ã„Â°Ã…Â Haziran 2026)\n- Asgari Ucret: 28.075 TL (net, Ocak 2026)\n- En Dusuk Emekli Maasi: 23.552 TL\n- TÃƒÅ“FE Yillik: %32.11 (Haziran 2026, TÃƒÅ“Ã„Â°K)\n- TÃƒÅ“FE Aylik: %0.99 (Haziran 2026, TÃƒÅ“Ã„Â°K)\n- TCMB Yil Sonu Beklenti: %29\n- TCMB Politika Faizi: %37\n- Dolar/TL: 47.05 (16 Temmuz 2026)\n- Euro/TL: 54.07 (16 Temmuz 2026)\n- Gram Altin: 6.222 TL (16 Temmuz 2026)\n- Ceyrek Altin: 10.223 TL (16 Temmuz 2026)\n- Issizlik: %8.2\n\nNOT: Bu veriler TÃƒÅ“RK-Ã„Â°Ã…Â ve TÃƒÅ“Ã„Â°K resmi verileridir. Video iceriginde MUTLAKA bu rakamlari net olarak goster. Rakamlar buyuk puntolarla yazilsin, arka plandaki goruntunun ustunde net gorunsun. Tarih belirt: Haziran 2026.\n\nKURALLAR:\n1. Rakamlar NET ve BUYUK yazilacak (arka planda net gorunecek)\n2. TL olarak yaz (dolar degil)\n3. Tarih belirt: Haziran 2026\n4. Kaynak belirt: TÃƒÅ“RK-Ã„Â°Ã…Â, TÃƒÅ“IK\n5. Grafik varsa goster\n6. Google Search ile guncel veri bulabilirsin\n\n Gorev:\n\n1. Icerikteki DOGRULANABILIR cumleleri cikar (yorum, hakaret, kisisel gorus HARIC).\n2. Her iddiayi ayri kart yap.\n3. Her iddiayi bagimsiz analiz et.\n4. Resmi kaynaklarla karsilastir.\n5. Degerlendirme etiketi ver: Dogru, Kisman Dogru, Eksik Baglam, Yanlis, Dogrulanamiyor.\n6. Guven skoru hesapla (0-100).\n7. Kanitlari listele (kaynak + URL + veri + TARIH).\n8. Video senaryosu olustur: Hook(5sn) -> Iddia -> Aciklama -> Kanitlar -> Sonuc -> Kapanis.\n9. Kalite kontrol yap.\n\nZORUNLU EKONOMI VERILERI (video iceriginde MUTLAKA yazilacak):\n- Enflasyon: Guncel TÃƒÅ“FE (yillik %), aylik %, TARIHI ile birlikte\n- TCMB Yil Sonu Enflasyon Beklentisi: % kac, gerceklesen: % kac\n- Politika Faizi: % kac\n- Acik Siniri: XXXXX TL (TARIHI: Haziran 2026 gibi, TÃƒÅ“RK-Ã„Â°Ã…Â)\n- Yoksulluk Siniri: XXXXX TL (TARIHI ile)\n- Acik Siniri altinda kac kisi: X milyon\n- Yoksulluk siniri altinda kac kisi: X milyon\n- Asgari Ucret: XXXXX TL (net)\n- En Dusuk Emekli Maasi: XXXXX TL\n- Ortalama Memur Maasi: XXXXX TL\n- Ortalama Isci Maasi: XXXXX TL\n- Dolar/TL: XX.XX TL\n- Euro/TL: XX.XX TL\n- Gram Altin: XXXXX TL\n- Ceyrek Altin: XXXXX TL\n- Issizlik Orani: % X.X\n- Buyume (GDP): % X.X\n- Gini Katsayisi: 0.XXX\n\nKURALLAR:\n1. Tum rakamlar NET TL olarak yazilacak (orn: 26.500 TL, $ degil)\n2. Tarih belirtilecek (orn: TÃƒÅ“Ã„Â°K Haziran 2026 verilerine gore...)\n3. Eski veri kullanma, en guncel veriyi bul (en fazla 1-2 ay onceki)\n4. Enflasyon icin hem gerceklesen hem beklenti yaz\n5. Aclik/yoksulluk siniri MUTLAKA TL olarak ve tarihle birlikte yaz\n6. Kac kisi acik/yoksulluk siniri altinda MUTLAKA yaz\n7. Sayi bicimi: 26.500 TL (nokta binlik ayrac)\n8. Grafik varsa goster (enflasyon trendi, dolar kuru degisimi vb)\n9. Kaynak belirt: TÃƒÅ“Ã„Â°K, TCMB, TÃƒÅ“RK-Ã„Â°Ã…Â, OECD\n\nHer sahne NOKTA ile biten cumle olmali. Donus ZORUNLU JSON.';

        var payload = {
            contents: [{ role: 'user', parts: parts }],
            systemInstruction: { parts: [{ text: sysPrompt }] },
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        isContentUnreadable: { type: 'BOOLEAN' },
                        videoSlides: { type: 'ARRAY', items: { type: 'OBJECT', properties: { topText: { type: 'STRING' }, spokenText: { type: 'STRING' }, imagePrompts: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['topText', 'spokenText', 'imagePrompts'] } },
                        thumbnailText: { type: 'STRING' },
                        sonSoz: { type: 'STRING' },
                        lastQuote: { type: 'STRING' },
                        thumbnailImagePrompt: { type: 'STRING' },
                        iddialar: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
                            iddia: { type: 'STRING' },
                            durum: { type: 'STRING' },
                            guvenSkoru: { type: 'NUMBER' },
                            analiz: { type: 'STRING' },
                            kanitlar: { type: 'ARRAY', items: { type: 'OBJECT', properties: { kaynak: { type: 'STRING' }, url: { type: 'STRING' }, veri: { type: 'STRING' } }, required: ['kaynak', 'veri'] } },
                            sonuc: { type: 'STRING' }
                        }, required: ['iddia', 'durum', 'guvenSkoru', 'analiz', 'kanitlar', 'sonuc'] } },
                        mediaBlackout: { type: 'OBJECT', properties: { show: { type: 'BOOLEAN' }, percentageCovered: { type: 'NUMBER' }, percentageIgnored: { type: 'NUMBER' }, mediaNames: { type: 'ARRAY', items: { type: 'STRING' } }, explanation: { type: 'STRING' } }, required: ['show', 'percentageCovered', 'percentageIgnored', 'mediaNames', 'explanation'] }
                    },
                    required: ['isContentUnreadable', 'videoSlides', 'thumbnailText', 'sonSoz', 'lastQuote', 'thumbnailImagePrompt', 'iddialar', 'mediaBlackout']
                }
            },
            tools: [{ google_search: {} }]
        };

        var userPrompt = parts.map(function(p) { return p.text; }).join('\n');
        try {
            var parsedData = await callAI(sysPrompt, userPrompt, { json: true, temperature: 0.3, max_tokens: 4096 });
            if (typeof parsedData === 'string') throw new Error('JSON ayrÃ„Â±Ã…Å¸madÃ„Â±');
            if (parsedData.isContentUnreadable) throw new Error('Icerik okunamadi.');
            addSystemLog('Iddia Analizi tamamlandi: ' + (parsedData.iddialar ? parsedData.iddialar.length : 0) + ' iddia.', 'success');
            return parsedData;
        } catch (e) {
            if (e.message.includes('okunamadi')) throw e;
            throw new Error('JSON format hatasi: ' + e.message);
        }
    }


    static getGuzelSozAnalysis(quoteText) {
        // Theme detection
        var themes = {
            'sabir': ['sabÃ„Â±r', 'bekle', 'zaman', 'dayan'],
            'azim': ['azim', 'ÃƒÂ§aba', 'gayret', 'mÃƒÂ¼cadele', 'vazgeÃƒÂ§me'],
            'baÃ…Å¸arÃ„Â±': ['baÃ…Å¸arÃ„Â±', 'kazan', 'hedef', 'zafer'],
            'hayat': ['hayat', 'yaÃ…Å¸am', 'ÃƒÂ¶mÃƒÂ¼r', 'nefes'],
            'mutluluk': ['mutluluk', 'sevinÃƒÂ§', 'neÃ…Å¸e', 'gÃƒÂ¼lÃƒÂ¼mse'],
            'sevgi': ['sevgi', 'aÃ…Å¸k', 'kalp', 'sev'],
            'anne': ['anne', 'annem', 'ana'],
            'baba': ['baba', 'babam'],
            'dostluk': ['dost', 'arkadaÃ…Å¸', 'kardeÃ…Å¸'],
            'inanÃƒÂ§': ['inanÃƒÂ§', 'iman', 'tanrÃ„Â±', 'allah'],
            'umut': ['umut', 'beklenti', 'gelecek'],
            'ÃƒÂ¶zgÃƒÂ¼rlÃƒÂ¼k': ['ÃƒÂ¶zgÃƒÂ¼rlÃƒÂ¼k', 'hÃƒÂ¼r', 'serbest'],
            'cesaret': ['cesaret', 'korkusuz', 'yiÃ„Å¸it'],
            'zaman': ['zaman', 'vakit', 'dakika', 'saat'],
            'bilgelik': ['bilgi', 'bilge', 'akÃ„Â±l', 'hikmet'],
            'yalnÃ„Â±zlÃ„Â±k': ['yalnÃ„Â±z', 'tek', 'kimsesiz'],
            'huzur': ['huzur', 'sÃƒÂ¼kunet', 'dingin'],
            'Ã…Å¸ÃƒÂ¼kÃƒÂ¼r': ['Ã…Å¸ÃƒÂ¼kÃƒÂ¼r', 'minnet', 'hamd'],
            'doÃ„Å¸a': ['doÃ„Å¸a', 'aÃ„Å¸aÃƒÂ§', 'deniz', 'gÃƒÂ¼neÃ…Å¸', 'yÃ„Â±ldÃ„Â±z']
        };
        
        var detectedTheme = 'hayat';
        var maxScore = 0;
        var textLower = quoteText.toLowerCase();
        
        Object.keys(themes).forEach(function(theme) {
            var score = 0;
            themes[theme].forEach(function(keyword) {
                if (textLower.indexOf(keyword) > -1) score++;
            });
            if (score > maxScore) {
                maxScore = score;
                detectedTheme = theme;
            }
        });
        
        // Emotion detection
        var emotions = {
            'hÃƒÂ¼zÃƒÂ¼n': ['hÃƒÂ¼zÃƒÂ¼n', 'acÃ„Â±', 'gÃƒÂ¶zyaÃ…Å¸Ã„Â±', 'aÃ„Å¸la', 'keder'],
            'umut': ['umut', 'bekle', 'gelecek', 'iyi'],
            'aÃ…Å¸k': ['aÃ…Å¸k', 'sevgi', 'kalp', 'sev'],
            'nefret': ['nefret', 'kin', 'ÃƒÂ¶fke'],
            'korku': ['korku', 'kork', 'tehlike'],
            'sevinÃƒÂ§': ['sevinÃƒÂ§', 'mutlu', 'gÃƒÂ¼l', 'neÃ…Å¸e'],
            'ÃƒÂ¶fke': ['ÃƒÂ¶fke', 'kÃ„Â±z', 'sinir'],
            'gurur': ['gurur', 'onur', 'Ã…Å¸eref'],
            'ÃƒÂ¶zlem': ['ÃƒÂ¶zlem', 'hasret', 'bekle']
        };
        
        var detectedEmotion = 'umut';
        maxScore = 0;
        Object.keys(emotions).forEach(function(emo) {
            var score = 0;
            emotions[emo].forEach(function(keyword) {
                if (textLower.indexOf(keyword) > -1) score++;
            });
            if (score > maxScore) {
                maxScore = score;
                detectedEmotion = emo;
            }
        });
        
        // Style detection based on theme
        var styleMap = {
            'sabir': 'minimal', 'azim': 'dark', 'baÃ…Å¸arÃ„Â±': 'luxury',
            'hayat': 'nature', 'mutluluk': 'warm', 'sevgi': 'romantic',
            'umut': 'light', 'cesaret': 'epik', 'bilgelik': 'vintage',
            'yalnÃ„Â±zlÃ„Â±k': 'film_noir', 'huzur': 'nature', 'doÃ„Å¸a': 'nature',
            'zaman': 'minimal', 'inanc': 'spiritual', 'dostluk': 'warm'
        };
        
        var detectedStyle = styleMap[detectedTheme] || 'cinematic';
        
        // Music selection
        var musicMap = {
            'sabir': 'soft piano', 'azim': 'motivational', 'baÃ…Å¸arÃ„Â±': 'cinematic orchestral',
            'hayat': 'contemplative piano', 'mutluluk': 'upbeat', 'sevgi': 'romantic piano',
            'anne': 'warm orchestral', 'baba': 'strong strings', 'umut': 'soft piano',
            'cesaret': 'epic cinematic', 'doÃ„Å¸a': 'nature sounds', 'bilgelik': 'meditation',
            'yalnÃ„Â±zlÃ„Â±k': 'melancholic piano', 'huzur': 'ambient', 'Ã…Å¸ÃƒÂ¼kÃƒÂ¼r': 'light strings',
            'zaman': 'minimal piano', 'inanc': 'spiritual ambient', 'dostluk': 'warm acoustic'
        };
        
        var suggestedMusic = musicMap[detectedTheme] || 'contemplative piano';
        
        // Color palette
        var paletteMap = {
            'sabir': { ana: '#2c3e50', ikincil: '#34495e', vurgu: '#3498db', yazi: '#ecf0f1', arka: '#1a252f' },
            'azim': { ana: '#1a1a2e', ikincil: '#16213e', vurgu: '#e94560', yazi: '#ffffff', arka: '#0f0f23' },
            'baÃ…Å¸arÃ„Â±': { ana: '#2d1b69', ikincil: '#11001c', vurgu: '#ffd700', yazi: '#ffffff', arka: '#0a0015' },
            'hayat': { ana: '#1b4332', ikincil: '#2d6a4f', vurgu: '#95d5b2', yazi: '#ffffff', arka: '#081c15' },
            'sevgi': { ana: '#4a0e0e', ikincil: '#6b1d1d', vurgu: '#ff6b6b', yazi: '#ffffff', arka: '#1a0505' },
            'umut': { ana: '#1a365d', ikincil: '#2a4a7f', vurgu: '#63b3ed', yazi: '#ffffff', arka: '#0f1f3d' },
            'hÃƒÂ¼zÃƒÂ¼n': { ana: '#2d3748', ikincil: '#4a5568', vurgu: '#a0aec0', yazi: '#e2e8f0', arka: '#1a202c' },
            'doÃ„Å¸a': { ana: '#22543d', ikincil: '#276749', vurgu: '#68d391', yazi: '#ffffff', arka: '#1a3a2a' },
        };
        
        var palette = paletteMap[detectedTheme] || { ana: '#1a1a2e', ikincil: '#16213e', vurgu: '#e94560', yazi: '#ffffff', arka: '#0f0f23' };
        
        return {
            tema: detectedTheme,
            duygu: detectedEmotion,
            stil: detectedStyle,
            muzik: suggestedMusic,
            palet: palette,
            enerji: detectedEmotion === 'cesaret' || detectedEmotion === 'ÃƒÂ¶fke' ? 80 : 40,
            pozitiflik: detectedEmotion === 'umut' || detectedEmotion === 'sevinÃƒÂ§' ? 80 : 50
        };
    }

    static getGuzelSozImagePrompts(quoteText, analysis) {
        var tema = analysis.tema || 'hayat';
        var stil = analysis.stil || 'cinematic';
        var duygu = analysis.duygu || 'umut';
        
        return [
            'Ultra realistic ' + stil + ' style, ' + tema + ' theme, 8K HDR, professional lighting, depth of field, film color grading, golden ratio composition, volumetric light, photorealistic masterpiece.',
            'Cinematic emotional shot, ' + duygu + ' feeling, ' + stil + ' aesthetic, dramatic lighting, 8K HDR, award winning photography, professional color grading, bokeh background.',
            'Symbolic powerful image, ' + tema + ' concept, ' + stil + ' style, epic composition, 8K HDR, volumetric light, cinematic depth, masterpiece quality.'
        ];
    }

static async _buildGuzelSozScript(inputData, inputType, config) {
        // Felsefi video formÃƒÂ¼lÃƒÂ¼: HOOK Ã¢â€ â€™ LEAD Ã¢â€ â€™ DÃƒÅ“Ã…ÂÃƒÅ“NÃƒÅ“R SÃƒâ€“ZLERÃ„Â° Ã¢â€ â€™ CTA Ã¢â€ â€™ HASHTAGS
        let topicText = "";

        // Metin ÃƒÂ§Ã„Â±karma Ã¢â‚¬â€ girdi tÃƒÂ¼rÃƒÂ¼ne gÃƒÂ¶re
        if (typeof inputData === 'string') {
            topicText = inputData.trim();
            addSystemLog(`Metin girdisi: ${topicText.length} karakter`, 'info');
        } else if (Array.isArray(inputData) && inputData.length > 0) {
            const videoFile = inputData.find(f => f.type?.startsWith('video/'));
            const imageFile = inputData.find(f => f.type?.startsWith('image/'));

            // OCR yardÃ„Â±mcÃ„Â± fonksiyonlarÃ„Â±
            const splitIntoStrips = (srcB64, stripCount) => new Promise((resolve) => {
                const img = new Image(); img.crossOrigin = "Anonymous";
                img.onload = () => {
                    const strips = []; const stripH = Math.ceil(img.height / stripCount);
                    for (let i = 0; i < stripCount; i++) {
                        const c = document.createElement('canvas'); c.width = img.width; c.height = stripH;
                        const cx = c.getContext('2d'); cx.fillStyle = 'white'; cx.fillRect(0, 0, c.width, c.height);
                        cx.drawImage(img, 0, i * stripH, img.width, stripH, 0, 0, img.width, stripH);
                        strips.push(c.toDataURL('image/jpeg', 0.95).split(',')[1]);
                    }
                    resolve(strips);
                };
                img.onerror = () => resolve([srcB64]);
                img.src = 'data:image/jpeg;base64,' + srcB64;
            });

            // NVIDIA ÃƒÂ¼cretsiz chat API'si gÃƒÂ¶rsel girdiyi desteklemez; OCR yapÃ„Â±lamaz.
            // Bu fonksiyon gÃƒÂ¶rsel tabanlÃ„Â± metin ÃƒÂ§Ã„Â±karamaz, boÃ…Å¸ dÃƒÂ¶ner (fallback devreye girer).
            const runOcr = async (b64Data) => {
                addSystemLog('GÃƒÂ¶rsel OCR NVIDIA ile desteklenmiyor; metin ÃƒÂ§Ã„Â±karÃ„Â±lmayacak.', 'warn');
                return "";
            };

            const _unusedOcrModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];

            if (videoFile) {
                addSystemLog('Video karesi ÃƒÂ§Ã„Â±karÃ„Â±lÃ„Â±yor...', 'info');
                const frameB64 = await new Promise((resolve) => {
                    const video = document.createElement('video'); video.muted = true; video.playsInline = true;
                    const raw = videoFile.data.includes(',') ? videoFile.data.split(',')[1] : videoFile.data;
                    const ab = new ArrayBuffer(atob(raw).length); const ia = new Uint8Array(ab);
                    for (let i = 0; i < ab.byteLength; i++) ia[i] = atob(raw).charCodeAt(i);
                    video.src = URL.createObjectURL(new Blob([ab], { type: videoFile.type || 'video/mp4' }));
                    video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration * 0.1); };
                    video.onseeked = () => {
                        try {
                            const c = document.createElement('canvas'); c.width = video.videoWidth || 640; c.height = video.videoHeight || 480;
                            c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
                            URL.revokeObjectURL(video.src); resolve(c.toDataURL('image/jpeg', 0.9).split(',')[1]);
                        } catch (e) { URL.revokeObjectURL(video.src); resolve(null); }
                    };
                    video.onerror = () => { URL.revokeObjectURL(video.src); resolve(null); };
                    setTimeout(() => { URL.revokeObjectURL(video.src); resolve(null); }, 10000);
                });
                if (frameB64) topicText = await runOcr(frameB64) || "";
                if (!topicText) topicText = videoFile.name?.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '') || "Ãƒâ€“zgÃƒÂ¼rlÃƒÂ¼k";
            } else if (imageFile) {
                addSystemLog('GÃƒÂ¶rsel OCR baÃ…Å¸lÃ„Â±yor...', 'info');
                const b64Data = imageFile.data.split(',')[1] || imageFile.data;
                topicText = await runOcr(b64Data) || "";
                if (!topicText) topicText = imageFile.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '') || "Adalet";
            } else {
                topicText = inputData[0].name?.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '') || "HayatÃ„Â±n anlamÃ„Â±";
            }
        }

        // OCR hata mesajlarÃ„Â±nÃ„Â± filtrele
        const errorPatterns = [/gÃƒÂ¶rselde\s+(herhangi\s+)?bir\s+metin\s+bulunmamaktadÃ„Â±r/i, /bu\s+gÃƒÂ¶rselde\s+metin\s+yok/i, /no\s+text\s+found/i, /gÃƒÂ¶rselde\s+yazÃ„Â±\s+bulunamadÃ„Â±/i, /metin\s+bulunamadÃ„Â±/i, /cannot\s+(read|find|detect)\s+text/i, /ocr\s+(failed|error|baÃ…Å¸arÃ„Â±sÃ„Â±z)/i];
        if (errorPatterns.some(p => p.test(topicText))) {
            if (inputType === 'media' && Array.isArray(inputData) && inputData[0]?.name) topicText = inputData[0].name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, '');
            else topicText = "HayatÃ„Â±n anlamÃ„Â±";
            addSystemLog('OCR hata mesajÃ„Â± filtrelendi, dosya adÃ„Â± kullanÃ„Â±ldÃ„Â±.', 'warn');
        }
        if (!topicText || topicText.length < 3) topicText = "HayatÃ„Â±n anlamÃ„Â±";
        addSystemLog(`Konu: "${topicText.substring(0, 80)}..."`, 'info');

        // Gemini'ya felsefi senaryo prompt'u gÃƒÂ¶nder
        const philosopherPrompt = `Sen felsefe, etik, siyaset bilimi, kitle psikolojisi ve kiÃ…Å¸isel geliÃ…Å¸im konularÃ„Â±nda uzman, dijital dÃƒÂ¼nyada (TikTok/Reels) geniÃ…Å¸ kitlelere hitap eden profesyonel bir iÃƒÂ§erik ÃƒÂ¼reticisisin.

Konu baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±: "${topicText}"

AÃ…Å¸aÃ„Å¸Ã„Â±daki yapÃ„Â±ya KESÃ„Â°NLÃ„Â°KLE sadÃ„Â±k kalarak bir video senaryosu ÃƒÂ¼ret:

1. VURUCU BAÃ…ÂLIK (hook): Ã„Â°lk 3 saniyede izleyicinin dikkatini ÃƒÂ§ekecek, kÃ„Â±Ã…Å¸kÃ„Â±rtÃ„Â±cÃ„Â±, merak uyandÃ„Â±rÃ„Â±cÃ„Â± ve sorgulayÃ„Â±cÃ„Â± bir baÃ…Å¸lÃ„Â±k. "Adalet GÃƒÂ¼ÃƒÂ§lÃƒÂ¼ler Ã„Â°ÃƒÂ§in Mi Ãƒâ€¡alÃ„Â±Ã…Å¸Ã„Â±yor?" veya "Bir DiktatÃƒÂ¶rÃƒÂ¼n 7 Ã„Â°Ã…Å¸areti" gibi.

2. GÃ„Â°RÃ„Â°Ã…Â (lead): Konunun ÃƒÂ¶zÃƒÂ¼nÃƒÂ¼, toplum veya birey ÃƒÂ¼zerindeki etkisini anlatan 1-2 cÃƒÂ¼mlelik gÃƒÂ¼ÃƒÂ§lÃƒÂ¼ bir giriÃ…Å¸.

3. DÃƒÅ“Ã…ÂÃƒÅ“NÃƒÅ“R SÃƒâ€“ZLERÃ„Â° (quotes): Konuyla doÃ„Å¸rudan iliÃ…Å¸kili, tarihe yÃƒÂ¶n vermiÃ…Å¸ en az 3, en fazla 4 farklÃ„Â± filozof/dÃƒÂ¼Ã…Å¸ÃƒÂ¼nÃƒÂ¼rÃƒÂ¼n (Locke, Tocqueville, Mill, Sokrates, Platon, Nietzsche, Epiktetos, Ã„Â°bn Haldun, Machiavelli, Hannah Arendt, vb.) ÃƒÂ§arpÃ„Â±cÃ„Â± sÃƒÂ¶zlerini listele. Her dÃƒÂ¼Ã…Å¸ÃƒÂ¼nÃƒÂ¼r iÃƒÂ§in:
   - name: DÃƒÂ¼Ã…Å¸ÃƒÂ¼nÃƒÂ¼rÃƒÂ¼n adÃ„Â±
   - quote: SÃƒÂ¶zÃƒÂ¼ (TÃƒÂ¼rkÃƒÂ§e, 1-2 cÃƒÂ¼mle)
   - emphasis: SÃƒÂ¶zÃƒÂ¼n taÃ…Å¸Ã„Â±dÃ„Â±Ã„Å¸Ã„Â± derin anlamÃ„Â± aÃƒÂ§Ã„Â±klayan kÃ„Â±sa vurgu (1 cÃƒÂ¼mle)

4. KAPANIÃ…Â (cta): Ã„Â°zleyiciyi yorum yapmaya davet eden derin, ucu aÃƒÂ§Ã„Â±k bir soru.

5. ETÃ„Â°KETLER: En az 8 hashtag ve 5 anahtar kelime (SEO uyumlu).

Dil ve ton: Ciddi, entelektÃƒÂ¼el, eleÃ…Å¸tirel, nesnel ama provokatif ve akÃ„Â±cÃ„Â±. SÃƒÂ¼slÃƒÂ¼ ve gereksiz uzun cÃƒÂ¼mlelerden kaÃƒÂ§Ã„Â±n; mesajÃ„Â± net ve vurucu ver. BÃƒÅ“TÃƒÅ“N METÃ„Â°N TÃƒÅ“RKÃƒâ€¡E OLMALI.

JSON formatÃ„Â±nda dÃƒÂ¶n.`;

        addSystemLog('NVIDIA felsefi senaryo ÃƒÂ¼retiliyor...', 'info');
        let hook = "", lead = "", quotes = [], cta = "", hashtags = [], keywords = [];
        try {
            const parsed = await callAI('Sen bir felsefe iÃƒÂ§erik uzmanÃ„Â±sÃ„Â±n. YanÃ„Â±tÃ„Â±nÃ„Â± geÃƒÂ§erli JSON olarak ver.', philosopherPrompt, { json: true, temperature: 0.85, max_tokens: 2048 });
            if (typeof parsed !== 'string') {
                hook = parsed.hook || "";
                lead = parsed.lead || "";
                quotes = parsed.quotes || [];
                cta = parsed.cta || "";
                hashtags = parsed.hashtags || [];
                keywords = parsed.keywords || [];
                addSystemLog(`Ã¢Å“â€œ Senaryo ÃƒÂ¼retildi: ${quotes.length} dÃƒÂ¼Ã…Å¸ÃƒÂ¼nÃƒÂ¼r, ${hashtags.length} etiket`, 'success');
            }
        } catch (e) { addSystemLog(`NVIDIA senaryo hatasÃ„Â±: ${e.message}`, 'warn'); }

        // Fallback Ã¢â‚¬â€ AI yanÃ„Â±t vermezse
        if (!hook) {
            hook = `${topicText} ÃƒÅ“zerine DÃƒÂ¼Ã…Å¸ÃƒÂ¼ndÃƒÂ¼rÃƒÂ¼cÃƒÂ¼ Bir Yolculuk`;
            lead = `Bu konu, yÃƒÂ¼zyÃ„Â±llardÃ„Â±r filozoflarÃ„Â±n kafasÃ„Â±nÃ„Â± kurcalayan temel bir soru. Peki bugÃƒÂ¼n ne kadar geÃƒÂ§erli?`;
            quotes = [
                { name: "Sokrates", quote: "SorgulanmamÃ„Â±Ã…Å¸ bir hayat, yaÃ…Å¸anmaya deÃ„Å¸mez.", emphasis: "Sorgulama cesareti olmadan gerÃƒÂ§ek bilgiye ulaÃ…Å¸Ã„Â±lamaz." },
                { name: "Platon", quote: "Adaletsiz bir dÃƒÂ¼zen, en bÃƒÂ¼yÃƒÂ¼k suÃƒÂ§tur.", emphasis: "GÃƒÂ¼ÃƒÂ§lÃƒÂ¼ olanÃ„Â±n adaleti tanÃ„Â±mlamasÃ„Â±, adaletsizliÃ„Å¸in kendisidir." },
                { name: "Nietzsche", quote: "Uzun sÃƒÂ¼re uÃƒÂ§uruma bakan, uÃƒÂ§urumun da ona bacaÃ„Å¸Ã„Â±nÃ„Â± unutmamalÃ„Â±.", emphasis: "KÃƒÂ¶tÃƒÂ¼lÃƒÂ¼Ã„Å¸ÃƒÂ¼ incelerken, onun bir parÃƒÂ§asÃ„Â± olma tehlikesi her zaman vardÃ„Â±r." }
            ];
            cta = `Sizce bu konu gÃƒÂ¼nÃƒÂ¼mÃƒÂ¼z dÃƒÂ¼nyasÃ„Â±nda ne kadar geÃƒÂ§erli? GÃƒÂ¶rÃƒÂ¼Ã…Å¸lerinizi yorumlarda paylaÃ…Å¸Ã„Â±n.`;
            hashtags = ['#felsefe', '#dÃƒÂ¼Ã…Å¸ÃƒÂ¼nÃƒÂ¼rler', '#sokrates', '#platon', '#nietzsche', '#adalet', '#ÃƒÂ¶zgÃƒÂ¼rlÃƒÂ¼k', '#dÃƒÂ¼Ã…Å¸ÃƒÂ¼ndÃƒÂ¼rÃƒÂ¼cÃƒÂ¼', '#entelijansiya', '#tiktokfelsefe'];
            keywords = ['felsefe', 'dÃƒÂ¼Ã…Å¸ÃƒÂ¼nÃƒÂ¼rler', 'adalet', 'ÃƒÂ¶zgÃƒÂ¼rlÃƒÂ¼k', 'toplum'];
            addSystemLog('Fallback senaryo kullanÃ„Â±ldÃ„Â±.', 'warn');
        }

        // GÃƒÂ¶rsel promptlarÃ„Â± ÃƒÂ¼ret Ã¢â‚¬â€ her sahne iÃƒÂ§in
        const imagePromptBase = [
            `A dramatic cinematic scene representing: ${hook}. Dark moody lighting, thought-provoking atmosphere, symbolic composition.`,
            `An intellectual scene with books, ancient columns, and soft golden light representing wisdom and knowledge.`,
            ...quotes.map((q, i) => `A portrait-style cinematic scene of ${q.name} era, ${q.name}'s philosophy represented visually. Dark background, dramatic lighting, symbolic elements.`),
            `A powerful closing scene: a single figure looking at the horizon, contemplative mood, golden hour light, representing the question of human nature.`
        ];

        const videoSlides = [];
        // Slide 0: HOOK Ã¢â‚¬â€ KÃ„Â±Ã…Å¸kÃ„Â±rtÃ„Â±cÃ„Â± baÃ…Å¸lÃ„Â±k
        videoSlides.push({ _slideType: 'HOOK', topText: hook, spokenText: hook, imagePrompts: [imagePromptBase[0]] });
        // Slide 1: LEAD Ã¢â‚¬â€ KÃ„Â±sa giriÃ…Å¸
        videoSlides.push({ _slideType: 'LEAD', topText: '', spokenText: lead, imagePrompts: [imagePromptBase[1]] });
        // Slide 2-N: DÃƒÅ“Ã…ÂÃƒÅ“NÃƒÅ“R SÃƒâ€“ZLERÃ„Â°
        quotes.forEach((q, i) => {
            videoSlides.push({ _slideType: 'QUOTE', topText: q.name, spokenText: `${q.name} Ã…Å¸ÃƒÂ¶yle demiÃ…Å¸: ${q.quote} ${q.emphasis || ''}`, imagePrompts: [imagePromptBase[i + 2] || imagePromptBase[1]], _emphasis: q.emphasis || '', _quoteText: q.quote });
        });
        // Slide N+1: CTA Ã¢â‚¬â€ EtkileÃ…Å¸im ÃƒÂ§aÃ„Å¸rÃ„Â±sÃ„Â±
        const hashtagStr = hashtags.slice(0, 10).map(h => h.startsWith('#') ? h : '#' + h).join(' ');
        videoSlides.push({ _slideType: 'CTA', topText: '', spokenText: cta, imagePrompts: [imagePromptBase[imagePromptBase.length - 1]], _hashtags: hashtagStr });

        // AtatÃƒÂ¼rk tespiti
        const ataturkKeywords = ['atatÃƒÂ¼rk', 'mustafa kemal', 'samsun', 'kurtuluÃ…Å¸', 'cumhuriyet', 'baÃ„Å¸Ã„Â±msÃ„Â±zlÃ„Â±k', 'milli mÃƒÂ¼cadele'];
        const fullText = (hook + ' ' + lead + ' ' + quotes.map(q => q.quote).join(' ')).toLowerCase();
        const isAtaturkRelated = ataturkKeywords.some(kw => fullText.includes(kw));

        return {
            isContentUnreadable: false,
            videoSlides,
            thumbnailText: hook.length > 100 ? hook.substring(0, 100) + '...' : hook,
            sonSoz: "",
            lastQuote: cta,
            thumbnailImagePrompt: imagePromptBase[0],
            tiktokTitle: hook.substring(0, 60),
            tiktokDescription: lead,
            tiktokHashtags: hashtags.slice(0, 10).map(h => h.startsWith('#') ? h : '#' + h),
            _suggestedMusic: isAtaturkRelated ? (LOCAL_MUSIC_LIBRARY.find(m => /ataturk|istiklal|istiklal mars|vatan|cumhuriyet/i.test(m.title))?.id || (LOCAL_MUSIC_LIBRARY[0] && LOCAL_MUSIC_LIBRARY[0].id) || null) : null,
            _isAtaturkRelated: isAtaturkRelated,
            _realImageUrls: [],
            mediaBlackout: { show: false, percentageCovered: 0, percentageIgnored: 0, mediaNames: [], explanation: "" },
            chartData: { show: false, type: "bar", title: "", note: "", items: [] },
            _isGuzelSoz: true,
            _emotion: 'notr',
            _sceneCount: videoSlides.length,
            _hook: hook,
            _lead: lead,
            _quotes: quotes,
            _cta: cta,
            _hashtags: hashtags,
            _keywords: keywords
        };
    }
}

class MediaSynthesisService {
    static generateProceduralFallback(prompt, imageStyle) {
        const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024; const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 600); grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(0.5, '#0f172a'); grad.addColorStop(1, '#020617'); ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 1024);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)'; ctx.lineWidth = 1;
        for (let x = 0; x < 1024; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke(); }
        for (let y = 0; y < 1024; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.font = "bold 24px 'Inter', Arial"; ctx.textAlign = 'center'; ctx.fillText("OTONOM", 512, 950);
        return canvas.toDataURL('image/jpeg', 0.85);
    }

    static generateQuoteFallback(quoteText, emotion) {
        const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024; const ctx = canvas.getContext('2d');
        const colorMap = {
            'mutlu': { bg1: '#fbbf24', bg2: '#f59e0b', accent: '#fcd34d', glow: '#fef3c7' },
            'hÃƒÂ¼zÃƒÂ¼nlÃƒÂ¼': { bg1: '#3b82f6', bg2: '#1d4ed8', accent: '#93c5fd', glow: '#dbeafe' },
            'romantik': { bg1: '#ec4899', bg2: '#be185d', accent: '#f9a8d4', glow: '#fce7f3' },
            'notr': { bg1: '#6366f1', bg2: '#4338ca', accent: '#a5b4fc', glow: '#e0e7ff' }
        };
        const colors = colorMap[emotion] || colorMap['notr'];
        const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
        grad.addColorStop(0, colors.bg1); grad.addColorStop(0.5, colors.bg2); grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 1024);
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 1024; const y = Math.random() * 1024; const r = 50 + Math.random() * 150;
            const circleGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
            circleGrad.addColorStop(0, colors.accent + '40'); circleGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = circleGrad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
        const words = quoteText.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
        ctx.fillStyle = colors.glow + '30'; ctx.font = "bold 80px Georgia, serif"; ctx.textAlign = 'center';
        words.forEach((word, i) => {
            const x = 150 + (i % 3) * 250; const y = 300 + Math.floor(i / 3) * 200;
            ctx.save(); ctx.translate(x, y); ctx.rotate((Math.random() - 0.5) * 0.3);
            ctx.fillText(word.substring(0, 8), 0, 0); ctx.restore();
        });
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = "bold 120px Georgia, serif"; ctx.textAlign = 'center';
        ctx.fillText('"', 150, 250); ctx.fillText('"', 900, 850);
        return canvas.toDataURL('image/jpeg', 0.9);
    }

    static async generateImage(prompt, imageStyle = 'cinematic', resolution = '4K', isGuzelSoz = false, emotion = 'notr', quoteText = '') {
        let resText = "8k resolution, highly detailed";
        if (resolution === '1K') resText = "1080p resolution, clear and sharp";
        if (resolution === '2K') resText = "4k resolution, high quality";
        const stylePrefixes = {
            'watercolor': `Abstract watercolor painting style, soft and artistic, ${resText}`,
            'sketch': `Pencil sketch drawing, black and white, ${resText}`,
            'oil_painting': `Classic oil painting style, ${resText}`,
            'minimalist': `Minimalist illustration, clean lines, ${resText}`,
            'cyberpunk': `Cyberpunk, futuristic, neon lights, ${resText}`,
            'retro': `Retro vintage style, 80s aesthetic, ${resText}`,
            '3d_render': `High quality 3D render, unreal engine 5 style, ${resText}`,
            'anime': `High quality anime style, Studio Ghibli inspired, ${resText}`
        };
        let stylePrefix = stylePrefixes[imageStyle] || `Cinematic, photorealistic, ${resText}`;
        const excludeStyles = ['watercolor', 'sketch', 'oil_painting', 'retro', 'anime'];
        if (!excludeStyles.includes(imageStyle)) stylePrefix += `, subtle AI neural network elements, neon accents`;

        const contextLabel = isGuzelSoz ? 'quote illustration' : 'news context';
        const fullPrompt = `${stylePrefix}, ${contextLabel}: ${prompt}. Safe, no text, no violence.`;
        addSystemLog(`GÃƒÂ¶rsel aranÃ„Â±yor: "${prompt.substring(0, 40)}..."`, 'info');
        // 1. Wikimedia Commons'tan gerÃƒÂ§ek gÃƒÂ¶rsel ÃƒÂ§ek (ÃƒÂ¼cretsiz, telifsiz)
        try {
            const images = await fetchWikimediaImages(prompt, 3);
            if (images && images.length > 0) {
                addSystemLog(`Wikimedia'dan ${images.length} gÃƒÂ¶rsel bulundu.`, 'success');
                return images[0];
            }
        } catch (err) { addSystemLog('Wikimedia gÃƒÂ¶rsel aramasÃ„Â± baÃ…Å¸arÃ„Â±sÃ„Â±z: ' + err.message, 'warn'); }
        // 2. Gemini ÃƒÂ¼cretsiz model ile gÃƒÂ¶rsel ÃƒÂ¼ret (ayrÃ„Â± Gemini key varsa)
        try {
            const key = getGeminiKey();
            if (key) {
                for (const model of GEMINI_FALLBACK_MODELS) {
                    try {
                        const r = await fetch(GEMINI_CHAT_URL(model) + `?key=${key}`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } })
                        });
                        if (r.ok) {
                            const d = await r.json();
                            const base64 = d.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
                            if (base64) { addSystemLog(`Gemini (${model}) ile gÃƒÂ¶rsel ÃƒÂ¼retildi.`, 'success'); return `data:image/jpeg;base64,${base64}`; }
                        }
                    } catch (e) {}
                }
            }
        } catch (err) { addSystemLog('Gemini gÃƒÂ¶rsel ÃƒÂ¼retimi baÃ…Å¸arÃ„Â±sÃ„Â±z: ' + err.message, 'warn'); }
        // 3. Procedural fallback
        if (isGuzelSoz && quoteText) {
            addSystemLog('Quote uyumlu fallback gÃƒÂ¶rsel ÃƒÂ¼retiliyor...', 'warn');
            return this.generateQuoteFallback(quoteText, emotion);
        }
        return this.generateProceduralFallback(prompt, imageStyle);
    }

    static async generateAudio(text, voice) {
        if (!text || voice === 'none') return null;
        // Metni temizle Ã¢â‚¬â€ TÃƒÂ¼rkÃƒÂ§e karakterler korunur, sadece sorunlu iÃ…Å¸aretler kaldÃ„Â±rÃ„Â±lÃ„Â±r
        let cleanText = text.replace(/[*_#"']/g, '').replace(/\.\.\./g, ', ').replace(/\n/g, ' ').replace(/[:;/\\|{}[\]<>^~`]/g, ', ').replace(/\s+/g, ' ').trim();
        if (cleanText.length < 2) return null;
        const estDuration = Math.max(2.0, (cleanText.split(/\s+/).length / 2.5));

        // 1. Gemini ÃƒÂ¼cretsiz TTS (ayrÃ„Â± Gemini key varsa) Ã¢â‚¬â€ gerÃƒÂ§ek WAV ses dÃƒÂ¶ndÃƒÂ¼rÃƒÂ¼r
        const key = getGeminiKey();
        if (key) {
            try {
                const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`;
                const gPayload = { contents: [{ parts: [{ text: cleanText }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || 'Charon' } } } } };
                const gr = await fetch(gUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gPayload) });
                if (gr.ok) {
                    const gd = await gr.json();
                    const b64 = gd.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    if (b64) {
                        let sampleRate = 24000;
                        const bin = atob(b64); const pcm = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);
                        const wav = new ArrayBuffer(44 + pcm.length); const v = new DataView(wav);
                        const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
                        ws(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, pcm.length, true);
                        new Uint8Array(wav, 44).set(pcm);
                        addSystemLog(`Seslendirme Gemini TTS ile ÃƒÂ¼retildi.`, 'success');
                        return { wavBuffer: wav, sampleRate };
                    }
                }
            } catch (e) { addSystemLog('Gemini TTS baÃ…Å¸arÃ„Â±sÃ„Â±z, Web Speech\'e dÃƒÂ¼Ã…Å¸ÃƒÂ¼lÃƒÂ¼yor: ' + e.message, 'warn'); }
        }

        // 2. Fallback: Web Speech API (tarayÃ„Â±cÃ„Â±da ÃƒÂ§alÃ„Â±nÃ„Â±r, WAV yok)
        addSystemLog(`Seslendirme Web Speech API ile yapÃ„Â±lacak (${estDuration.toFixed(1)}sn tahmini): "${cleanText.substring(0, 40)}..."`, 'info');
        return {
            wavBuffer: null,
            sampleRate: 24000,
            speechText: cleanText,
            useWebSpeech: true,
            estDuration
        };
    }

    // Web Speech API ile metni seslendirip bitiÃ…Å¸ callback'i ÃƒÂ§aÃ„Å¸Ã„Â±rÃ„Â±r
    static speakWithWebSpeech(text, voice, onEnd) {
        return new Promise((resolve) => {
            try {
                if (typeof window === 'undefined' || !window.speechSynthesis) {
                    addSystemLog('TarayÃ„Â±cÃ„Â± seslendirme desteklemiyor.', 'warn');
                    if (onEnd) onEnd();
                    return resolve(null);
                }
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'tr-TR';
                const voices = window.speechSynthesis.getVoices();
                const trVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('tr'));
                if (trVoice) u.voice = trVoice;
                u.rate = 1.0; u.pitch = 1.0;
                u.onend = () => { if (onEnd) onEnd(); resolve(true); };
                u.onerror = () => { if (onEnd) onEnd(); resolve(null); };
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(u);
            } catch (e) {
                addSystemLog('Web Speech hatasÃ„Â±: ' + e.message, 'warn');
                if (onEnd) onEnd();
                resolve(null);
            }
        });
    }
}

class AmbientAudioService {
    static createNoiseBuffer(audioCtx, type = 'white') {
        const bufferSize = audioCtx.sampleRate * 5; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate); const data = buffer.getChannelData(0); let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; if (type === 'brown') { data[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = data[i]; data[i] *= 3.5; } else { data[i] = white * 0.5; } }
        return buffer;
    }
    static getAmbientNode(audioCtx, type) {
        const noiseBuffer = this.createNoiseBuffer(audioCtx, type === 'fire' ? 'brown' : 'white');
        const noiseSource = audioCtx.createBufferSource(); noiseSource.buffer = noiseBuffer; noiseSource.loop = true;
        const filter = audioCtx.createBiquadFilter(); const gain = audioCtx.createGain();
        if (type === 'rain') { filter.type = 'lowpass'; filter.frequency.value = 800; gain.gain.value = 0.3; noiseSource.connect(filter).connect(gain); }
        else if (type === 'waves') { filter.type = 'lowpass'; filter.frequency.value = 400; const lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.1; const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 1.5; gain.gain.value = 0.3; lfo.connect(lfoGain).connect(gain.gain); lfo.start(); noiseSource.connect(filter).connect(gain); }
        else return null;
        noiseSource.start(0); return { source: noiseSource, gainNode: gain };
    }
}

// TÃƒÂ¼rkÃƒÂ§e bÃƒÂ¼yÃƒÂ¼k harf dÃƒÂ¶nÃƒÂ¼Ã…Å¸ÃƒÂ¼mÃƒÂ¼ Ã¢â‚¬â€ Ã„Â±Ã¢â€ â€™I, iÃ¢â€ â€™Ã„Â°
const trUpper = (str) => str.replace(/Ã„Â±/g, 'I').replace(/i/g, 'Ã„Â°').toUpperCase();

const RenderWorkerService = {
    // Instagram Reels / TikTok gÃƒÂ¼venli alan sÃ„Â±nÃ„Â±rlarÃ„Â± (canvas %)
    SAFE_ZONE: { topUnsafe: 0.08, subtitleY: 0.72, bottomUnsafe: 0.78, rightUnsafeStart: 0.86 },
    wrapText: (ctx, text, maxWidth) => { if (!text) return []; const words = text.split(" "); const lines = []; let currentLine = words[0]; for (let i = 1; i < words.length; i++) { if (ctx.measureText(currentLine + " " + words[i]).width < maxWidth) currentLine += " " + words[i]; else { lines.push(currentLine); currentLine = words[i]; } } lines.push(currentLine); return lines; },
    // Kelime bazlÃ„Â± zamanlama Ã¢â‚¬â€ her kelime iÃƒÂ§in start/end
    calculateWordTimings: (text, audioDuration) => {
        if (!text || !audioDuration) return [];
        const words = text.replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
        if (words.length === 0) return [];
        const totalChars = words.reduce((sum, w) => sum + w.length, 0);
        const safeDur = Math.max(audioDuration, 0.1);
        const timePerChar = safeDur / Math.max(totalChars, 1);
        const timings = [];
        let currentTime = 0;
        for (const word of words) {
            const wordDur = word.length * timePerChar;
            timings.push({ word, start: currentTime, end: currentTime + wordDur });
            currentTime += wordDur;
        }
        return timings;
    },
    // AltyazÃ„Â±: kelime bazlÃ„Â± zamanlamadan 2'li gruplar oluÃ…Å¸tur
    calculateSubtitles: (text, exactAudioDur) => {
        const wordTimings = RenderWorkerService.calculateWordTimings(text, exactAudioDur);
        if (wordTimings.length === 0) return [];
        const subs = [];
        for (let i = 0; i < wordTimings.length; i += 2) {
            const w1 = wordTimings[i];
            const w2 = wordTimings[i + 1];
            subs.push({
                text: w2 ? (w1.word + ' ' + w2.word) : w1.word,
                startSec: w1.start,
                endSec: w2 ? w2.end : w1.end
            });
        }
        return subs;
    },
    // AltyazÃ„Â±: wordTimings array'inden doÃ„Å¸rudan oluÃ…Å¸tur (scale edilmemiÃ…Å¸ gerÃƒÂ§ek ses zamanlamasÃ„Â±)
    _subsFromWordTimings: (wordTimings) => {
        if (!wordTimings || wordTimings.length === 0) return [];
        const subs = [];
        for (let i = 0; i < wordTimings.length; i += 2) {
            const w1 = wordTimings[i];
            const w2 = wordTimings[i + 1];
            subs.push({
                text: w2 ? (w1.word + ' ' + w2.word) : w1.word,
                startSec: w1.start,
                endSec: w2 ? w2.end : w1.end
            });
        }
        return subs;
    },
    // Sessizlik tespiti ve kÃ„Â±rpma
    trimSilence: (audioBuffer, threshold = 0.01) => {
        if (!audioBuffer || !audioBuffer.getChannelData) return audioBuffer;
        const data = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        // BaÃ…Å¸taki sessizliÃ„Å¸i bul
        let firstSound = 0;
        for (let i = 0; i < data.length; i++) {
            if (Math.abs(data[i]) > threshold) { firstSound = i; break; }
        }
        // Sondaki sessizliÃ„Å¸i bul
        let lastSound = data.length - 1;
        for (let i = data.length - 1; i >= 0; i--) {
            if (Math.abs(data[i]) > threshold) { lastSound = i; break; }
        }
        // 50ms tolerans ekle (fade iÃƒÂ§in)
        const toleranceSamples = Math.round(sampleRate * 0.05);
        firstSound = Math.max(0, firstSound - toleranceSamples);
        lastSound = Math.min(data.length - 1, lastSound + toleranceSamples);
        // KÃ„Â±rpÃ„Â±lmÃ„Â±Ã…Å¸ uzunluk Ã¢â‚¬â€ en az %50'sini koru
        const newLength = lastSound - firstSound + 1;
        if (newLength < data.length * 0.5 || newLength <= 0) return audioBuffer;
        const ctx = new OfflineAudioContext(audioBuffer.numberOfChannels, newLength, sampleRate);
        const newBuffer = ctx.createBuffer(audioBuffer.numberOfChannels, newLength, sampleRate);
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const src = audioBuffer.getChannelData(ch);
            const dst = newBuffer.getChannelData(ch);
            for (let i = 0; i < newLength; i++) dst[i] = src[firstSound + i];
        }
        return newBuffer;
    },
    drawImageContain: (ctx, img, w, h) => { const imgRatio = img.width / img.height; const canvasRatio = w / h; let drawW = w, drawH = h, offsetX = 0, offsetY = 0; if (imgRatio > canvasRatio) { drawH = w / imgRatio; offsetY = (h - drawH) / 2; } else { drawW = h * imgRatio; offsetX = (w - drawW) / 2; } ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, offsetX, offsetY, drawW, drawH); },
    drawImageCover: (ctx, img, w, h) => { const imgRatio = img.width / img.height; const canvasRatio = w / h; let drawW = w, drawH = h, offsetX = 0, offsetY = 0; if (imgRatio > canvasRatio) { drawW = h * imgRatio; offsetX = (w - drawW) / 2; } else { drawH = w / imgRatio; offsetY = (h - drawH) / 2; } ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, offsetX, offsetY, drawW, drawH); },
    drawThumbnail: (ctx, img, text, w, h, fontFamily, sourceName, config) => {
        // 1. Siyah arka plan + gÃƒÂ¶rsel
        ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h);
        if (img) RenderWorkerService.drawImageContain(ctx, img, w, h);

        // 2. Gradient overlay
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "rgba(0,0,0,0.92)");
        grad.addColorStop(0.12, "rgba(0,0,0,0.20)");
        grad.addColorStop(0.80, "rgba(0,0,0,0.20)");
        grad.addColorStop(1, "rgba(0,0,0,0.92)");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

        // 3. Tarih
        const now = new Date();
        const dateLocale = ({ tr:'tr-TR', en:'en-US', fr:'fr-FR', de:'de-DE', es:'es-ES', ar:'ar-SA', ru:'ru-RU' })[config?.language || 'tr'] || 'tr-TR';
        const dateStr = now.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
        const dayStr = now.toLocaleDateString(dateLocale, { weekday: 'long' });
        const dateLine = trUpper(dateStr + " " + dayStr);

        const cx = w / 2;

        // 4. ÃƒÅ“ST SÃ„Â°YAH BAR Ã¢â‚¬â€ Anadolu AjansÃ„Â± formatÃ„Â±
        const barH = Math.round(h * 0.125);
        let sourceFontSize = Math.round(h * 0.022) + 4; // 2 punto daha bÃƒÂ¼yÃƒÂ¼tÃƒÂ¼ldÃƒÂ¼
        let dateFontSize = Math.round(h * 0.018) + 4;   // 2 punto daha bÃƒÂ¼yÃƒÂ¼tÃƒÂ¼ldÃƒÂ¼
        const spacing = 3; // Kaynak adÃ„Â± ve tarih arasÃ„Â± 3 punto boÃ…Å¸luk
        // TaÃ…Å¸ma kontrolÃƒÂ¼ Ã¢â‚¬â€ bar yÃƒÂ¼ksekliÃ„Å¸ine sÃ„Â±Ã„Å¸dÃ„Â±r
        const totalTextH = sourceFontSize + 14 + spacing + dateFontSize;
        if (totalTextH > barH * 0.9) {
            const scale = (barH * 0.9) / totalTextH;
            sourceFontSize = Math.floor(sourceFontSize * scale);
            dateFontSize = Math.floor(dateFontSize * scale);
        }

        // Siyah bar (tam geniÃ…Å¸lik)
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, barH);

        // KÃ„Â±rmÃ„Â±zÃ„Â± kutu Ã¢â‚¬â€ sadece yazÃ„Â± kadar geniÃ…Å¸lik
        if (sourceName) {
            ctx.font = `900 ${sourceFontSize}px ${fontFamily}`;
            const textW = ctx.measureText(trUpper(sourceName)).width;
            const redBoxW = textW + 24; // Padding: sadece yazÃ„Â± kadar + minimal padding
            const redBoxH = sourceFontSize + 14;
            const redBoxX = cx - redBoxW / 2;
            const redBoxY = Math.round(barH * 0.38);
            const radius = redBoxH / 2;

            ctx.fillStyle = "#E30A17";
            ctx.beginPath();
            ctx.moveTo(redBoxX + radius, redBoxY);
            ctx.lineTo(redBoxX + redBoxW - radius, redBoxY);
            ctx.arc(redBoxX + redBoxW - radius, redBoxY + radius, radius, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(redBoxX + radius, redBoxY + redBoxH);
            ctx.arc(redBoxX + radius, redBoxY + radius, radius, Math.PI / 2, -Math.PI / 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#FFFFFF";
            ctx.font = `900 ${sourceFontSize}px ${fontFamily}`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(trUpper(sourceName), cx, redBoxY + redBoxH / 2);
        }

        // Tarih Ã¢â‚¬â€ kÃ„Â±rmÃ„Â±zÃ„Â± kutunun altÃ„Â±nda, 3 punto boÃ…Å¸luk
        const dateY = sourceName ? (Math.round(barH * 0.38) + sourceFontSize + 14 + spacing + dateFontSize / 2) : barH * 0.78;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `900 ${dateFontSize}px ${fontFamily}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(dateLine, cx, dateY);

        // 5. ANA BAÃ…ÂLIK Ã¢â‚¬â€ gÃƒÂ¶rselin ortasÃ„Â±nda
        const titleAreaTop = barH + h * 0.02;
        const titleAreaBottom = h * RenderWorkerService.SAFE_ZONE.bottomUnsafe;
        const titleAreaH = titleAreaBottom - titleAreaTop;

        let thumbFontSize = w > 800 ? 110 : 80;
        ctx.font = `900 ${thumbFontSize}px ${fontFamily}`;
        let lines = RenderWorkerService.wrapText(ctx, trUpper(text || "Ã…ÂOK HABER!"), w * 0.88);
        let lh = thumbFontSize * 1.12;

        while (lines.length * lh > titleAreaH && thumbFontSize > 28) {
            thumbFontSize -= 4;
            ctx.font = `900 ${thumbFontSize}px ${fontFamily}`;
            lines = RenderWorkerService.wrapText(ctx, trUpper(text || "Ã…ÂOK HABER!"), w * 0.90);
            lh = thumbFontSize * 1.12;
        }

        if (lines.length * lh > titleAreaH) lh = titleAreaH / lines.length;

        const totalTitleH = lines.length * lh;
        const titleStartY = titleAreaTop + (titleAreaH - totalTitleH) / 2;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,1)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";

        lines.forEach((l, i) => {
            const y = titleStartY + (i * lh) + (lh / 2);
            ctx.lineWidth = Math.max(4, thumbFontSize * 0.22);
            ctx.strokeStyle = "#000000";
            ctx.lineJoin = "round";
            ctx.strokeText(l, cx, y);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(l, cx, y);
        });

        ctx.restore();
    },
    drawStar: (ctx, cx, cy, spikes, outerRadius, innerRadius, color = "#FFFFFF") => { let rot = (Math.PI / 2) * 3; let step = Math.PI / spikes; ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius); for (let i = 0; i < spikes; i++) { let x = cx + Math.cos(rot) * outerRadius; let y = cy + Math.sin(rot) * outerRadius; ctx.lineTo(x, y); rot += step; x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius; ctx.lineTo(x, y); rot += step; } ctx.lineTo(cx, cy - outerRadius); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); },
    renderGuzelSoz: async (jobData, canvasElement, w, h, cx, fontFamily) => {
        // Felsefi video render: HOOK Ã¢â€ â€™ LEAD Ã¢â€ â€™ QUOTE(s) Ã¢â€ â€™ CTA
        addSystemLog('Felsefi video render baÃ…Å¸lÃ„Â±yor...', 'info');
        const slides = jobData.script.videoSlides || [];
        const FPS = 30;

        canvasElement.width = w; canvasElement.height = h;
        const ctx = canvasElement.getContext('2d');
        addSystemLog(`Canvas: ${w}x${h}, ${slides.length} sahne`, 'info');

        // Ses setup
        const audioCtx = _getAudioCtx();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        const audioDest = audioCtx ? audioCtx.createMediaStreamDestination() : null;
        const silentOsc = audioCtx.createOscillator(); const silentGain = audioCtx.createGain(); silentGain.gain.value = 0.001; silentOsc.connect(silentGain); silentGain.connect(audioDest); silentOsc.start();

        // Her slaytÃ„Â±n ses sÃƒÂ¼resini hesapla
        const getAudioDur = (audioData, text) => {
            if (audioData?.wavBuffer) {
                let byteLength = 0;
                if (audioData.wavBuffer instanceof ArrayBuffer) byteLength = audioData.wavBuffer.byteLength;
                else if (audioData.wavBuffer.buffer instanceof ArrayBuffer) byteLength = audioData.wavBuffer.buffer.byteLength;
                if (byteLength > 44) return (byteLength - 44) / (24000 * 2);
            }
            const wc = (text || "").trim().split(/\s+/).filter(Boolean).length;
            return Math.max(2.0, wc / 2.2);
        };

        // Her slayt iÃƒÂ§in sÃƒÂ¼re hesapla (minimum 3 saniye)
        const slideDurations = slides.map((slide, i) => {
            const audioData = jobData.assets.audio[i];
            const audioDur = getAudioDur(audioData, slide.spokenText);
            const slideType = slide._slideType || 'QUOTE';
            // HOOK: 3-4 saniye, LEAD: 4-6 saniye, QUOTE: ses sÃƒÂ¼resi + buffer, CTA: 5-7 saniye
            if (slideType === 'HOOK') return Math.max(3.5, Math.min(audioDur + 1.0, 5.0));
            if (slideType === 'LEAD') return Math.max(4.0, Math.min(audioDur + 1.5, 8.0));
            if (slideType === 'CTA') return Math.max(5.0, Math.min(audioDur + 2.0, 10.0));
            return Math.max(4.0, audioDur + 1.5); // QUOTE
        });

        // Intro (1 siyah kare) + outro (2 saniye siyah) sÃƒÂ¼releri
        const introDur = 1.0;
        const outroDur = 2.0;
        const totalDuration = slideDurations.reduce((a, b) => a + b, 0) + introDur + outroDur;
        const totalFrames = Math.round(totalDuration * FPS);
        addSystemLog(`Toplam sÃƒÂ¼re: ${totalDuration.toFixed(1)}sn (${slides.length} sahne + intro/outro)`, 'info');

        // Slayt kare aralÃ„Â±klarÃ„Â±nÃ„Â± hesapla
        let frameOffset = Math.round(introDur * FPS);
        const slideFrameRanges = slideDurations.map((dur) => {
            const start = frameOffset;
            const end = frameOffset + Math.round(dur * FPS);
            frameOffset = end;
            return { start, end };
        });

        // Ses ÃƒÂ§alma Ã¢â‚¬â€ her slayt iÃƒÂ§in
        const playSlideAudio = async (index) => {
            const audioData = jobData.assets.audio[index];
            if (!audioData?.wavBuffer) return;
            try {
                let bufferCopy;
                if (audioData.wavBuffer instanceof ArrayBuffer) bufferCopy = audioData.wavBuffer.slice(0);
                else if (audioData.wavBuffer.buffer instanceof ArrayBuffer) bufferCopy = audioData.wavBuffer.buffer.slice(0);
                else bufferCopy = audioData.wavBuffer;
                const audioBuf = await audioCtx.decodeAudioData(bufferCopy);
                const source = audioCtx.createBufferSource(); source.buffer = audioBuf;
                source.playbackRate.value = 1.0;
                const gain = audioCtx.createGain(); gain.gain.value = 0.85;
                source.connect(gain); gain.connect(audioDest); source.start(0);
            } catch (e) { addSystemLog(`Slayt ${index} ses hatasÃ„Â±: ${e.message}`, 'warn'); }
        };

        // MÃƒÂ¼zik setup
        let bgmSource, masterGain;
        let ambientSound = jobData.preferences.ambientSound || 'none';
        if (ambientSound === 'none') {
            try {
                const allMusic = await AssetManagerService.getAllMusicFromLib();
                if (allMusic.length > 0) { ambientSound = allMusic[0].id; addSystemLog(`MÃƒÂ¼zik otomatik: ${allMusic[0].name}`, 'info'); }
            } catch (e) {}
        }
        if (ambientSound !== 'none') {
            if (['rain', 'wind', 'waves', 'fire'].includes(ambientSound)) {
                try {
                    const ambientObj = AmbientAudioService.getAmbientNode(audioCtx, ambientSound);
                    if (ambientObj) { bgmSource = ambientObj.source; masterGain = audioCtx.createGain(); masterGain.gain.value = 0.25; ambientObj.gainNode.connect(masterGain); masterGain.connect(audioDest); }
                } catch (e) {}
            } else {
                try {
                    const track = await AssetManagerService.getMusicFromLib(ambientSound);
                    if (track?.data) {
                        const raw = track.data.includes(',') ? track.data.split(',')[1] : track.data;
                        const ab = new ArrayBuffer(atob(raw).length); const ia = new Uint8Array(ab);
                        for (let i = 0; i < ab.byteLength; i++) ia[i] = atob(raw).charCodeAt(i);
                        const buf = await audioCtx.decodeAudioData(await (await fetch(URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' })))).arrayBuffer());
                        if (!bgmSource) { bgmSource = audioCtx.createBufferSource(); bgmSource.buffer = buf; bgmSource.loop = true; }
                        masterGain = audioCtx.createGain(); masterGain.gain.value = 0.25;
                        bgmSource.connect(masterGain); masterGain.connect(audioDest); bgmSource.start(0);
                        addSystemLog('MÃƒÂ¼zik yÃƒÂ¼klendi: ' + track.name, 'success');
                    }
                } catch (e) { addSystemLog('MÃƒÂ¼zik hatasÃ„Â±: ' + e.message, 'warn'); }
            }
        }

        // MediaRecorder setup
        const stream = canvasElement.captureStream(FPS);
        const videoTrack = stream.getVideoTracks()[0];
        if (audioDest) audioDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
        let mimeType = 'video/webm; codecs=vp8,opus';
        if (jobData.config.videoFormat === 'mp4') {
            if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
            else if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1200000, audioBitsPerSecond: 128000 });
        const chunks = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.start(100);

        // GÃƒÂ¶rselleri yÃƒÂ¼kle
        const images = jobData.assets.images.filter(img => img);
        const loadedImages = [];
        for (const imgData of images) {
            const img = await NetworkUtils.loadImage(imgData);
            if (img) loadedImages.push(img);
        }
        if (loadedImages.length === 0) loadedImages.push(null);
        addSystemLog(`${loadedImages.length} gÃƒÂ¶rsel yÃƒÂ¼klendi.`, 'info');

        // Timer Worker
        const timerWorkerCode = `let interval; self.onmessage = function(e) { if (e.data === 'start') interval = setInterval(() => self.postMessage('tick'), 25); if (e.data === 'stop') clearInterval(interval); };`;
        const timerWorker = new Worker(URL.createObjectURL(new Blob([timerWorkerCode], { type: 'application/javascript' })));
        timerWorker.postMessage('start');
        let frameResolvers = [];
        timerWorker.onmessage = () => { const r = frameResolvers; frameResolvers = []; r.forEach(fn => fn()); };
        const nextFrame = () => new Promise(resolve => frameResolvers.push(resolve));

        sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 30, text: 'Felsefi video render ediliyor...' });

        const kenBurnsDir = Math.floor(Math.random() * 4);
        let lastSlideIndex = -1;
        // Her slayt iÃƒÂ§in rastgele Ken Burns yÃƒÂ¶nÃƒÂ¼
        const slideKenBurns = slides.map(() => Math.floor(Math.random() * 4));

        // Metin ÃƒÂ§izim yardÃ„Â±mcÃ„Â± fonksiyonu
        const drawOutlinedText = (text, x, y, fontSize, color = "#FFFFFF", outlineColor = "#000000", outlineWidth = 5) => {
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.lineWidth = outlineWidth; ctx.strokeStyle = outlineColor; ctx.lineJoin = "round";
            ctx.strokeText(text, x, y);
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
        };

        // Wrap text yardÃ„Â±mcÃ„Â± fonksiyonu
        const wrapAndDraw = (text, x, y, maxWidth, fontSize, color = "#FFFFFF", lineHeight = null) => {
            const lh = lineHeight || fontSize * 1.5;
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            const lines = RenderWorkerService.wrapText(ctx, text, maxWidth);
            const totalH = lines.length * lh;
            const startY = y - totalH / 2;
            lines.forEach((line, i) => {
                drawOutlinedText(line, x, startY + (i * lh) + lh / 2, fontSize, color);
            });
            return lines.length;
        };

        for (let frame = 0; frame < totalFrames; frame++) {
            const elapsed = frame / FPS;
            ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, w, h);

            // Intro/outro: siyah kare
            const introFrames = Math.round(introDur * FPS);
            const isIntro = frame < introFrames;
            const isOutro = frame >= totalFrames - Math.round(outroDur * FPS);

            if (!isIntro && !isOutro) {
                // GeÃƒÂ§erli slaytÃ„Â± bul
                let currentSlideIdx = -1;
                for (let i = 0; i < slideFrameRanges.length; i++) {
                    if (frame >= slideFrameRanges[i].start && frame < slideFrameRanges[i].end) {
                        currentSlideIdx = i; break;
                    }
                }

                if (currentSlideIdx >= 0 && currentSlideIdx < slides.length) {
                    const slide = slides[currentSlideIdx];
                    const slideType = slide._slideType || 'QUOTE';
                    const imgIdx = Math.min(currentSlideIdx, loadedImages.length - 1);
                    const range = slideFrameRanges[currentSlideIdx];
                    const slideElapsed = (frame - range.start) / FPS;
                    const slideDuration = slideDurations[currentSlideIdx];
                    const slideProgress = (frame - range.start) / (range.end - range.start);

                    // Ses tetikleme Ã¢â‚¬â€ yeni slayta geÃƒÂ§iÃ…Å¸te
                    if (currentSlideIdx !== lastSlideIndex) {
                        lastSlideIndex = currentSlideIdx;
                        playSlideAudio(currentSlideIdx);
                    }

                    // Ken Burns arka plan gÃƒÂ¶rseli
                    if (loadedImages[imgIdx]) {
                        const kbDir = slideKenBurns[currentSlideIdx];
                        const t = slideProgress;
                        const zoom = 1.0 + 0.1 * t;
                        const panX = [-0.04, 0.04, 0, 0][kbDir] * w * t;
                        const panY = [0, 0, -0.04, 0.04][kbDir] * h * t;
                        ctx.save();
                        ctx.translate(w / 2 + panX, h / 2 + panY);
                        ctx.scale(zoom, zoom);
                        const img = loadedImages[imgIdx];
                        const imgRatio = img.width / img.height;
                        const canRatio = w / h;
                        let sx, sy, sw, sh;
                        if (imgRatio > canRatio) { sh = img.height; sw = sh * canRatio; sx = (img.width - sw) / 2; sy = 0; }
                        else { sw = img.width; sh = sw / canRatio; sx = 0; sy = (img.height - sh) / 2; }
                        ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
                        ctx.restore();
                    }

                    // Overlay gradient
                    const ov = ctx.createLinearGradient(0, 0, 0, h);
                    ov.addColorStop(0, "rgba(0,0,0,0.6)"); ov.addColorStop(0.3, "rgba(0,0,0,0.2)");
                    ov.addColorStop(0.7, "rgba(0,0,0,0.2)"); ov.addColorStop(1, "rgba(0,0,0,0.7)");
                    ctx.fillStyle = ov; ctx.fillRect(0, 0, w, h);

                    // Fade in/out animasyonu
                    const fadeIn = Math.min(1, slideElapsed / 0.5);
                    const fadeOut = slideProgress > 0.85 ? 1 - ((slideProgress - 0.85) / 0.15) : 1;
                    ctx.globalAlpha = Math.max(0, Math.min(1, fadeIn * fadeOut));

                    // Slayt tipine gÃƒÂ¶re render
                    if (slideType === 'HOOK') {
                        // VURUCU BAÃ…ÂLIK Ã¢â‚¬â€ bÃƒÂ¼yÃƒÂ¼k, merkez, dramatik
                        const hookText = slide.spokenText || slide.topText;
                        const fontSize = w > 800 ? 52 : 40;
                        wrapAndDraw(hookText, cx, h * 0.45, w * 0.85, fontSize, "#FFD700");
                        // AltÃ„Â±n ÃƒÂ§izgi dekorasyonu
                        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)"; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.62); ctx.lineTo(w * 0.85, h * 0.62); ctx.stroke();
                    }
                    else if (slideType === 'LEAD') {
                        // GÃ„Â°RÃ„Â°Ã…Â Ã¢â‚¬â€ orta boy, beyaz, merkez
                        const leadText = slide.spokenText;
                        const fontSize = w > 800 ? 36 : 28;
                        wrapAndDraw(leadText, cx, h * 0.45, w * 0.82, fontSize, "#E2E8F0");
                    }
                    else if (slideType === 'QUOTE') {
                        // DÃƒÅ“Ã…ÂÃƒÅ“NÃƒÅ“R SÃƒâ€“ZÃƒÅ“ Ã¢â‚¬â€ isim ÃƒÂ¼stte, sÃƒÂ¶z ortada, vurgu altta
                        const nameText = slide.topText;
                        const quoteText = slide._quoteText || slide.spokenText;
                        const emphasis = slide._emphasis || "";

                        // DÃƒÂ¼Ã…Å¸ÃƒÂ¼nÃƒÂ¼r adÃ„Â± Ã¢â‚¬â€ altÃ„Â±n, ÃƒÂ¼st kÃ„Â±sÃ„Â±m
                        const nameFontSize = w > 800 ? 38 : 30;
                        drawOutlinedText(nameText, cx, h * 0.18, nameFontSize, "#FFD700", "#000000", 4);

                        // Alt ÃƒÂ§izgi
                        ctx.strokeStyle = "rgba(255, 215, 0, 0.3)"; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(w * 0.25, h * 0.25); ctx.lineTo(w * 0.75, h * 0.25); ctx.stroke();

                        // BÃƒÂ¼yÃƒÂ¼k tÃ„Â±rnak iÃ…Å¸areti
                        ctx.fillStyle = "rgba(255, 215, 0, 0.15)"; ctx.font = `bold ${w > 800 ? 120 : 90}px Georgia, serif`;
                        ctx.textAlign = "left"; ctx.fillText('"', w * 0.08, h * 0.45);

                        // SÃƒÂ¶z metni Ã¢â‚¬â€ beyaz, merkez
                        const quoteFontSize = w > 800 ? 34 : 26;
                        wrapAndDraw(quoteText, cx, h * 0.47, w * 0.78, quoteFontSize, "#FFFFFF");

                        // Vurgu Ã¢â‚¬â€ kÃƒÂ¼ÃƒÂ§ÃƒÂ¼k, gri, alt kÃ„Â±sÃ„Â±m
                        if (emphasis) {
                            const emphFontSize = w > 800 ? 22 : 18;
                            ctx.globalAlpha = Math.max(0, Math.min(0.8, fadeIn * fadeOut));
                            wrapAndDraw(emphasis, cx, h * 0.73, w * 0.75, emphFontSize, "#94A3B8");
                        }
                    }
                    else if (slideType === 'CTA') {
                        // KAPANIÃ…Â Ã¢â‚¬â€ soru + hashtag'ler
                        const ctaText = slide.spokenText;
                        const hashtags = slide._hashtags || "";

                        // Soru
                        const ctaFontSize = w > 800 ? 34 : 26;
                        wrapAndDraw(ctaText, cx, h * 0.35, w * 0.82, ctaFontSize, "#E2E8F0");

                        // Hashtag'ler Ã¢â‚¬â€ alt kÃ„Â±sÃ„Â±m, kÃƒÂ¼ÃƒÂ§ÃƒÂ¼k, mavi
                        if (hashtags) {
                            const hashFontSize = w > 800 ? 20 : 16;
                            ctx.globalAlpha = Math.max(0, Math.min(0.7, fadeIn * fadeOut));
                            wrapAndDraw(hashtags, cx, h * 0.70, w * 0.9, hashFontSize, "#60A5FA");
                        }

                        // "YorumlarÃ„Â±nÃ„Â±zÃ„Â± bekliyorum" alt ÃƒÂ§izgisi
                        const subFontSize = w > 800 ? 24 : 20;
                        ctx.globalAlpha = Math.max(0, Math.min(0.9, fadeIn * fadeOut));
                        drawOutlinedText("ÄŸÅ¸â€™Â¬ GÃƒÂ¶rÃƒÂ¼Ã…Å¸lerinizi yorumlarda paylaÃ…Å¸Ã„Â±n", cx, h * 0.76, subFontSize, "#A78BFA");
                    }

                    ctx.globalAlpha = 1;
                }
            }

            if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame();
            if (frame % 30 === 0) {
                const pct = Math.min(90, 30 + ((frame / totalFrames) * 60));
                sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: pct, text: `${elapsed.toFixed(1)}sn / ${totalDuration.toFixed(1)}sn` });
            }
            await nextFrame();
        }

        // Temizlik
        if (bgmSource) try { bgmSource.stop(); } catch(e){}
        if (masterGain) masterGain.disconnect();
        silentOsc.stop(); silentOsc.disconnect();
        timerWorker.postMessage('stop'); timerWorker.terminate();

        addSystemLog('Recorder durduruluyor...', 'info');
        const videoPromise = new Promise((resolve, reject) => {
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                addSystemLog(`Video hazÃ„Â±r: ${(blob.size / 1024).toFixed(0)}KB, ${totalDuration.toFixed(1)}sn`, blob.size > 0 ? 'success' : 'error');
                if (blob.size === 0) return reject(new Error("Video oluÃ…Å¸turulamadÃ„Â±."));
                resolve(URL.createObjectURL(blob));
            };
        });
        if (recorder.state !== 'inactive') {
            try { recorder.requestData(); } catch(e){}
            await new Promise(r => setTimeout(r, 200));
            recorder.stop();
        }
        stream.getTracks().forEach(t => t.stop());
        return await videoPromise;
    },
    executeRender: async (jobData, canvasElement, preferences) => {
        // Ekonomi verisi doÃ„Å¸rulama
                    // TÃƒÂ¼rkÃƒÂ§e karakter dÃƒÂ¼zeltmesi Ã¢â‚¬â€ her zaman uygula
                    if (jobData.script) {
                        if (jobData.script.thumbnailText) jobData.script.thumbnailText = LogicEngineService.validateTurkishText(jobData.script.thumbnailText);
                        if (jobData.script.sonSoz) jobData.script.sonSoz = LogicEngineService.validateTurkishText(jobData.script.sonSoz);
                        if (jobData.script.lastQuote) jobData.script.lastQuote = LogicEngineService.validateTurkishText(jobData.script.lastQuote);
                        if (jobData.script.videoSlides) {
                            jobData.script.videoSlides.forEach(function(slide) {
                                if (slide.spokenText) slide.spokenText = LogicEngineService.validateTurkishText(slide.spokenText);
                                if (slide.topText) slide.topText = LogicEngineService.validateTurkishText(slide.topText);
                            });
                        }
                    }
                    
                    var econErrors = LogicEngineService.validateEconomyData(jobData.script);
                    if (econErrors.length > 0) {
                        addSystemLog('Ekonomi uyarilari: ' + econErrors.join(', '), 'warn');
                    }
                    
                    addSystemLog('Video render baÃ…Å¸latÃ„Â±lÃ„Â±yor...', 'info');
        const aspectRatio = jobData.config.aspectRatio || '9:16';
        const w = aspectRatio === '16:9' ? 1280 : aspectRatio === '1:1' ? 1080 : 720;
        const h = aspectRatio === '16:9' ? 720 : aspectRatio === '1:1' ? 1080 : 1280;
        const cx = w / 2;
        canvasElement.width = w; canvasElement.height = h;
        const ctx = canvasElement.getContext('2d');
        ctx.fillStyle = "#0B0F19"; ctx.fillRect(0, 0, w, h);

        if (jobData.config.outputType === 'image') {
            sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 90, text: 'GÃƒÂ¶rsel Paketleniyor...' });
            const promptImageToUse = jobData.assets.images[0] || jobData.assets.thumbnail;
            if (promptImageToUse) { const sImg = await NetworkUtils.loadImage(promptImageToUse); if (sImg) RenderWorkerService.drawImageContain(ctx, sImg, w, h); }
            return new Promise((resolve) => { canvasElement.toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/png'); });
        }

        if (jobData.script._isGuzelSoz) {
            let fontFamily = "'Inter', 'Arial Black', Arial, sans-serif";
            if (jobData.config.fontStyle === 'classic') fontFamily = "Georgia, 'Times New Roman', serif";
            if (jobData.config.fontStyle === 'typewriter') fontFamily = "'Courier New', Courier, monospace";
            return RenderWorkerService.renderGuzelSoz(jobData, canvasElement, w, h, cx, fontFamily);
        }

        const targetDurStr = jobData.config.duration || '30'; const isUnlimited = targetDurStr === 'unlimited';
        // Birden fazla blok varsa sÃƒÂ¼re sÃ„Â±nÃ„Â±rÃ„Â± yok Ã¢â‚¬â€ doÃ„Å¸al okuma hÃ„Â±zÃ„Â±nda bitir
        const hasMultipleBlocks = (jobData.script.imageBlocks || []).length > 1;
        const useForceExact = !isUnlimited && !hasMultipleBlocks;
        const bounds = getDurationBounds(targetDurStr); const limitSec = useForceExact ? bounds.max : 9999;
        let globalRenderedSec = 0;
        const getAudioDur = (audioData, fallbackText) => {
            if (audioData?.useWebSpeech && audioData?.estDuration) return audioData.estDuration;
            if (audioData?.wavBuffer) { let byteLength = 0; if (audioData.wavBuffer instanceof ArrayBuffer) byteLength = audioData.wavBuffer.byteLength; else if (audioData.wavBuffer.buffer instanceof ArrayBuffer) byteLength = audioData.wavBuffer.buffer.byteLength; else if (audioData.wavBuffer.byteLength) byteLength = audioData.wavBuffer.byteLength; if (byteLength > 44) { const sampleRate = audioData.sampleRate || 24000; return (byteLength - 44) / (sampleRate * 2); } }
            const wordsCount = (fallbackText || "").trim().split(/\s+/).filter(Boolean).length; if (wordsCount === 0) return 0.5; return Math.max(1.0, wordsCount / getWPS(jobData.config.language));
        };

        let rawKapakDur = Math.min(jobData.assets.thumbnailAudio ? (getAudioDur(jobData.assets.thumbnailAudio, jobData.script.thumbnailText) + 0.5) : 1.5, 5.0); // Maksimum 5 saniye
        let rawSonSozDur = jobData.script.sonSoz ? (getAudioDur(jobData.assets.sonSozAudio, jobData.script.sonSoz) + 0.05) : 0;
        // Yorum sÃƒÂ¼resini son sÃƒÂ¶z sÃƒÂ¼resine ekle Ã¢â‚¬â€ yorum bitmeden kapanÃ„Â±Ã…Å¸a geÃƒÂ§mesin
        if (jobData.config.yorum && jobData.config.yorum.trim().length > 0 && jobData.assets.yorumAudio) {
            const yorumWords = jobData.config.yorum.trim().split(/\s+/).filter(Boolean).length;
            const yorumExtra = Math.max(1.0, yorumWords / getWPS(jobData.config.language || 'tr')) + 0.3;
            rawSonSozDur += yorumExtra;
        }
        let rawOutroDur = Math.max(7.0, getAudioDur(jobData.assets.outroAudio, jobData.script.lastQuote) + 0.5); // Min 7sn Ã¢â‚¬â€ animasyonlar iÃƒÂ§in
        let rawSlideSecs = jobData.script.videoSlides.map((s, i) => getAudioDur(jobData.assets.audio[i], s.spokenText) + 0.02);
        let rawCushion = 0.03;
        let totalNaturalSec = rawKapakDur + rawSonSozDur + rawOutroDur + rawCushion + rawSlideSecs.reduce((a, b) => a + b, 0);
        let scaleFactor = 1.0;
        if (hasMultipleBlocks) { addSystemLog(`Ãƒâ€¡oklu blok: SÃƒÂ¼re sÃ„Â±nÃ„Â±rÃ„Â± yok. DoÃ„Å¸al okuma hÃ„Â±zÃ„Â± (${totalNaturalSec.toFixed(1)}sn).`, 'info'); }
        else if (useForceExact) { if (totalNaturalSec > bounds.max) { scaleFactor = bounds.max / totalNaturalSec; addSystemLog(`SÃƒÂ¼re limitine sÃ„Â±Ã„Å¸dÃ„Â±rÃ„Â±lÃ„Â±yor (${scaleFactor.toFixed(2)}x)...`, "warn"); } else if (totalNaturalSec < bounds.min) { scaleFactor = bounds.min / totalNaturalSec; addSystemLog(`Minimum sÃƒÂ¼re yakalanÃ„Â±yor (${scaleFactor.toFixed(2)}x)...`, "warn"); } }

        const timerWorkerCode = `let interval; self.onmessage = function(e) { if (e.data === 'start') interval = setInterval(() => self.postMessage('tick'), 25); if (e.data === 'stop') clearInterval(interval); };`;
        const timerWorkerBlob = new Blob([timerWorkerCode], { type: 'application/javascript' });
        const timerWorker = new Worker(URL.createObjectURL(timerWorkerBlob)); timerWorker.postMessage('start');
        let frameResolvers = [];
        timerWorker.onmessage = () => { const resolvers = frameResolvers; frameResolvers = []; resolvers.forEach(r => r()); };
        const nextFrame = () => new Promise(resolve => { frameResolvers.push(resolve); });

        const audioCtx = _getAudioCtx(); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        const audioDest = audioCtx ? audioCtx.createMediaStreamDestination() : null;
        const silentOsc = audioCtx.createOscillator(); const silentGain = audioCtx.createGain(); silentGain.gain.value = 0.001; silentOsc.connect(silentGain); silentGain.connect(audioDest); silentOsc.start();
        const keepAliveOsc = audioCtx.createOscillator(); const keepAliveGain = audioCtx.createGain(); keepAliveGain.gain.value = 0.00001; keepAliveOsc.connect(keepAliveGain); keepAliveGain.connect(audioCtx.destination); keepAliveGain.connect(audioDest); keepAliveOsc.start();

        let fontFamily = "'Inter', 'Arial Black', Arial, sans-serif";
        if (jobData.config.fontStyle === 'classic') fontFamily = "Georgia, 'Times New Roman', serif";
        if (jobData.config.fontStyle === 'typewriter') fontFamily = "'Courier New', Courier, monospace";

        const FPS = 30; const stream = canvasElement.captureStream(FPS); const videoTrack = stream.getVideoTracks()[0];
        const audioTracks = audioDest ? audioDest.stream.getAudioTracks() : [];
        const combinedStream = new MediaStream([...stream.getVideoTracks(), ...audioTracks]);
        let mimeType = 'video/webm; codecs="vp8, opus"';
        if (jobData.config.videoFormat === 'mp4') { if (MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'; else if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4'; }
        if (!MediaRecorder.isTypeSupported(mimeType)) { mimeType = 'video/webm;codecs=vp8,opus'; if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm'; }

        const playAudio = async (audioData, requestedDuration = null, fallbackText = "") => {
            if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume().catch(() => {});
            let baseExactDur = getAudioDur(audioData, fallbackText);
            let audioEndPromise = null;
            let wordTimings = [];
            if (audioData?.useWebSpeech && audioData?.speechText) {
                // Web Speech API ile seslendirme (NVIDIA TTS yok)
                addSystemLog('Web Speech ile seslendiriliyor: ' + audioData.speechText.substring(0, 30) + '...', 'info');
                audioEndPromise = MediaSynthesisService.speakWithWebSpeech(audioData.speechText, jobData.preferences?.narratorVoice);
                baseExactDur = audioData.estDuration || baseExactDur;
            } else if (audioData?.wavBuffer && audioCtx) {
                try {
                    let bufferCopy; if (audioData.wavBuffer instanceof ArrayBuffer) bufferCopy = audioData.wavBuffer.slice(0); else if (audioData.wavBuffer.buffer instanceof ArrayBuffer) bufferCopy = audioData.wavBuffer.buffer.slice(0); else if (typeof audioData.wavBuffer === 'object') { const uint8 = new Uint8Array(Object.values(audioData.wavBuffer)); bufferCopy = uint8.buffer.slice(0); } else bufferCopy = audioData.wavBuffer;
                    let audioBuf = await audioCtx.decodeAudioData(bufferCopy);
                    // SessizliÃ„Å¸i kÃ„Â±rp Ã¢â‚¬â€ baÃ…Å¸taki ve sondaki
                    audioBuf = RenderWorkerService.trimSilence(audioBuf);
                    const source = audioCtx.createBufferSource(); source.buffer = audioBuf;
                    // scaleFactor'Ã„Â± ses hÃ„Â±zÃ„Â±na uygula Ã¢â‚¬â€ video sÃƒÂ¼resini deÃ„Å¸il
                    source.playbackRate.value = scaleFactor;
                    const gain = audioCtx.createGain(); gain.gain.value = 0.8; // Narrator %80
                    source.connect(gain); gain.connect(audioDest); source.start(0);
                    baseExactDur = Math.min(audioBuf.duration, 180.0);
                    audioEndPromise = new Promise(resolve => { source.onended = resolve; });
                } catch (e) { console.warn("Ses decode hatasÃ„Â±:", e); }
            }
            // Video sÃƒÂ¼resi = ses sÃƒÂ¼resi / scaleFactor
            const scaledAudioDur = baseExactDur / scaleFactor;
            // Kelime bazlÃ„Â± zamanlama Ã¢â‚¬â€ scale edilmiÃ…Å¸ sÃƒÂ¼reye gÃƒÂ¶re (altyazÃ„Â± senkronu iÃƒÂ§in)
            wordTimings = RenderWorkerService.calculateWordTimings(fallbackText, scaledAudioDur);
            let totalDur = requestedDuration !== null ? requestedDuration : (scaledAudioDur + 0.02);
            return { exactDur: scaledAudioDur, totalDur, audioEndPromise, wordTimings };
        };

        const renderSonSozScene = async (text, audioData, duration, isSingleMedia = false) => {
            let startT = performance.now(); const safeText = text || "";
            const lang = jobData.config.language || 'tr';
            const hasYorum = jobData.config.yorum && jobData.config.yorum.trim().length > 0;
            // Yorum varsa: AI son sÃƒÂ¶z yok, sadece yorum sesi ve metni
            // Yorum yoksa: normal son sÃƒÂ¶z sesi ve metni
            const effectiveText = hasYorum ? jobData.config.yorum : safeText;
            const effectiveAudio = hasYorum ? jobData.assets.yorumAudio : audioData;
            const sonSozResult = await playAudio(effectiveAudio, hasYorum ? null : duration, effectiveText);
            const sonSozAudioEnd = sonSozResult.audioEndPromise;
            const sonSozFrames = Math.max(1, Math.round(sonSozResult.totalDur * FPS));
            const totalFrames = sonSozFrames;
            let yorumAudioEnd = hasYorum ? sonSozAudioEnd : null;
            // Son sÃƒÂ¶z sahnesi ÃƒÂ¶ncesi 1 boÃ…Å¸ kare Ã¢â‚¬â€ sahneler arasÃ„Â± net geÃƒÂ§iÃ…Å¸
            ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h);
            if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame();
            await nextFrame();
            for (let frame = 0; frame < totalFrames; frame++) {
                if (useForceExact && globalRenderedSec >= limitSec) break;
                ctx.fillStyle = "#030712"; ctx.fillRect(0, 0, w, h / 2);
                // BaÃ…Å¸lÃ„Â±k sadece ÃƒÂ§oklu medyada gÃƒÂ¶sterilir Ã¢â‚¬â€ yorumdan baÃ„Å¸Ã„Â±msÃ„Â±z
                if (!isSingleMedia) {
                    let headerText = "SON SÃƒâ€“Z"; if (lang === 'de') headerText = "SCHLUSSWORT"; else if (lang === 'en') headerText = "FINAL WORDS"; else if (lang === 'fr') headerText = "MOT DE LA FIN"; else if (lang === 'es') headerText = "ÃƒÅ¡LTIMAS PALABRAS"; else if (lang === 'ar') headerText = "Ã˜Â§Ã™â€Ã™Æ’Ã™â€Ã™â€¦Ã˜Â© Ã˜Â§Ã™â€Ã˜Â£Ã˜Â®Ã™Å Ã˜Â±Ã˜Â©"; else if (lang === 'ru') headerText = "ÄÅ¸ÄÂÄÂ¡Äâ€ºÄâ€¢ÄÂ¡Äâ€ºÄÂÄâ€™Ã„Â°Äâ€¢";
                    ctx.fillStyle = "#E11D48"; ctx.font = `900 ${w > 800 ? 54 : 44}px ${fontFamily}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(trUpper(headerText), cx, h * 0.08);
                }
                if (hasYorum) {
                    // Yorum varsa: sadece yorum metnini gÃƒÂ¶ster (AI son sÃƒÂ¶z yok)
                    const yorumFontSize = w > 800 ? 48 : 34;
                    ctx.font = `900 ${yorumFontSize}px ${fontFamily}`;
                    const yorumLines = RenderWorkerService.wrapText(ctx, jobData.config.yorum, w * 0.85);
                    const yorumLh = yorumFontSize * 1.35;
                    const yorumTotalH = yorumLines.length * yorumLh + 35;
                    const yorumStartY = h / 2 - yorumTotalH - 5;
                    ctx.fillStyle = "#2563EB"; ctx.font = `900 ${w > 800 ? 36 : 26}px ${fontFamily}`; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText("YORUM", cx, yorumStartY);
                    ctx.font = `900 ${yorumFontSize}px ${fontFamily}`; ctx.fillStyle = "white";
                    yorumLines.forEach((line, idx) => { ctx.fillText(line, cx, yorumStartY + 35 + (idx * yorumLh)); });
                } else {
                    // Yorum yoksa normal son sÃƒÂ¶z metnini gÃƒÂ¶ster
                    let bodyFontSize = w > 800 ? 42 : 30; ctx.font = `900 ${bodyFontSize}px ${fontFamily}`; let lines = RenderWorkerService.wrapText(ctx, text, w * 0.85);
                    const maxAllowedY = h / 2 - 35;
                    const lh = bodyFontSize * 1.35; while ((h * 0.16 + lines.length * lh) > maxAllowedY && bodyFontSize > 16) { bodyFontSize -= 2; ctx.font = `900 ${bodyFontSize}px ${fontFamily}`; lines = RenderWorkerService.wrapText(ctx, text, w * 0.85); }
                    ctx.fillStyle = "#F3F4F6"; ctx.textAlign = "center"; ctx.textBaseline = "top"; const startY = h * 0.16; lines.forEach((line, idx) => { ctx.fillText(line, cx, startY + (idx * bodyFontSize * 1.35)); });
                }
                const fX = 0, fY = h / 2, fW = w, fH = h / 2; ctx.save();
                switch (lang.toLowerCase()) {
                    case 'tr': { ctx.fillStyle = "#E30A17"; ctx.fillRect(fX, fY, fW, fH); const centerX = fX + fW / 2; const centerY = fY + fH / 2; const rOuter = fH * 0.28; const rInner = fH * 0.22; const shiftX = fH * 0.08; ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(centerX - shiftX / 2, centerY, rOuter, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#E30A17"; ctx.beginPath(); ctx.arc(centerX - shiftX / 2 + shiftX, centerY, rInner, 0, Math.PI * 2); ctx.fill(); RenderWorkerService.drawStar(ctx, centerX + fH * 0.16, centerY, 5, fH * 0.10, fH * 0.04, "#FFFFFF"); break; }
                    case 'de': { const sH = fH / 3; ctx.fillStyle = "#000000"; ctx.fillRect(fX, fY, fW, sH); ctx.fillStyle = "#DD0000"; ctx.fillRect(fX, fY + sH, fW, sH); ctx.fillStyle = "#FFCE00"; ctx.fillRect(fX, fY + sH * 2, fW, sH); break; }
                    case 'en': { ctx.fillStyle = "#012169"; ctx.fillRect(fX, fY, fW, fH); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = fH * 0.1; ctx.beginPath(); ctx.moveTo(fX, fY); ctx.lineTo(fX + fW, fY + fH); ctx.moveTo(fX + fW, fY); ctx.lineTo(fX, fY + fH); ctx.stroke(); ctx.strokeStyle = "#C8102E"; ctx.lineWidth = fH * 0.04; ctx.beginPath(); ctx.moveTo(fX, fY); ctx.lineTo(fX + fW, fY + fH); ctx.moveTo(fX + fW, fY); ctx.lineTo(fX, fY + fH); ctx.stroke(); ctx.fillStyle = "#FFFFFF"; const cwW = fW * 0.16; const cwH = fH * 0.16; ctx.fillRect(fX + fW / 2 - cwW / 2, fY, cwW, fH); ctx.fillRect(fX, fY + fH / 2 - cwH / 2, fW, cwH); ctx.fillStyle = "#C8102E"; const rcwW = fW * 0.10; const rcwH = fH * 0.10; ctx.fillRect(fX + fW / 2 - rcwW / 2, fY, rcwW, fH); ctx.fillRect(fX, fY + fH / 2 - rcwH / 2, fW, rcwH); break; }
                    case 'fr': { const sW = fW / 3; ctx.fillStyle = "#00209F"; ctx.fillRect(fX, fY, sW, fH); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(fX + sW, fY, sW, fH); ctx.fillStyle = "#F63847"; ctx.fillRect(fX + sW * 2, fY, sW, fH); break; }
                    case 'es': { const rH = fH / 4; const yH = fH / 2; ctx.fillStyle = "#C60B1E"; ctx.fillRect(fX, fY, fW, rH); ctx.fillStyle = "#F1BF00"; ctx.fillRect(fX, fY + rH, fW, yH); ctx.fillStyle = "#C60B1E"; ctx.fillRect(fX, fY + rH + yH, fW, rH); break; }
                    case 'ru': { const sH = fH / 3; ctx.fillStyle = "#FFFFFF"; ctx.fillRect(fX, fY, fW, sH); ctx.fillStyle = "#0039A6"; ctx.fillRect(fX, fY + sH, fW, sH); ctx.fillStyle = "#D52B1E"; ctx.fillRect(fX, fY + sH * 2, fW, sH); break; }
                    case 'ar': { const rW = fW * 0.22; ctx.fillStyle = "#E01E37"; ctx.fillRect(fX, fY, rW, fH); const restW = fW - rW; const sH = fH / 3; ctx.fillStyle = "#107C41"; ctx.fillRect(fX + rW, fY, restW, sH); ctx.fillStyle = "#FFFFFF"; ctx.fillRect(fX + rW, fY + sH, restW, sH); ctx.fillStyle = "#000000"; ctx.fillRect(fX + rW, fY + sH * 2, restW, sH); break; }
                    default: { ctx.fillStyle = "#111827"; ctx.fillRect(fX, fY, fW, fH); break; }
                }
                ctx.restore(); globalRenderedSec += 1 / FPS; if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame(); await nextFrame();
            }
            if (sonSozAudioEnd) await sonSozAudioEnd;
            if (yorumAudioEnd) await yorumAudioEnd;
            addSystemLog(`Son sÃƒÂ¶z sahnesi render edildi.`, 'success');
        };

        const renderScene = async (imgObj, text, audioData, duration, isThumbnail = false, isOutro = false, topText = null, slideIndex = -1, chartData = null, transition = 'none', useContain = false, zoomCoords = null) => {
            let startT = performance.now(); const { exactDur, totalDur, audioEndPromise, wordTimings } = await playAudio(audioData, duration, text);
            // AltyazÃ„Â± Ã¢â‚¬â€ wordTimings'den oluÃ…Å¸tur (gerÃƒÂ§ek ses zamanlamasÃ„Â±, scale edilmemiÃ…Å¸)
            const subs = (isThumbnail || isOutro || wordTimings.length === 0) ? [] : RenderWorkerService._subsFromWordTimings(wordTimings);
            const totalFrames = Math.max(1, Math.round(totalDur * FPS));
            const transitionFrames = Math.min(5, Math.floor(totalFrames * 0.3)); // ~150ms fade
            // Ken Burns yÃƒÂ¶nÃƒÂ¼ Ã¢â‚¬â€ bir kez hesapla, her karede rastgele deÃ„Å¸il
            const kbPanDirX = (Math.random() - 0.5) * 20;
            const kbPanDirY = (Math.random() - 0.5) * 20;
            for (let frame = 0; frame < totalFrames; frame++) {
                if (useForceExact && globalRenderedSec >= limitSec) break;
                const progress = frame / totalFrames; const elapsedSec = frame / FPS;
                const activeSub = subs.find(s => elapsedSec >= s.startSec && elapsedSec < s.endSec)?.text || "";
                ctx.fillStyle = "black"; ctx.fillRect(0, 0, w, h);

                // Transition effect
                let alpha = 1;
                let offsetX = 0;
                if (transition === 'fadeIn' && frame < transitionFrames) {
                    alpha = frame / transitionFrames;
                } else if (transition === 'fadeOut' && frame > totalFrames - transitionFrames) {
                    alpha = (totalFrames - frame) / transitionFrames;
                } else if (transition === 'crossfade' && frame < transitionFrames) {
                    alpha = frame / transitionFrames;
                } else if (transition === 'slideIn' && frame < transitionFrames) {
                    offsetX = w * (1 - frame / transitionFrames);
                } else if (transition === 'slideOut' && frame > totalFrames - transitionFrames) {
                    offsetX = -w * ((frame - (totalFrames - transitionFrames)) / transitionFrames);
                }

                ctx.save();
                ctx.globalAlpha = alpha;
                if (offsetX !== 0) ctx.translate(offsetX, 0);

                if (imgObj) {
                    // Zoom koordinatlarÃ„Â± varsa o bÃƒÂ¶lgeye zoom yap
                    if (zoomCoords) {
                        const z = zoomCoords;
                        const zx = (z.x / 100) * imgObj.width;
                        const zy = (z.y / 100) * imgObj.height;
                        const zw = (z.w / 100) * imgObj.width;
                        const zh = (z.h / 100) * imgObj.height;
                        
                        // Ken Burns efekti: zoom + hafif pan (sabit yÃƒÂ¶n)
                        const t = progress;
                        const zoom = 1.0 + 0.15 * t;
                        const panX = kbPanDirX * t;
                        const panY = kbPanDirY * t;
                        
                        ctx.save();
                        ctx.translate(w / 2 + panX, h / 2 + panY);
                        ctx.scale(zoom, zoom);
                        
                        // KÃ„Â±rpÃ„Â±lmÃ„Â±Ã…Å¸ bÃƒÂ¶lgeyi ÃƒÂ§iz
                        const scale = Math.max(w / zw, h / zh);
                        const drawW = zw * scale;
                        const drawH = zh * scale;
                        ctx.drawImage(imgObj, zx, zy, zw, zh, -drawW / 2, -drawH / 2, drawW, drawH);
                        ctx.restore();
                    } else if (useContain) { 
                        RenderWorkerService.drawImageContain(ctx, imgObj, w, h); 
                    } else { 
                        RenderWorkerService.drawImageCover(ctx, imgObj, w, h); 
                    }
                }
                if (isThumbnail) { RenderWorkerService.drawThumbnail(ctx, imgObj, text, w, h, fontFamily, jobData.config.sourceName, jobData.config); }
                else if (!isOutro) {
                    const grad = ctx.createLinearGradient(0, h * 0.45, 0, h); grad.addColorStop(0, "transparent"); grad.addColorStop(1, "rgba(0,0,0,0.95)"); ctx.fillStyle = grad; ctx.fillRect(0, h * 0.45, w, h * 0.55);
                    if (topText) {
                        let topFontSize = w > 800 ? 46 : 38;
                        ctx.font = `900 ${topFontSize}px ${fontFamily}`;
                        let lines = RenderWorkerService.wrapText(ctx, topText, w * 0.85);
                        const maxLines = jobData.script._isGuzelSoz ? 10 : 5;
                        while (lines.length > maxLines && topFontSize > 18) {
                            topFontSize -= 2;
                            ctx.font = `900 ${topFontSize}px ${fontFamily}`;
                            lines = RenderWorkerService.wrapText(ctx, topText, w * 0.85);
                        }
                        const lh = topFontSize * 1.3;
                        const boxH = lines.length * lh + 30;
                        const boxW = Math.min(w * 0.92, w * 0.85 + 80);
                        const boxX = cx - (boxW / 2);
                        const boxY = h * 0.06;
                        ctx.fillStyle = "rgba(0,0,0,0.75)";
                        ctx.beginPath();
                        if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 16);
                        else ctx.rect(boxX, boxY, boxW, boxH);
                        ctx.fill();
                        ctx.fillStyle = "#FFD700";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        lines.forEach((line, i) => { ctx.fillText(line.trim(), cx, boxY + (boxH / 2) - ((lines.length - 1) * lh / 2) + (i * lh)); });
                    }
                    if (jobData.config.sourceName && slideIndex > 0) {
                        const srcText = jobData.config.sourceName;
                        const srcFontSize = w > 800 ? 50 : 40;
                        ctx.font = `900 ${srcFontSize}px 'Inter', Arial`;
                        const textW = ctx.measureText(srcText).width;
                        const bubbleW = textW + 60;
                        const bubbleH = srcFontSize + 40;
                        const bubbleX = w - bubbleW - 16;
                        const bubbleY = 16;
                        ctx.fillStyle = "#DC2626";
                        ctx.beginPath();
                        const bR = bubbleH / 2;
                        ctx.moveTo(bubbleX + bR, bubbleY);
                        ctx.lineTo(bubbleX + bubbleW - bR, bubbleY);
                        ctx.arc(bubbleX + bubbleW - bR, bubbleY + bR, bR, -Math.PI / 2, Math.PI / 2);
                        ctx.lineTo(bubbleX + bR, bubbleY + bubbleH);
                        ctx.arc(bubbleX + bR, bubbleY + bR, bR, Math.PI / 2, -Math.PI / 2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.beginPath();
                        ctx.moveTo(bubbleX + 20, bubbleY + bubbleH);
                        ctx.lineTo(bubbleX + 10, bubbleY + bubbleH + 14);
                        ctx.lineTo(bubbleX + 35, bubbleY + bubbleH);
                        ctx.fill();
                        ctx.fillStyle = "white";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(srcText, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
                    }
                    if (activeSub && jobData.config.subtitles !== 'off') { let subFontSize = w > 800 ? 65 : 50; ctx.font = `900 ${subFontSize}px ${fontFamily}`; let displaySub = activeSub.trim(); while (ctx.measureText(displaySub).width > w * 0.95 && subFontSize > 30) { subFontSize -= 2; ctx.font = `900 ${subFontSize}px ${fontFamily}`; } const subTextW = ctx.measureText(displaySub).width; const subPadX = 20; const subPadY = 8; const subBoxW = subTextW + subPadX * 2; const subBoxH = subFontSize + subPadY * 2; const subBoxX = cx - subBoxW / 2; const subBoxY = h * RenderWorkerService.SAFE_ZONE.subtitleY - subBoxH / 2; ctx.fillStyle = "#2563EB"; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(subBoxX, subBoxY, subBoxW, subBoxH, 8); else ctx.rect(subBoxX, subBoxY, subBoxW, subBoxH); ctx.fill(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "white"; ctx.fillText(displaySub, cx, h * RenderWorkerService.SAFE_ZONE.subtitleY); }
                }
                if (isOutro) {
                    // === HAREKETLI KAPANIÃ…Â SAHNESÃ„Â° (H1.141) ===
                    const outroElapsed = elapsedSec;
                    const outroDur = totalDur;

                    // 1. Koyu mor gradyan arka plan
                    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
                    bgGrad.addColorStop(0, '#0a0015');
                    bgGrad.addColorStop(0.4, '#1a0533');
                    bgGrad.addColorStop(0.7, '#0f0a2e');
                    bgGrad.addColorStop(1, '#050010');
                    ctx.fillStyle = bgGrad;
                    ctx.fillRect(0, 0, w, h);

                    // 2. Bokeh parÃƒÂ§acÃ„Â±klarÃ„Â± (20 adet, persistent)
                    if (!window._outroParticles || window._outroParticles.length === 0) {
                        window._outroParticles = [];
                        for (let p = 0; p < 20; p++) {
                            window._outroParticles.push({
                                x: Math.random() * w,
                                y: Math.random() * h,
                                r: 8 + Math.random() * 35,
                                speed: 0.3 + Math.random() * 0.8,
                                phase: Math.random() * Math.PI * 2,
                                alpha: 0.05 + Math.random() * 0.15,
                                hue: Math.random() > 0.5 ? 270 : 320
                            });
                        }
                    }
                    window._outroParticles.forEach(p => {
                        const py = ((p.y - outroElapsed * p.speed * 30) % h + h) % h;
                        const pulse = 1 + 0.2 * Math.sin(outroElapsed * 1.5 + p.phase);
                        const grad = ctx.createRadialGradient(p.x, py, 0, p.x, py, p.r * pulse);
                        grad.addColorStop(0, `hsla(${p.hue}, 80%, 60%, ${p.alpha})`);
                        grad.addColorStop(0.6, `hsla(${p.hue}, 80%, 40%, ${p.alpha * 0.4})`);
                        grad.addColorStop(1, 'transparent');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(p.x, py, p.r * pulse * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    });

                    // 3. BaÃ…Å¸lÃ„Â±k satÃ„Â±rlarÃ„Â± Ã¢â‚¬â€ fade-in + slide-up animasyonu
                    // Dil bazlÃ„Â± outro baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±
                    const lang = jobData?.config?.language || 'tr';
                    const outroTexts = {
                        tr: ["Abone olmayÃ„Â±,", "beÃ„Å¸enmeyi ve", "paylaÃ…Å¸mayÃ„Â±", "ihmal etmeyin."],
                        en: ["Don't forget to", "subscribe, like", "and share."],
                        fr: ["N'oubliez pas de", "vous abonner,", "aimer et partager."],
                        de: ["Vergessen Sie nicht", "zu abonnieren, liken", "und zu teilen."],
                        es: ["No olvides", "suscribirte, dar", "me gusta y compartir."],
                        ar: ["Ã™â€Ã˜Â§ Ã˜ÂªÃ™â€ Ã˜Â³Ã™Â", "Ã˜Â§Ã™â€Ã˜Â§Ã˜Â´Ã˜ÂªÃ˜Â±Ã˜Â§Ã™Æ’ Ã™Ë†Ã˜Â§Ã™â€Ã˜Â¥Ã˜Â¹Ã˜Â¬Ã˜Â§Ã˜Â¨", "Ã™Ë†Ã˜Â§Ã™â€Ã™â€¦Ã˜Â´Ã˜Â§Ã˜Â±Ã™Æ’Ã˜Â©."],
                        ru: ["ÄÂÄÂµ ÄÂ·ÄÂ°ÄÂ±Ã‘Æ’ÄÂ´Ã‘Å’Ã‘â€šÄÂµ", "ÄÂ¿ÄÂ¾ÄÂ´ÄÂ¿ÄÂ¸Ã‘ÂÄÂ°Ã‘â€šÃ‘Å’Ã‘ÂÃ‘Â, ÄÂ»ÄÂ°ÄÂ¹ÄÂºÄÂ½Ã‘Æ’Ã‘â€šÃ‘Å’", "ÄÂ¸ ÄÂ¿ÄÂ¾ÄÂ´ÄÂµÄÂ»ÄÂ¸Ã‘â€šÃ‘Å’Ã‘ÂÃ‘Â."]
                    };
                    const titleLines = outroTexts[lang] || outroTexts['tr'];
                    let titleFontSize = w > 800 ? 52 : 38;
                    const titleLh = titleFontSize * 1.5;
                    const titleStartY = h * 0.22;

                    titleLines.forEach((line, i) => {
                        const lineDelay = i * 0.35;
                        const lineProgress = Math.max(0, Math.min(1, (outroElapsed - lineDelay) / 0.5));
                        const fadeAlpha = lineProgress;
                        const slideOffset = (1 - lineProgress) * 40;

                        ctx.save();
                        ctx.globalAlpha = fadeAlpha;
                        ctx.font = `800 ${titleFontSize}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        // AltÃ„Â±n gradient gÃƒÂ¶lge
                        const tg = ctx.createLinearGradient(cx - w * 0.4, 0, cx + w * 0.4, 0);
                        tg.addColorStop(0, '#FFD700');
                        tg.addColorStop(0.3, '#FFA500');
                        tg.addColorStop(0.7, '#FFD700');
                        tg.addColorStop(1, '#FFC107');

                        const yPos = titleStartY + i * titleLh + slideOffset;

                        // GÃƒÂ¶lge
                        ctx.shadowColor = 'rgba(255, 165, 0, 0.6)';
                        ctx.shadowBlur = 20;
                        ctx.shadowOffsetY = 4;

                        // Siyah outline
                        ctx.lineWidth = titleFontSize * 0.25;
                        ctx.strokeStyle = '#000';
                        ctx.lineJoin = 'round';
                        ctx.strokeText(line, cx, yPos);

                        // AltÃ„Â±n gradient iÃƒÂ§
                        ctx.fillStyle = tg;
                        ctx.fillText(line, cx, yPos);

                        ctx.restore();
                    });

                    // 4. CTA butonlarÃ„Â± Ã¢â‚¬â€ slide-in + nabÃ„Â±z animasyonu
                    // Dil bazlÃ„Â± CTA buton etiketleri
                    const ctaLabels = {
                        tr: { sub: 'Abone Ol', like: 'BeÃ„Å¸en', share: 'PaylaÃ…Å¸' },
                        en: { sub: 'Subscribe', like: 'Like', share: 'Share' },
                        fr: { sub: "S'abonner", like: 'Aimer', share: 'Partager' },
                        de: { sub: 'Abonnieren', like: 'Liken', share: 'Teilen' },
                        es: { sub: 'Suscribir', like: 'Me gusta', share: 'Compartir' },
                        ar: { sub: 'Ã˜Â§Ã˜Â´Ã˜ÂªÃ˜Â±Ã˜Â§Ã™Æ’', like: 'Ã˜Â¥Ã˜Â¹Ã˜Â¬Ã˜Â§Ã˜Â¨', share: 'Ã™â€¦Ã˜Â´Ã˜Â§Ã˜Â±Ã™Æ’Ã˜Â©' },
                        ru: { sub: 'ÄÅ¸ÄÂ¾ÄÂ´ÄÂ¿ÄÂ¸Ã‘ÂÄÂºÄÂ°', like: 'Äâ€ºÄÂ°ÄÂ¹ÄÂº', share: 'ÄÅ¸ÄÂ¾ÄÂ´ÄÂµÄÂ»ÄÂ¸Ã‘â€šÃ‘Å’Ã‘ÂÃ‘Â' }
                    };
                    const cta = ctaLabels[lang] || ctaLabels['tr'];
                    const buttons = [
                        { label: cta.sub, icon: 'bell', delay: 1.8, color1: '#E30A17', color2: '#FF4444' },
                        { label: cta.like, icon: 'heart', delay: 2.2, color1: '#E91E63', color2: '#FF5C8A' },
                        { label: cta.share, icon: 'share', delay: 2.6, color1: '#2196F3', color2: '#64B5F6' }
                    ];
// ============================================================
// AI CLIENT Ã¢â‚¬â€ Fallback zinciri: NVIDIA (ÃƒÂ¼cretsiz) Ã¢â€ â€™ Gemini (ÃƒÂ¼cretsiz eski modeller)


                    const btnAreaY = h * 0.58;
                    const btnRadius = Math.min(w * 0.12, 55);
                    const btnSpacing = btnRadius * 3.2;
                    const btnStartX = cx - btnSpacing;

                    buttons.forEach((btn, i) => {
                        const bx = btnStartX + i * btnSpacing;
                        const by = btnAreaY;

                        const btnProgress = Math.max(0, Math.min(1, (outroElapsed - btn.delay) / 0.4));
                        const slideFrom = (1 - btnProgress) * 80;
                        const fadeAlpha = btnProgress;

                        // NabÃ„Â±z efekti (geldikten sonra)
                        const pulseTime = Math.max(0, outroElapsed - btn.delay - 0.5);
                        const pulse = 1 + 0.06 * Math.sin(pulseTime * 3);

                        ctx.save();
                        ctx.globalAlpha = fadeAlpha;

                        // Buton dairesi Ã¢â‚¬â€ gradyan
                        const btnGrad = ctx.createRadialGradient(bx, by + slideFrom, 0, bx, by + slideFrom, btnRadius * pulse);
                        btnGrad.addColorStop(0, btn.color2);
                        btnGrad.addColorStop(1, btn.color1);
                        ctx.fillStyle = btnGrad;
                        ctx.shadowColor = btn.color1 + '88';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(bx, by + slideFrom, btnRadius * pulse, 0, Math.PI * 2);
                        ctx.fill();

                        // Ã„Â°kon (canvas ile ÃƒÂ§iz)
                        ctx.fillStyle = '#FFFFFF';
                        ctx.shadowBlur = 0;
                        const iconSize = btnRadius * 0.45;
                        const iy = by + slideFrom;

                        if (btn.icon === 'bell') {
                            // Ãƒâ€¡an ikonu
                            ctx.beginPath();
                            ctx.arc(bx, iy - iconSize * 0.2, iconSize * 0.5, Math.PI, 0);
                            ctx.lineTo(bx + iconSize * 0.6, iy + iconSize * 0.3);
                            ctx.lineTo(bx - iconSize * 0.6, iy + iconSize * 0.3);
                            ctx.closePath();
                            ctx.fill();
                            ctx.fillRect(bx - iconSize * 0.15, iy + iconSize * 0.35, iconSize * 0.3, iconSize * 0.15);
                        } else if (btn.icon === 'heart') {
                            // Kalp ikonu
                            const hx = bx, hy = iy - iconSize * 0.1;
                            const hr = iconSize * 0.3;
                            ctx.beginPath();
                            ctx.arc(hx - hr * 0.6, hy - hr * 0.3, hr * 0.6, 0, Math.PI * 2);
                            ctx.arc(hx + hr * 0.6, hy - hr * 0.3, hr * 0.6, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.beginPath();
                            ctx.moveTo(hx - hr * 1.1, hy);
                            ctx.lineTo(hx, hy + hr * 1.2);
                            ctx.lineTo(hx + hr * 1.1, hy);
                            ctx.fill();
                        } else if (btn.icon === 'share') {
                            // PaylaÃ…Å¸ ikonu (baÃ„Å¸lantÃ„Â±)
                            ctx.lineWidth = iconSize * 0.15;
                            ctx.strokeStyle = '#FFFFFF';
                            ctx.lineCap = 'round';
                            // Sol halka
                            ctx.beginPath();
                            ctx.arc(bx - iconSize * 0.25, iy, iconSize * 0.25, Math.PI * 0.7, Math.PI * 2.3);
                            ctx.stroke();
                            // SaÃ„Å¸ halka
                            ctx.beginPath();
                            ctx.arc(bx + iconSize * 0.25, iy, iconSize * 0.25, -Math.PI * 0.3, Math.PI * 1.3);
                            ctx.stroke();
                        }

                        // Etiket
                        ctx.font = `700 ${Math.round(btnRadius * 0.28)}px ${fontFamily}`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillStyle = '#FFFFFF';
                        ctx.shadowColor = 'rgba(0,0,0,0.5)';
                        ctx.shadowBlur = 4;
                        ctx.fillText(btn.label, bx, by + slideFrom + btnRadius * pulse + 8);

                        ctx.restore();
                    });

                    // 5. Disclaimer Ã¢â‚¬â€ gradient ÃƒÂ§izgi + fade-in yazÃ„Â±
                    const discDelay = 3.5;
                    const discAlpha = Math.max(0, Math.min(1, (outroElapsed - discDelay) / 0.8));
                    const discH = Math.max(100, h * 0.15);
                    const discY = h - discH;

                    ctx.save();
                    ctx.globalAlpha = discAlpha;

                    // Gradient ÃƒÂ§izgi
                    const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
                    lineGrad.addColorStop(0, 'transparent');
                    lineGrad.addColorStop(0.3, 'rgba(225,29,72,0.5)');
                    lineGrad.addColorStop(0.7, 'rgba(225,29,72,0.5)');
                    lineGrad.addColorStop(1, 'transparent');
                    ctx.strokeStyle = lineGrad;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(0, discY);
                    ctx.lineTo(w, discY);
                    ctx.stroke();

                    // Disclaimer metni
                    ctx.fillStyle = 'rgba(241,245,249,0.8)';
                    const discFontSize = w > 800 ? 22 : 16;
                    ctx.font = `600 ${discFontSize}px 'Inter', Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const discTexts = {
                        tr: "Gemini bir yapay zeka modeli olduÃ„Å¸u iÃƒÂ§in kiÃ…Å¸iler de dahil olmak ÃƒÂ¼zere farklÃ„Â± konular hakkÃ„Â±nda yanlÃ„Â±Ã…Å¸ bilgi verebilir.",
                        en: "As an AI model, Gemini may provide inaccurate information about various topics, including people.",
                        fr: "En tant que modÃƒÂ¨le d'IA, Gemini peut fournir des informations inexactes sur divers sujets, y compris les personnes.",
                        de: "Als KI-Modell kann Gemini ungenaue Informationen zu verschiedenen Themen liefern, einschlieÃƒÅ¸lich Personen.",
                        es: "Como modelo de IA, Gemini puede proporcionar informaciÃƒÂ³n inexacta sobre diversos temas, incluidas las personas.",
                        ar: "Ã™Æ’Ã™â€ Ã™â€¦Ã™Ë†Ã˜Â°Ã˜Â¬ Ã˜Â°Ã™Æ’Ã˜Â§Ã˜Â¡ Ã˜Â§Ã˜ÂµÃ˜Â·Ã™â€ Ã˜Â§Ã˜Â¹Ã™Å Ã˜Å’ Ã™â€šÃ˜Â¯ Ã™Å Ã™Ë†Ã™ÂÃ˜Â± Gemini Ã™â€¦Ã˜Â¹Ã™â€Ã™Ë†Ã™â€¦Ã˜Â§Ã˜Âª Ã˜ÂºÃ™Å Ã˜Â± Ã˜Â¯Ã™â€šÃ™Å Ã™â€šÃ˜Â© Ã˜Â­Ã™Ë†Ã™â€ Ã™â€¦Ã™Ë†Ã˜Â§Ã˜Â¶Ã™Å Ã˜Â¹ Ã™â€¦Ã˜Â®Ã˜ÂªÃ™â€Ã™ÂÃ˜Â©Ã˜Å’ Ã˜Â¨Ã™â€¦Ã˜Â§ Ã™ÂÃ™Å  Ã˜Â°Ã™â€Ã™Æ’ Ã˜Â§Ã™â€Ã˜Â£Ã˜Â´Ã˜Â®Ã˜Â§Ã˜Âµ.",
                        ru: "ÄÅ¡ÄÂ°ÄÂº ÄÂ¼ÄÂ¾ÄÂ´ÄÂµÄÂ»Ã‘Å’ ÄËœÄËœ, Gemini ÄÂ¼ÄÂ¾ÄÂ¶ÄÂµÃ‘â€š ÄÂ¿Ã‘â‚¬ÄÂµÄÂ´ÄÂ¾Ã‘ÂÃ‘â€šÄÂ°ÄÂ²ÄÂ¸Ã‘â€šÃ‘Å’ ÄÂ½ÄÂµÃ‘â€šÄÂ¾Ã‘â€¡ÄÂ½Ã‘Æ’Ã‘Â ÄÂ¸ÄÂ½Ã‘â€ÄÂ¾Ã‘â‚¬ÄÂ¼ÄÂ°Ã‘â€ ÄÂ¸Ã‘Â ÄÂ¿ÄÂ¾ Ã‘â‚¬ÄÂ°ÄÂ·ÄÂ»ÄÂ¸Ã‘â€¡ÄÂ½Ã‘â€¹ÄÂ¼ Ã‘â€šÄÂµÄÂ¼ÄÂ°ÄÂ¼, ÄÂ²ÄÂºÄÂ»Ã‘ÂÃ‘â€¡ÄÂ°Ã‘Â ÄÂ»Ã‘ÂÄÂ´ÄÂµÄÂ¹."
                    };
                    const discTxt = discTexts[lang] || discTexts['tr'];
                    const discLines = RenderWorkerService.wrapText(ctx, discTxt, w * 0.88);
                    const discLh = discFontSize * 1.5;
                    const discTextStartY = discY + (discH / 2) - (((discLines.length - 1) * discLh) / 2);
                    discLines.forEach((line, idx) => {
                        ctx.fillText(line.trim(), cx, discTextStartY + idx * discLh);
                    });

                    ctx.restore();

                    // ParÃƒÂ§acÃ„Â±klarÃ„Â± temizle (sahne bittiÃ„Å¸inde)
                    if (progress > 0.95) window._outroParticles = [];
                }
                ctx.restore();
                globalRenderedSec += 1 / FPS; if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame(); await nextFrame();
            }
            // Ses bitene kadar bekle Ã¢â‚¬â€ sonraki sahne baÃ…Å¸lamasÃ„Â±n
            if (audioEndPromise) await audioEndPromise;
            addSystemLog(`Sahne ${isThumbnail ? 'kapak' : isOutro ? 'kapanÃ„Â±Ã…Å¸' : slideIndex} render edildi.`, 'success');
        };

        try {
            let bgmSource, bgmNode, masterGain;
            const loadBGM = async (musicId) => {
                if (bgmSource) { try { bgmSource.stop(); bgmSource.disconnect(); } catch(e){} }
                if (bgmNode) { try { bgmNode.disconnect(); } catch(e){} }
                if (masterGain) { try { masterGain.disconnect(); } catch(e){} }
                bgmSource = null; bgmNode = null; masterGain = null;
                let bgmInitialized = false;
                if (!musicId || musicId === 'none') return;
                const ambientTypes = ['rain', 'wind', 'waves', 'fire'];
                if (ambientTypes.includes(musicId)) {
                    const ambientObj = AmbientAudioService.getAmbientNode(audioCtx, musicId);
                    if (ambientObj) {
                        bgmSource = ambientObj.source;
                        bgmNode = ambientObj.gainNode;
                        masterGain = audioCtx.createGain();
                        masterGain.gain.value = 0.3;
                        bgmNode.connect(masterGain);
                        masterGain.connect(audioDest);
                    }
                } else if (musicId && (musicId.startsWith('local_') || musicId.startsWith('gd_'))) {
                    try {
                        const savedUrl = await AssetManagerService.loadMedia('CUSTOM_MUSIC');
                        if (savedUrl) {
                            const res = await fetch(savedUrl);
                            const buf = await audioCtx.decodeAudioData(await res.arrayBuffer());
                            if (!bgmInitialized) { bgmSource = audioCtx.createBufferSource(); bgmSource.buffer = buf; bgmSource.loop = true; bgmInitialized = true; }
                            masterGain = audioCtx.createGain();
                            masterGain.gain.value = 0.3;
                            bgmSource.connect(masterGain); masterGain.connect(audioDest); bgmSource.start(0);
                        } else {
                            const track = LOCAL_MUSIC_LIBRARY.find(m => m.id === musicId);
                            if (track) {
                                const res = await fetch(track.url);
                                const buf = await audioCtx.decodeAudioData(await (await res.blob()).arrayBuffer());
                                if (!bgmInitialized) { bgmSource = audioCtx.createBufferSource(); bgmSource.buffer = buf; bgmSource.loop = true; bgmInitialized = true; }
                                masterGain = audioCtx.createGain();
                                masterGain.gain.value = 0.3;
                                bgmSource.connect(masterGain); masterGain.connect(audioDest); bgmSource.start(0);
                            }
                        }
                    } catch (e) { console.warn("Yerel mÃƒÂ¼zik okunamadÃ„Â±", e); }
                } else {
                    try {
                        const track = await AssetManagerService.getMusicFromLib(musicId);
                        if (track && track.data) {
                            const raw = track.data.includes(',') ? track.data.split(',')[1] : track.data;
                            const byteString = atob(raw); const ab = new ArrayBuffer(byteString.length); const ia = new Uint8Array(ab);
                            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                            const blob = new Blob([ab], { type: 'audio/mpeg' });
                            const musicUrl = URL.createObjectURL(blob);
                            const res = await fetch(musicUrl);
                            const buf = await audioCtx.decodeAudioData(await res.arrayBuffer());
                            if (!bgmInitialized) { bgmSource = audioCtx.createBufferSource(); bgmSource.buffer = buf; bgmSource.loop = true; bgmInitialized = true; }
                            masterGain = audioCtx.createGain();
                            masterGain.gain.value = 0.3;
                            bgmSource.connect(masterGain); masterGain.connect(audioDest); bgmSource.start(0);
                        }
                    } catch (e) { console.warn("MÃƒÂ¼zik okunamadÃ„Â±", e); }
                }
            };
            let bgmInitialized = false;
            const initialBgmId = jobData.script._bgmId || preferences.ambientSound || 'none';
            addSystemLog(`Render BGM: ${initialBgmId} (script._bgmId: ${jobData.script._bgmId || 'yok'})`, 'info');
            await loadBGM(initialBgmId);

            const tImg = await NetworkUtils.loadImage(jobData.assets.thumbnail);
            const customOutroData = await AssetManagerService.loadMedia('CUSTOM_OUTRO');
            const outroImg = await NetworkUtils.loadImage(customOutroData || jobData.assets.outroImage);

            if (tImg) { RenderWorkerService.drawThumbnail(ctx, tImg, jobData.script.thumbnailText, w, h, fontFamily, jobData.config.sourceName, jobData.config); if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame(); for (let i = 0; i < 3; i++) await nextFrame(); }

            const recorder = new MediaRecorder(combinedStream, { mimeType, audioBitsPerSecond: 192000, videoBitsPerSecond: 2000000 });
            const chunks = []; recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); }; recorder.start(100);

            sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 10, text: 'Clickbait Kapak OluÃ…Å¸turuluyor...' });
            await renderScene(tImg, jobData.script.thumbnailText, jobData.assets.thumbnailAudio, rawKapakDur, true, false, null, 0, null, jobData.config.transition);

            // Sadece bloÃ„Å¸un 1. sahnesi sabit gÃƒÂ¶rsel kullanÃ„Â±r (S1 gÃƒÂ¶sterimi)
            // 2. ve 3. sahneler AI gÃƒÂ¶rseli kullanÃ„Â±r
            const slideIsCustom = [];
            const blocks = jobData.script.imageBlocks || [];
            let gIdx = 0;
            for (const block of blocks) {
                if (block.imageType === 'custom') {
                    slideIsCustom[gIdx] = true; // Sadece 1. sahne
                }
                gIdx += block.videoSlides.length;
            }

            const WINDOW_SIZE = 5;
                // Ã„Â°lk WINDOW_SIZE gÃƒÂ¶rseli ÃƒÂ¶nceden yÃƒÂ¼kle Ã¢â‚¬â€ sahneler arasÃ„Â± gecikmeyi ÃƒÂ¶nle
                const preloadedImages = [];
                for (let pi = 0; pi < Math.min(WINDOW_SIZE, jobData.script.videoSlides.length); pi++) {
                    preloadedImages[pi] = await NetworkUtils.loadImage(jobData.assets.images[pi]) || tImg;
                }
                for (let i = 0; i < jobData.script.videoSlides.length; i++) {
                if (useForceExact && globalRenderedSec >= limitSec) break;
                const slide = jobData.script.videoSlides[i];
                sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: Math.min(80, 20 + ((i + 1) / jobData.script.videoSlides.length) * 60), text: `Sahne ${i + 1} Render Ediliyor...` });
                // BAÃ…ÂLIKLAR sahnesi image yÃƒÂ¼kleme atla
                const isBasliklarScene = slide._isBasliklarList && slide._basliklar;
                // Ãƒâ€“nceden yÃƒÂ¼klenmiÃ…Å¸ gÃƒÂ¶rseli kullan, yoksa yÃƒÂ¼kle
                const sImg = isBasliklarScene ? null : (preloadedImages[i] || await NetworkUtils.loadImage(jobData.assets.images[i]) || tImg);
                // Sonraki gÃƒÂ¶rseli arka planda ÃƒÂ¶nceden yÃƒÂ¼kle
                const nextIdx = i + 1;
                if (nextIdx < jobData.script.videoSlides.length && !preloadedImages[nextIdx] && !jobData.script.videoSlides[nextIdx]._isBasliklarList) {
                    NetworkUtils.loadImage(jobData.assets.images[nextIdx]).then(img => { preloadedImages[nextIdx] = img || tImg; }).catch(() => {});
                }
                const isCustomImg = !!slideIsCustom[i];
                // BAÃ…ÂLIKLAR sahnesi Ã¢â‚¬â€ ÃƒÂ¶zel render
                    if (slide._isBasliklarList && slide._basliklar) {
                        const { exactDur, totalDur, audioEndPromise } = await playAudio(jobData.assets.audio[i], null, slide.spokenText);
                        const totalFrames = Math.max(1, Math.round(totalDur * FPS));
                        
                        for (let frame = 0; frame < totalFrames; frame++) {
                            if (useForceExact && globalRenderedSec >= limitSec) break;
                            const elapsedSec = frame / FPS;
                            
                            // Mor arka plan
                            const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
                            bgGrad.addColorStop(0, '#0a0015');
                            bgGrad.addColorStop(0.4, '#1a0533');
                            bgGrad.addColorStop(1, '#050010');
                            ctx.fillStyle = bgGrad;
                            ctx.fillRect(0, 0, w, h);
                            
                            // BaÃ…Å¸lÃ„Â±k
                            const titleFontSize = w > 800 ? 60 : 45;
                            ctx.font = `900 ${titleFontSize}px ${fontFamily}`;
                            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#FFD700';
                            ctx.shadowColor = 'rgba(255, 165, 0, 0.6)'; ctx.shadowBlur = 20;
                            ctx.fillText(slide.topText, cx, h * 0.08);
                            ctx.shadowBlur = 0;
                            
                            // KÃ„Â±rmÃ„Â±zÃ„Â± ÃƒÂ§izgi
                            ctx.strokeStyle = '#E30A17'; ctx.lineWidth = 3;
                            ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.12); ctx.lineTo(w * 0.9, h * 0.12); ctx.stroke();
                            
                            // BaÃ…Å¸lÃ„Â±klar
                            const basliklar = slide._basliklar;
                            let listFontSize = w > 800 ? 42 : 32;
                            ctx.font = `700 ${listFontSize}px ${fontFamily}`;
                            const availableH = h * 0.75;
                            let totalLines = 0;
                            basliklar.forEach(b => { totalLines += RenderWorkerService.wrapText(ctx, b.baslik, w * 0.85).length + 0.5; });
                            while (totalLines * listFontSize * 1.6 > availableH && listFontSize > 18) {
                                listFontSize -= 2; ctx.font = `700 ${listFontSize}px ${fontFamily}`;
                                totalLines = 0; basliklar.forEach(b => { totalLines += RenderWorkerService.wrapText(ctx, b.baslik, w * 0.85).length + 0.5; });
                            }
                            const finalLineHeight = listFontSize * 1.6;
                            let currentY = h * 0.16;
                            basliklar.forEach((b, idx) => {
                                ctx.font = `900 ${listFontSize}px ${fontFamily}`; ctx.fillStyle = '#E30A17'; ctx.textAlign = 'left';
                                ctx.fillText(`${idx + 1}.`, w * 0.05, currentY);
                                ctx.font = `700 ${listFontSize}px ${fontFamily}`; ctx.fillStyle = '#FFFFFF';
                                const lines = RenderWorkerService.wrapText(ctx, b.baslik, w * 0.8);
                                lines.forEach((line, lineIdx) => { ctx.fillText(line, w * 0.1, currentY + lineIdx * finalLineHeight); });
                                currentY += lines.length * finalLineHeight + finalLineHeight * 0.5;
                            });
                            
                            globalRenderedSec += 1 / FPS;
                            if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame();
                            await nextFrame();
                        }
                        if (audioEndPromise) await audioEndPromise;
                        addSystemLog(`BAÃ…ÂLIKLAR sahnesi render edildi.`, 'success');
                    } else if (slide._isKaynaklar && slide._kaynaklar) {
                        // KAYNAKLAR sahnesi Ã¢â‚¬â€ ÃƒÂ¶zel render
                        const { exactDur, totalDur, audioEndPromise } = await playAudio(jobData.assets.audio[i], null, slide.spokenText);
                        const totalFrames = Math.max(1, Math.round(totalDur * FPS));
                        
                        for (let frame = 0; frame < totalFrames; frame++) {
                            if (useForceExact && globalRenderedSec >= limitSec) break;
                            
                            // Siyah arka plan
                            ctx.fillStyle = '#030712';
                            ctx.fillRect(0, 0, w, h);
                            
                            // BaÃ…Å¸lÃ„Â±k
                            ctx.font = `900 ${w > 800 ? 50 : 38}px ${fontFamily}`;
                            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#E30A17';
                            ctx.fillText('KAYNAKLAR', cx, h * 0.06);
                            
                            // Ãƒâ€¡izgi
                            ctx.strokeStyle = '#E30A17'; ctx.lineWidth = 2;
                            ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.09); ctx.lineTo(w * 0.9, h * 0.09); ctx.stroke();
                            
                            // Kaynaklar listesi
                            const kaynaklar = slide._kaynaklar;
                            let listFontSize = w > 800 ? 28 : 22;
                            ctx.font = `700 ${listFontSize}px ${fontFamily}`;
                            let currentY = h * 0.13;
                            
                            kaynaklar.forEach((k, idx) => {
                                // BaÃ…Å¸lÃ„Â±k
                                ctx.fillStyle = '#FFD700';
                                ctx.textAlign = 'left';
                                ctx.font = `700 ${listFontSize}px ${fontFamily}`;
                                ctx.fillText(`${idx + 1}. ${k.baslik}`, w * 0.05, currentY);
                                currentY += listFontSize * 1.2;
                                
                                // URL
                                ctx.fillStyle = '#60A5FA';
                                ctx.font = `400 ${listFontSize * 0.8}px ${fontFamily}`;
                                ctx.fillText(k.url, w * 0.08, currentY);
                                currentY += listFontSize * 1.0;
                                
                                // Tarih (varsa)
                                if (k.tarih) {
                                    ctx.fillStyle = '#9CA3AF';
                                    ctx.font = `400 ${listFontSize * 0.7}px ${fontFamily}`;
                                    ctx.fillText(k.tarih, w * 0.08, currentY);
                                    currentY += listFontSize * 0.8;
                                }
                                
                                currentY += listFontSize * 0.5; // BoÃ…Å¸luk
                            });
                            
                            globalRenderedSec += 1 / FPS;
                            if (videoTrack && videoTrack.requestFrame) videoTrack.requestFrame();
                            await nextFrame();
                        }
                        if (audioEndPromise) await audioEndPromise;
                        addSystemLog('KAYNAKLAR sahnesi render edildi.', 'success');
                    } else {
                        await renderScene(sImg, slide.spokenText, jobData.assets.audio[i], rawSlideSecs[i], false, false, slide.topText, i + 1, jobData.script.chartData, jobData.config.transition, isCustomImg, slide._zoomCoords || null);
                    }
                // Sliding window: serbest bÃ„Â±rakÃ„Â±lan gÃƒÂ¶rselleri temizle
                if (i >= WINDOW_SIZE) {
                    const releaseIdx = i - WINDOW_SIZE;
                    jobData.assets.images[releaseIdx] = null;
                    jobData.assets.audio[releaseIdx] = null;
                }
            }

            // TÃƒÂ¼m slaytlarÃ„Â±n spokenText'inden son sÃƒÂ¶zÃƒÂ¼ ÃƒÂ§Ã„Â±kar (tekrar ÃƒÂ¶nlemi)
            if (jobData.script.sonSoz && jobData.script.videoSlides.length > 0) {
                const sonSozRegex = new RegExp(jobData.script.sonSoz.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                let removedCount = 0;
                jobData.script.videoSlides.forEach(function(slide) {
                    if (slide.spokenText && sonSozRegex.test(slide.spokenText)) {
                        slide.spokenText = slide.spokenText.replace(sonSozRegex, '').replace(/\s+/g, ' ').trim();
                        removedCount++;
                    }
                });
                if (removedCount > 0) addSystemLog(`Son sÃƒÂ¶z ${removedCount} slayttan ÃƒÂ§Ã„Â±karÃ„Â±ldÃ„Â± (tekrar ÃƒÂ¶nlemi).`, 'info');
            }

            // Son sÃƒÂ¶z sahnesi Ã¢â‚¬â€ daima render et (yorum varsa yorum, yoksa son sÃƒÂ¶z)
            const hasYorumForScene = jobData.config.yorum && jobData.config.yorum.trim().length > 0;
            if ((jobData.script.sonSoz || hasYorumForScene) && (!useForceExact || globalRenderedSec < limitSec)) {
                sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 85, text: 'Son SÃƒÂ¶z Sahnesi Render Ediliyor...' });
                const isSingleMedia = (jobData.imageQueue || []).length <= 1;
                await renderSonSozScene(jobData.script.sonSoz || '', jobData.assets.sonSozAudio, rawSonSozDur, isSingleMedia);
            }
            if (!useForceExact || globalRenderedSec < limitSec) { sysEventBus.emit('PROGRESS', { step: 'RENDER', percent: 90, text: 'KapanÃ„Â±Ã…Å¸ Render Ediliyor...' }); await renderScene(outroImg, jobData.script.lastQuote, jobData.assets.outroAudio, rawOutroDur, false, true, null, 99, null, jobData.config.transition); }

            if (bgmSource) { try { bgmSource.stop(); bgmSource.disconnect(); } catch(e){} } if (bgmNode) { try { bgmNode.disconnect(); } catch(e){} } if (masterGain) { try { masterGain.disconnect(); } catch(e){} }
            silentOsc.stop(); silentOsc.disconnect(); keepAliveOsc.stop(); keepAliveOsc.disconnect(); keepAliveGain.disconnect();

            try { const totalFrames = Math.floor(rawCushion * scaleFactor * FPS); for (let i = 0; i < totalFrames; i++) { if (useForceExact && globalRenderedSec >= limitSec) break; globalRenderedSec += 1 / FPS; await nextFrame(); } } catch (e) { console.warn("KapanÃ„Â±Ã…Å¸ bekleme hatasÃ„Â±:", e); }

            timerWorker.postMessage('stop'); timerWorker.terminate();

            return new Promise((resolve, reject) => {
                recorder.onstop = () => { const blob = new Blob(chunks, { type: mimeType }); if (blob.size === 0) return reject(new Error("Video oluÃ…Å¸turulamadÃ„Â± (0 Bayt).")); resolve(URL.createObjectURL(blob)); };
                if (recorder.state !== 'inactive') { try { recorder.requestData(); } catch (e) { } setTimeout(() => recorder.stop(), 100); } else resolve(URL.createObjectURL(new Blob(chunks, { type: mimeType })));
            });
        } catch (e) { if (typeof timerWorker !== 'undefined') timerWorker.terminate(); throw new Error(`Render failed: ${e.message}`); }
    }
};

class WorkflowCoordinator {
    constructor() { this.jobId = null; this.state = {}; }
    async updateProgress(percent, text, step) { const safePercent = Math.min(100, Math.max(0, Math.round(percent))); this.state.progress = safePercent; this.state.statusText = text; await AssetManagerService.saveJobState(this.state); sysEventBus.emit('PROGRESS', { step, percent: safePercent, text }); }
    async startWorkflow(inputData, inputType, config, preferences, canvasRef) {
        this.jobId = "job_" + Date.now();
        const customImages = config.customSceneImages || [];
        const uploadedMedia = (inputType === 'media' && Array.isArray(inputData)) ? inputData : [];
        const allImages = [];
        if (customImages.length > 0 && uploadedMedia.length > 0) {
            // Her sabit gÃƒÂ¶rsel iÃƒÂ§in 1 medya eÃ…Å¸leÃ…Å¸tir: S1+M1, S2+M2, S3+M3
            const pairCount = Math.min(customImages.length, uploadedMedia.length, 10);
            for (let i = 0; i < pairCount; i++) {
                allImages.push({ type: 'custom', data: customImages[i], mediaItem: uploadedMedia[i] });
            }
            addSystemLog(`EÃ…Å¸leÃ…Å¸tirme: ${pairCount} blok (S1+M1, S2+M2, ...)`, 'info');
        } else if (customImages.length > 0) {
            for (const img of customImages) allImages.push({ type: 'custom', data: img });
        } else {
            for (const m of uploadedMedia) allImages.push({ type: 'uploaded', data: m });
        }
        this.state = { jobId: this.jobId, status: 'INIT', inputData, inputType, config, preferences,
            script: { imageBlocks: [], thumbnailText: '', lastQuote: '', sonSoz: '', thumbnailImagePrompt: '', _isGuzelSoz: false },
            assets: { images: [], audio: [], thumbnail: null, thumbnailAudio: null, sonSozAudio: null, yorumAudio: null, outroAudio: null, blackoutAudio: null },
            imageQueue: allImages, processedImageCount: 0, progress: 0 };
        await AssetManagerService.saveJobState(this.state);
        return this.resumeWorkflow(canvasRef);
    }
    async resumeWorkflow(canvasRef) {
        try {
            if (!this.state || !this.state.jobId) { const saved = await AssetManagerService.getPendingJob(); if (saved) this.state = saved; else throw new Error("Bekleyen iÃ…Å¸lem bulunamadÃ„Â±."); }
            sysEventBus.emit('WORKFLOW_STATE', { status: 'RUNNING', job: this.state });

            if (this.state.status === 'INIT') {
                // GÃƒÂ¼zel sÃƒÂ¶z modu Ã¢â€ â€™ eski akÃ„Â±Ã…Å¸ (deÃ„Å¸iÃ…Å¸medi)
                if (this.state.config.tip === 'guzel_soz' || this.state.config.tip === 'iddia_analizi') {
                    let startT = performance.now();
                    const tipLabel = 'GÃƒÂ¼zel SÃƒÂ¶z';
                    await this.updateProgress(10, `${tipLabel} yapÃ„Â±lÃ„Â±yor...`, 'LOGIC');
                    const script = await LogicEngineService.analyzeContent(this.state.inputData, this.state.inputType, this.state.config);
                    this.state.script = script;
                    this.state.status = 'GENERATING_ASSETS';
                    await AssetManagerService.saveJobState(this.state);
                    addSystemLog(`${tipLabel} tamamlandÃ„Â± (${((performance.now() - startT) / 1000).toFixed(1)}s).`, 'success');
                } else {
                    // YENÃ„Â° AKIÃ…Â: Her gÃƒÂ¶rsel iÃƒÂ§in sÃ„Â±rayla sahne ÃƒÂ¼ret
                    const queue = this.state.imageQueue || [];
                    const totalImages = queue.length;
                    if (totalImages === 0) throw new Error("Ã„Â°Ã…Å¸lenecek gÃƒÂ¶rsel bulunamadÃ„Â±. LÃƒÂ¼tfen en az bir sabit gÃƒÂ¶rsel veya medya yÃƒÂ¼kleyin.");

                    addSystemLog(`Toplam ${totalImages} gÃƒÂ¶rsel iÃ…Å¸lenecek.`, 'info');
                    let previousContext = "";

                    for (let i = this.state.processedImageCount || 0; i < totalImages; i++) {
                        const imgItem = queue[i];
                        const blockNum = i + 1;
                        await this.updateProgress(5 + (blockNum / totalImages) * 35, `Blok ${blockNum}/${totalImages} analiz ediliyor...`, 'LOGIC');

                        let blockResult;
                        try {
                            if (imgItem.type === 'custom' && imgItem.mediaItem) {
                                blockResult = await LogicEngineService.analyzeContentForImage([imgItem.mediaItem], 'media', this.state.config, i, totalImages, previousContext);
                            } else if (imgItem.type === 'custom' && imgItem.data) {
                                blockResult = await LogicEngineService.analyzeContentForImage([{ data: imgItem.data, type: 'image/png' }], 'media', this.state.config, i, totalImages, previousContext);
                            } else if (imgItem.type === 'uploaded' && imgItem.data) {
                                blockResult = await LogicEngineService.analyzeContentForImage([imgItem.data], 'media', this.state.config, i, totalImages, previousContext);
                            } else {
                                blockResult = await LogicEngineService.analyzeContentForImage(this.state.inputData, this.state.inputType, this.state.config, i, totalImages, previousContext);
                            }
                        } catch (e) {
                            addSystemLog(`Blok ${blockNum} analiz hatasÃ„Â±: ${e.message}`, 'error');
                            blockResult = { videoSlides: [], thumbnailText: '', thumbnailImagePrompt: '' };
                        }

                        if (i === 0) {
                            if (!this.state.script.thumbnailText) { this.state.script.thumbnailText = blockResult.thumbnailText || ''; }
                            this.state.script.thumbnailImagePrompt = blockResult.thumbnailImagePrompt || '';
                        }
                        if (blockResult.sonSoz) this.state.script.sonSoz = blockResult.sonSoz;
                        if (blockResult.kaynaklar && blockResult.kaynaklar.length > 0) {
                            this.state.script._kaynaklar = blockResult.kaynaklar;
                            addSystemLog(`${blockResult.kaynaklar.length} kaynak eklendi.`, 'success');
                        }
                        if (blockResult.lastQuote) this.state.script.lastQuote = blockResult.lastQuote;

                        // Normal slide'larÃ„Â± her zaman ekle (baÃ…Å¸lÃ„Â±k olsa bile)
                        this.state.script.imageBlocks.push({
                            imageIndex: i,
                            imageType: imgItem.type,
                            customImage: imgItem.type === 'custom' ? imgItem.data : null,
                            videoSlides: blockResult.videoSlides || []
                        });

                        // BaÃ…Å¸lÃ„Â±klarÃ„Â± topla Ã¢â‚¬â€ sadece birden fazla gÃƒÂ¶rsel varsa
                        if (queue.length > 1 && blockResult.gazeteBasliklari && blockResult.gazeteBasliklari.length > 0) {
                            if (!this.state.script._allBasliklar) this.state.script._allBasliklar = [];
                            this.state.script._allBasliklar.push(...blockResult.gazeteBasliklari);
                            addSystemLog(`GÃƒÂ¶rsel ${blockNum}: ${blockResult.gazeteBasliklari.length} baÃ…Å¸lÃ„Â±k ÃƒÂ§Ã„Â±karÃ„Â±ldÃ„Â±.`, 'success');
                        }

                        const slideTexts = (blockResult.videoSlides || []).map(s => s.spokenText).join(' ');
                        previousContext = `Blok ${blockNum}: ${slideTexts.substring(0, 200)}...`;

                        this.state.processedImageCount = i + 1;
                        await AssetManagerService.saveJobState(this.state);
                        addSystemLog(`Blok ${blockNum}/${totalImages} tamamlandÃ„Â± (${(blockResult.videoSlides || []).length} sahne).`, 'success');
                    }

                    // SENARYO KONTROLÃƒÅ“: BaÃ…Å¸lÃ„Â±klar sayfasÃ„Â± oluÃ…Å¸turulsun mu?
                    const allBasliklar = this.state.script._allBasliklar || [];
                    const totalImages2 = queue.length;

                    if (allBasliklar.length >= 1 && queue.length > 1) {
                        // SENARYO 2 veya 3: TÃƒÅ“M baÃ…Å¸lÃ„Â±klardan ortak clickbait baÃ…Å¸lÃ„Â±k oluÃ…Å¸tur
                        const allHeadlines = allBasliklar.map(b => b.baslik).join('. ');
                        try {
                            const clickbaitText = await callAI(
                                'Sen bir sosyal medya editÃƒÂ¶rÃƒÂ¼sÃƒÂ¼n. SADECE baÃ…Å¸lÃ„Â±k ÃƒÂ¼retirsin, baÃ…Å¸ka metin yazmazsÃ„Â±n.',
                                `Bu haber baÃ…Å¸lÃ„Â±klarÃ„Â±ndan en etkileyici, clickbait bir tek baÃ…Å¸lÃ„Â±k oluÃ…Å¸tur (maksimum 10 kelime, bÃƒÂ¼yÃƒÂ¼k harfler, sansasyonel):\n\n${allHeadlines}\n\nSADECE baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â± yaz.`,
                                { temperature: 0.9, max_tokens: 60 }
                            );
                            if (clickbaitText && clickbaitText.trim().length > 3) {
                                this.state.script.thumbnailText = trUpper(clickbaitText.trim());
                                addSystemLog(`Ortak clickbait baÃ…Å¸lÃ„Â±k: "${clickbaitText}"`, 'success');
                            }
                        } catch (e) {
                            addSystemLog(`Clickbait API hatasÃ„Â±: ${e.message}`, 'warn');
                        }
                        
                        // Fallback: API baÃ…Å¸arÃ„Â±sÃ„Â±z olursa baÃ…Å¸lÃ„Â±klardan clickbait oluÃ…Å¸tur
                        if (!this.state.script.thumbnailText || this.state.script.thumbnailText.length < 5) {
                            var headlines = allBasliklar.map(function(b) { return b.baslik; });
                            var longest = headlines.reduce(function(a, b) { return a.length > b.length ? a : b; }, '');
                            this.state.script.thumbnailText = trUpper(longest);
                            addSystemLog('Fallback clickbait: ' + longest, 'info');
                        }

                        // BAÃ…ÂLIKLAR sayfasÃ„Â± + her baÃ…Å¸lÃ„Â±k iÃƒÂ§in ayrÃ„Â± sahne
                        const sourceLabel = trUpper(this.state.config?.sourceName || 'Gazete');
                        const basliklarList = allBasliklar.slice(0, 10).map(b => b.baslik).join('. '); // Max 10 baÃ…Å¸lÃ„Â±k
                        const ozetSpoken = `${sourceLabel} baÃ…Å¸lÃ„Â±klarÃ„Â±nda bugÃƒÂ¼n ${allBasliklar.length} ÃƒÂ¶nemli baÃ…Å¸lÃ„Â±k var. ${basliklarList}.`;

                        // BAÃ…ÂLIKLAR sayfasÃ„Â±nÃ„Â± EN BAÃ…ÂA ekle (thumbnail'dan sonra)
                        this.state.script.imageBlocks.unshift({
                            imageIndex: 0,
                            imageType: 'ai',
                            customImage: null,
                            videoSlides: [{
                                topText: `${sourceLabel} BAÃ…ÂLIKLARI`,
                                spokenText: ozetSpoken,
                                imagePrompts: [this.state.script.thumbnailImagePrompt || 'Turkish newspaper front page'],
                                _isBasliklarList: true,
                                _basliklar: allBasliklar
                            }]
                        });

                        // Her baÃ…Å¸lÃ„Â±k iÃƒÂ§in ayrÃ„Â± sahne ekle
                        allBasliklar.forEach((baslik, idx) => {
                            this.state.script.imageBlocks.push({
                                imageIndex: 0,
                                imageType: 'custom',
                                customImage: (typeof queue[0]?.data === "string" ? queue[0]?.data : null) || (typeof queue[0]?.customImage === "string" ? queue[0]?.customImage : null),
                                videoSlides: [{
                                    topText: trUpper(baslik.baslik),
                                    spokenText: `${baslik.baslik}. ${baslik.aciklama}.`,
                                    imagePrompts: [],
                                    
                                }]
                            });
                        });

                        addSystemLog(`BAÃ…ÂLIKLAR sayfasÃ„Â± oluÃ…Å¸turuldu: ${allBasliklar.length} baÃ…Å¸lÃ„Â±k.`, 'success');
                    } else {
                        // SENARYO 1: Tek baÃ…Å¸lÃ„Â±k, baÃ…Å¸ka gÃƒÂ¶rsel yok Ã¢â€ â€™ BAÃ…ÂLIKLAR sayfasÃ„Â± yok
                        addSystemLog('Tek baÃ…Å¸lÃ„Â±k, BAÃ…ÂLIKLAR sayfasÃ„Â± atlandÃ„Â±.', 'info');
                    }

                    // Kaynaklar sahnesi oluÃ…Å¸tur (Son SÃƒÂ¶z'den ÃƒÂ¶nce) Ã¢â‚¬â€ haber modunda atla
                    if (this.state.config.tip !== 'haber' && this.state.script._kaynaklar && this.state.script._kaynaklar.length > 0) {
                        const kaynaklarText = this.state.script._kaynaklar.map(k => `${k.baslik}: ${k.url}`).join('\n');
                        const kaynaklarSpoken = "Kaynaklar ve referanslar. " + this.state.script._kaynaklar.map(k => k.baslik).join('. ') + ".";
                        this.state.script.imageBlocks.push({
                            imageIndex: 0,
                            imageType: 'ai',
                            customImage: null,
                            videoSlides: [{
                                topText: 'KAYNAKLAR',
                                spokenText: kaynaklarSpoken,
                                imagePrompts: ['A clean list of official sources and references on dark background'],
                                _isKaynaklar: true,
                                _kaynaklar: this.state.script._kaynaklar
                            }]
                        });
                        addSystemLog('Kaynaklar sahnesi eklendi.', 'success');
                    }

                    // Kaynaklar sahnesi (Son SÃƒÂ¶z'den ÃƒÂ¶nce)
                    if (this.state.script && this.state.script.iddialar && this.state.script.iddialar.length > 0) {
                        var allKaynaklar = [];
                        this.state.script.iddialar.forEach(function(iddia) {
                            if (iddia.kanitlar) {
                                iddia.kanitlar.forEach(function(k) {
                                    if (k.kaynak && allKaynaklar.indexOf(k.kaynak) === -1) {
                                        allKaynaklar.push(k.kaynak);
                                    }
                                });
                            }
                        });
                        if (allKaynaklar.length > 0) {
                            var kaynaklarSpoken = "Kaynaklar ve referanslar. " + allKaynaklar.join(". ") + ".";
                            this.state.script.imageBlocks.push({
                                imageIndex: 0, imageType: 'ai', customImage: null,
                                videoSlides: [{ topText: 'KAYNAKLAR', spokenText: kaynaklarSpoken, imagePrompts: ['A clean list of official sources and references on dark background, professional infographic style'] }]
                            });
                            addSystemLog('Kaynaklar sahnesi eklendi: ' + allKaynaklar.length + ' kaynak.', 'success');
                        }
                    }

                    // TÃƒÂ¼m bloklarÃ„Â± dÃƒÂ¼z videoSlides dizisine ÃƒÂ§evir// TÃƒÂ¼m bloklarÃ„Â± dÃƒÂ¼z videoSlides dizisine ÃƒÂ§evir (render iÃƒÂ§in)
                    this.state.script.videoSlides = [];
                    for (const block of this.state.script.imageBlocks) {
                        this.state.script.videoSlides.push(...block.videoSlides);
                    }
                    addSystemLog(`INIT tamamlandÃ„Â±: ${this.state.script.imageBlocks.length} blok, ${this.state.script.videoSlides.length} sahne.`, 'success');
                    addSystemLog(`Blok detaylarÃ„Â±: ${this.state.script.imageBlocks.map((b, i) => `B${i + 1}=${b.videoSlides.length}s`).join(', ')}`, 'info');

                    this.state.status = 'GENERATING_ASSETS';
                    await AssetManagerService.saveJobState(this.state);
                }
            }
            if (this.state.status === 'GENERATING_ASSETS') {
                await this.updateProgress(30, 'Medya ve Sesler Sentezleniyor...', 'ASSETS');
                const imgStyle = this.state.config.imageStyle || 'cinematic'; const imgRes = this.state.config.resolution || '4K';

                if (this.state.script._isGuzelSoz) {
                    addSystemLog('GÃƒÂ¼zel sÃƒÂ¶z modu: gÃƒÂ¶rseller ve ses ÃƒÂ¼retiliyor...', 'info');
                    const slideCount = this.state.script._sceneCount || 3;
                    const quoteTextForImage = this.state.script.videoSlides[0]?.spokenText || "";
                    const emotionForImage = this.state.script._emotion || analyzeQuoteEmotion(quoteTextForImage);
                    const realUrls = this.state.script._realImageUrls || [];

                    for (let i = 0; i < slideCount; i++) {
                        const slide = this.state.script.videoSlides[i];
                        if (!this.state.assets.images[i]) {
                            try {
                                // GerÃƒÂ§ek gÃƒÂ¶rsel varsa onu kullan (AtatÃƒÂ¼rk vb.)
                                if (realUrls[i]) {
                                    addSystemLog(`  GÃƒÂ¶rsel ${i + 1}: GerÃƒÂ§ek gÃƒÂ¶rsel kullanÃ„Â±lÃ„Â±yor...`, 'info');
                                    this.state.assets.images[i] = realUrls[i];
                                } else {
                                    this.state.assets.images[i] = await MediaSynthesisService.generateImage(
                                        slide.imagePrompts?.[0] || "Artistic background",
                                        imgStyle, imgRes, true, emotionForImage, quoteTextForImage
                                    );
                                }
                                addSystemLog(`  GÃƒÂ¶rsel ${i + 1}/${slideCount} tamamlandÃ„Â±.`, 'success');
                            } catch (e) {
                                addSystemLog(`  GÃƒÂ¶rsel ${i + 1} hatasÃ„Â±, fallback kullanÃ„Â±lÃ„Â±yor.`, 'warn');
                                this.state.assets.images[i] = this.state.assets.thumbnail;
                            }
                        }
                    }

                    if (!this.state.assets.audio[0]) {
                        this.state.assets.audio[0] = await MediaSynthesisService.generateAudio(
                            this.state.script.videoSlides[0].spokenText,
                            this.state.preferences.narratorVoice
                        );
                    }
                    if (!this.state.assets.thumbnail) this.state.assets.thumbnail = this.state.assets.images[0];

                    const allMusic = await AssetManagerService.getAllMusicFromLib();
                    if (allMusic.length > 0) {
                        const matchedTrack = matchMusicToEmotion(emotionForImage, allMusic);
                        const chosenTrack = matchedTrack || allMusic[Math.floor(Math.random() * allMusic.length)];
                        addSystemLog(`MÃƒÂ¼zik seÃƒÂ§ildi: ${chosenTrack.name} (duygu: ${emotionForImage})`, 'success');
                        this.state.script._bgmId = chosenTrack.id;
                        this.state.script._bgmName = chosenTrack.name;
                        this.state.preferences.ambientSound = chosenTrack.id;
                        this.state.preferences.customBgMusicName = chosenTrack.name;
                        this.state.preferences.customBgMusicId = chosenTrack.id;
                    } else {
                        addSystemLog('MÃƒÂ¼zik kÃƒÂ¼tÃƒÂ¼phanesi boÃ…Å¸, mÃƒÂ¼zik eklenmedi.', 'warn');
                    }

                    await this.updateProgress(70, 'GÃƒÂ¼zel sÃƒÂ¶z hazÃ„Â±r...', 'ASSETS');
                } else {
                if (!this.state.assets.thumbnail) { addSystemLog('Kapak resmi ÃƒÂ§izimi...', 'info'); this.state.assets.thumbnail = await MediaSynthesisService.generateImage(this.state.script.thumbnailImagePrompt || "Dramatic news event", imgStyle, imgRes); addSystemLog('Kapak resmi tamamlandÃ„Â±.', 'success'); }

                const customImages = this.state.config.customSceneImages || [];
                this.state.customImageCount = customImages.length;

                // Sabit gÃƒÂ¶rsel SADECE bloÃ„Å¸un 1. sahnesine atanÃ„Â±r (S1 gÃƒÂ¶sterimi)
                // 2. ve 3. sahneler AI tarafÃ„Â±ndan ÃƒÂ¼retilir (M1'i anlatan gÃƒÂ¶rseller)
                const blocks = this.state.script.imageBlocks || [];
                let globalIdx = 0;
                for (let b = 0; b < blocks.length; b++) {
                    const block = blocks[b];
                    const blockSlideCount = block.videoSlides.length;
                    const blockCustomImg = block.customImage || customImages[b];
                    if (block.imageType === 'custom' && blockCustomImg) {
                        this.state.assets.images[globalIdx] = blockCustomImg;
                        addSystemLog(`Blok ${b + 1}: Sabit gÃƒÂ¶rsel 1. sahneye atandÃ„Â±. Kalan ${blockSlideCount - 1} sahne AI ÃƒÂ¼retilecek.`, 'info');
                    }
                    globalIdx += blockSlideCount;
                }

                const CHUNK_SIZE = 3;
                addSystemLog(`ASSETS fase: ${this.state.script.videoSlides.length} sahne, ${CHUNK_SIZE}'lÃƒÂ¼ chunk.`, 'info');
                for (let i = 0; i < this.state.script.videoSlides.length; i += CHUNK_SIZE) {
                    const chunk = this.state.script.videoSlides.slice(i, i + CHUNK_SIZE);
                    addSystemLog(`Sahneler ${i + 1}-${Math.min(i + CHUNK_SIZE, this.state.script.videoSlides.length)} iÃ…Å¸leniyor...`, 'info');
                    const chunkPromises = chunk.map(async (slide, idx) => {
                        const actualIndex = i + idx;
                        const computedPrompt = slide.imagePrompts?.[0] || slide.topText || slide.spokenText || "News event";
                        const imgPromise = this.state.assets.images[actualIndex] ? Promise.resolve(this.state.assets.images[actualIndex]) : MediaSynthesisService.generateImage(computedPrompt, imgStyle, imgRes).then(res => res || this.state.assets.thumbnail);
                        const audPromise = this.state.assets.audio[actualIndex] ? Promise.resolve(this.state.assets.audio[actualIndex]) : MediaSynthesisService.generateAudio(slide.spokenText, this.state.preferences.narratorVoice);
                        const [imgResData, audResData] = await Promise.all([imgPromise, audPromise]);
                        this.state.assets.images[actualIndex] = imgResData;
                        this.state.assets.audio[actualIndex] = audResData;
                    });
                    await Promise.all(chunkPromises);
                    const currentProgress = Math.min(i + CHUNK_SIZE, this.state.script.videoSlides.length);
                    await this.updateProgress(40 + (currentProgress / this.state.script.videoSlides.length) * 30, `Sahneler ${currentProgress}/${this.state.script.videoSlides.length}...`, 'ASSETS');
                }
                }

                const extraAudioPromises = [];
                // Clickbait seslendirme
                if (!this.state.assets.thumbnailAudio) {
                    // Clickbait seslendirme: tarih + kaynak adÃ„Â± + baÃ…Å¸lÃ„Â±k
                    const now = new Date();
                    const dateLocale = ({ tr:'tr-TR', en:'en-US', fr:'fr-FR', de:'de-DE', es:'es-ES', ar:'ar-SA', ru:'ru-RU' })[this.state.config?.language || 'tr'] || 'tr-TR';
                    const dateStr = now.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
                    const dayStr = now.toLocaleDateString(dateLocale, { weekday: 'long' });
                    const sourceName = this.state.config?.sourceName || '';
                    const headline = this.state.script.thumbnailText || '';
                    const clickbaitText = [dateStr + " " + dayStr, sourceName, headline].filter(Boolean).join('. ') + '.';
                    extraAudioPromises.push(MediaSynthesisService.generateAudio(clickbaitText, this.state.preferences.narratorVoice).then(res => { this.state.assets.thumbnailAudio = res; addSystemLog('Clickbait seslendirme hazÃ„Â±r: ' + clickbaitText.substring(0, 60) + '...', 'success'); }));
                }
                if (!this.state.script._isGuzelSoz) {
                    if (this.state.script.sonSoz && !this.state.assets.sonSozAudio) extraAudioPromises.push(MediaSynthesisService.generateAudio(this.state.script.sonSoz, this.state.preferences.narratorVoice).then(res => { this.state.assets.sonSozAudio = res; }));
                    if (this.state.config.yorum && this.state.config.yorum.trim() && !this.state.assets.yorumAudio) extraAudioPromises.push(MediaSynthesisService.generateAudio(this.state.config.yorum, this.state.preferences.narratorVoice).then(res => { this.state.assets.yorumAudio = res; }));
                    if (!this.state.assets.outroAudio) {
                        const quotePrefix = this.state.script.lastQuote ? `${this.state.script.lastQuote} ` : "";
                        let defaultOutroText = "Abone olmayÃ„Â±, beÃ„Å¸enmeyi ve paylaÃ…Å¸mayÃ„Â± ihmal etmeyin.";
                        if (this.state.config.language === 'en') defaultOutroText = "Don't forget to subscribe, like, and share.";
                        else if (this.state.config.language === 'fr') defaultOutroText = "N'oubliez pas de vous abonner, d'aimer et de partager.";
                        else if (this.state.config.language === 'de') defaultOutroText = "Vergessen Sie nicht zu abonnieren, zu liken und zu teilen.";
                        else if (this.state.config.language === 'es') defaultOutroText = "No olvides suscribirte, dar me gusta y compartir.";
                        else if (this.state.config.language === 'ar') defaultOutroText = "Ã™â€Ã˜Â§ Ã˜ÂªÃ™â€ Ã˜Â³ Ã˜Â§Ã™â€Ã˜Â§Ã˜Â´Ã˜ÂªÃ˜Â±Ã˜Â§Ã™Æ’ Ã™Ë†Ã˜Â§Ã™â€Ã˜Â¥Ã˜Â¹Ã˜Â¬Ã˜Â§Ã˜Â¨ Ã™Ë†Ã˜Â§Ã™â€Ã™â€¦Ã˜Â´Ã˜Â§Ã˜Â±Ã™Æ’Ã˜Â©.";
                        else if (this.state.config.language === 'ru') defaultOutroText = "ÄÂÄÂµ ÄÂ·ÄÂ°ÄÂ±Ã‘Æ’ÄÂ´Ã‘Å’Ã‘â€šÄÂµ ÄÂ¿ÄÂ¾ÄÂ´ÄÂ¿ÄÂ¸Ã‘ÂÄÂ°Ã‘â€šÃ‘Å’Ã‘ÂÃ‘Â, ÄÂ¿ÄÂ¾Ã‘ÂÃ‘â€šÄÂ°ÄÂ²ÄÂ¸Ã‘â€šÃ‘Å’ ÄÂ»ÄÂ°ÄÂ¹ÄÂº.";
                        extraAudioPromises.push(MediaSynthesisService.generateAudio(`${quotePrefix}${defaultOutroText}`, this.state.preferences.narratorVoice).then(res => { this.state.assets.outroAudio = res; }));
                    }
                }
                await Promise.all(extraAudioPromises);
                const imgCount = this.state.assets.images.filter(Boolean).length;
                const audCount = this.state.assets.audio.filter(Boolean).length;
                addSystemLog(`ASSETS tamamlandÃ„Â±: ${imgCount}/${this.state.script.videoSlides.length} gÃƒÂ¶rsel, ${audCount}/${this.state.script.videoSlides.length} ses.`, imgCount === this.state.script.videoSlides.length ? 'success' : 'warn');
                this.state.status = 'READY_TO_RENDER';
                await AssetManagerService.saveJobState(this.state);
            }
            if (this.state.status === 'READY_TO_RENDER') {
                await this.updateProgress(80, 'Video Paketleniyor...', 'RENDER');
                const renderResult = await RenderWorkerService.executeRender(this.state, canvasRef.current, this.state.preferences);
                this.state.status = 'COMPLETED'; this.state.videoUrl = typeof renderResult === 'string' ? renderResult : renderResult.url;
                await AssetManagerService.saveJobState(this.state); await AssetManagerService.clearJob(this.jobId);
                sysEventBus.emit('WORKFLOW_STATE', { status: 'COMPLETED', job: this.state });
                try { exportWorkflowLog(this.state); } catch (e) { console.warn('Log export hatasÃ„Â±:', e); }
                return this.state.videoUrl;
            }
        } catch (e) { this.state.status = 'FAILED'; this.state.error = e.message; await AssetManagerService.saveJobState(this.state); sysEventBus.emit('WORKFLOW_STATE', { status: 'FAILED', job: this.state }); throw e; }
    }
}

const VOICE_OPTIONS = [
    { id: 'Aoede', label: 'Aoede', gender: 'Female', age: 'Young', category: 'Corporate & Narration' },
    { id: 'Puck', label: 'Puck', gender: 'Male', age: 'Child', category: 'Anime & Animation' },
    { id: 'Kore', label: 'Kore', gender: 'Female', age: 'Middle-aged', category: 'Documentary' },
    { id: 'Charon', label: 'Charon', gender: 'Male', age: 'Elderly', category: 'Audiobooks & Novels' },
    { id: 'Zephyr', label: 'Zephyr', gender: 'Male', age: 'Young', category: 'Commercials & Trailers' },
    { id: 'Fenrir', label: 'Fenrir', gender: 'Male', age: 'Middle-aged', category: 'Games & RPG' },
    { id: 'Leda', label: 'Leda', gender: 'Female', age: 'Middle-aged', category: 'Corporate & Narration' },
    { id: 'Orus', label: 'Orus (Erkek - Resmi)', gender: 'Male', age: 'Middle-aged', category: 'Documentary' }
];

const CustomSelect = ({ value, onChange, options, icon: Icon, className }) => {
    const [isOpen, setIsOpen] = useState(false); const ref = useRef(null);
    useEffect(() => { const handleClickOutside = (event) => { if (ref.current && !ref.current.contains(event.target)) setIsOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
    const getSelectedLabel = () => { for (const opt of options) { if (opt.options) { const found = opt.options.find(o => o.value === value); if (found) return found.label; } else if (opt.value === value) return opt.label; } return value; };
    const getSelectedColor = () => { for (const opt of options) { if (opt.options) { const found = opt.options.find(o => o.value === value); if (found?.color) return found.color; } else if (opt.value === value && opt.color) return opt.color; } return 'text-white'; };
    return (
        <div ref={ref} className={`relative flex items-center w-full ${className || ''}`} onClick={() => setIsOpen(!isOpen)}>
            {Icon && <Icon size={18} className="text-indigo-400 shrink-0 mr-3" />}
            <div className={`flex-1 flex items-center justify-between text-sm font-bold cursor-pointer truncate ${getSelectedColor()}`}>
                <span className="truncate pr-2">{getSelectedLabel()}</span>
                <ChevronDown size={16} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''} text-slate-400`} />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[200] max-h-64 overflow-y-auto py-1">
                    {options.map((opt, idx) => {
                        if (opt.options) {
                            return (<div key={idx}>{opt.label && <div className="px-3 py-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">{opt.label}</div>}{opt.options.map(subOpt => (<div key={subOpt.value} className={`px-3 py-2 text-sm cursor-pointer transition-colors ${value === subOpt.value ? 'bg-blue-600 text-white' : `hover:bg-blue-600 hover:text-white ${subOpt.color || 'text-slate-200'}`}`} onClick={(e) => { e.stopPropagation(); onChange(subOpt.value); setIsOpen(false); }}>{subOpt.label}</div>))}</div>);
                        }
                        return (<div key={opt.value} className={`px-3 py-2 text-sm cursor-pointer transition-colors ${value === opt.value ? 'bg-blue-600 text-white' : `hover:bg-blue-600 hover:text-white ${opt.color || 'text-slate-200'}`}`} onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}>{opt.label}</div>);
                    })}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// MAIN APP Ã¢â‚¬â€ VOLUME MIXER & REFERENCE IMAGE SECTIONS REMOVED
// ============================================================================
export default function App() {
    const [user, setUser] = useState(null);
    const [authExpired, setAuthExpired] = useState(false);
    const isLoadedRef = useRef(false);
    const logEndRef = useRef(null);
    const musicFileInputRef = useRef(null);

    const [activeTab, setActiveTab] = useState(() => { const saved = SafeStorage.getItem('ns_activeTab'); return saved === 'image' ? 'media' : (saved || 'media'); });
    const [textInput, setTextInput] = useState(() => SafeStorage.getItem('ns_textInput') || '');

    // === GAZETE TAKÃ„Â°P STATE ===
    const [gazeteItems, setGazeteItems] = useState([]);           // gazete manÃ…Å¸et listesi
    const [gazeteLoading, setGazeteLoading] = useState(false);    // yÃƒÂ¼kleme durumu
    const [gazeteError, setGazeteError] = useState('');            // hata mesajÃ„Â±
    const [gazeteCropModal, setGazeteCropModal] = useState(null); // {src, name} Ã¢â‚¬â€ crop aÃƒÂ§Ã„Â±k mÃ„Â±
    const [gazeteSource, setGazeteSource] = useState('gazeteoku'); // kaynak site
    const gazeteCanvasRef = useRef(null);                          // crop canvas ref

    const [config, setConfig] = useState(() => {
        const savedConfig = JSON.parse(SafeStorage.getItem('ns_config')) || {};
        return { duration: '30', aspectRatio: '9:16', videoStyle: 'cinematic', fontStyle: 'modern', imageStyle: 'watercolor', language: 'tr', subtitles: 'on', resolution: '4K', transition: 'none', outputType: 'video', analysisMode: 'yorumsuz', videoFormat: 'mp4', tip: 'haber', sourceName: '', yorum: '', ...savedConfig };
    });

    const [prefs, setPrefs] = useState(() => {
        const savedPrefs = JSON.parse(SafeStorage.getItem('ns_prefs')) || {};
        return { narratorVoice: 'Charon', narratorVolume: 0.8, backgroundMusicVolume: 0.3, ambientSound: 'none', customBgMusicName: '', customBgMusicId: '', ...savedPrefs };
    });

    const [voiceFilters, setVoiceFilters] = useState(() => { const saved = JSON.parse(SafeStorage.getItem('ns_voiceFilters')) || {}; return { gender: 'Any', age: 'Any', category: 'Any', ...saved }; });
    const [showFilters, setShowFilters] = useState(false);
    const [sysLogs, setSysLogs] = useState([]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [pendingJob, setPendingJob] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const filteredVoices = VOICE_OPTIONS.filter(v => {
        if (voiceFilters.gender !== 'Any' && v.gender !== voiceFilters.gender) return false;
        if (voiceFilters.age !== 'Any' && v.age !== voiceFilters.age) return false;
        if (voiceFilters.category !== 'Any' && v.category !== voiceFilters.category) return false;
        return true;
    });

    useEffect(() => { if (filteredVoices.length > 0 && !filteredVoices.find(v => v.id === prefs.narratorVoice)) setPrefs(p => ({ ...p, narratorVoice: filteredVoices[0].id })); }, [voiceFilters]);

    const [uiState, setUiState] = useState({ isProcessing: false, statusText: '', percent: 0, error: '', videoUrl: null, showDevMenu: false, selectedMediaFiles: [] });

    // NVIDIA + Gemini API key'leri + model (sessionStorage'da tutulur, kodda hardcoded deÃ„Å¸il)
    const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey());
    const [geminiKeyInput, setGeminiKeyInput] = useState(() => getGeminiKey());
    const [providerInputs, setProviderInputs] = useState(() => {
        const o = {};
        for (const p of AI_PROVIDERS) o[p.id] = getProviderKey(p.id);
        return o;
    });
    const [nvidiaModel, setNvidiaModel] = useState(() => NV_MODEL);
    const [showApiKeyPanel, setShowApiKeyPanel] = useState(() => !getApiKey() && !getGeminiKey());
    const saveApiKey = () => {
        setApiKey(apiKeyInput.trim());
        setGeminiKey(geminiKeyInput.trim());
        for (const p of AI_PROVIDERS) setProviderKey(p.id, (providerInputs[p.id] || '').trim());
        const m = nvidiaModel.trim() || NV_MODEL;
        setNvidiaModel(m);
        addSystemLog('API anahtarlarÃ„Â± kaydedildi (NVIDIA + Gemini + ' + AI_PROVIDERS.length + ' saÃ„Å¸layÃ„Â±cÃ„Â±).', 'success');
        setShowApiKeyPanel(false);
    };
    const fillProvidedKeys = () => {
        addSystemLog('AnahtarlarÃ„Â± tarayÃ„Â±cÃ„Â± konsolundan veya elle girin. HazÃ„Â±r anahtarlar gÃƒÂ¼venlik nedeniyle koda gÃƒÂ¶mÃƒÂ¼lmez.', 'info');
    };

    const [studioMedia, setStudioMedia] = useState({ outroUrl: null, musicLoaded: false, musicName: '', musicId: '', musicList: [], customSceneImages: [], isLoading: true, statusMsg: 'Bulut Kontrol Ediliyor...', syncedFolderName: '' });
    const [musicSearchQuery, setMusicSearchQuery] = useState('');

    const canvasRef = useRef(null);
    const workflowRef = useRef(new WorkflowCoordinator());
    const _previewAudioRef = useRef(null); // MÃƒÂ¼zik ÃƒÂ¶nizleme iÃƒÂ§in audio ref

    const getTargetSeconds = (dur) => { if (dur === 'unlimited') return 0; if (dur === '15') return 30; if (dur === '30') return 60; if (dur === '60') return 90; if (dur === '90') return 120; return 60; };
    const targetSecUI = getTargetSeconds(config.duration);
    const maxWordsUI = config.duration === 'unlimited' ? 'SÃ„Â±nÃ„Â±rsÃ„Â±z' : Math.floor((targetSecUI - 1.5) * getWPS(config.language));

    const ambientOptions = [
        { value: 'none', label: 'ÄŸÅ¸â€â€¡ Arka Ses Yok', color: 'text-slate-300' },
        { label: 'Atmosfer', options: [
            { value: 'rain', label: 'ÄŸÅ¸Å’Â§Ã¯Â¸Â YaÃ„Å¸mur', color: 'text-blue-300' },
            { value: 'wind', label: 'ÄŸÅ¸Å’Â¬Ã¯Â¸Â RÃƒÂ¼zgar', color: 'text-slate-300' },
            { value: 'waves', label: 'ÄŸÅ¸Å’Å  Dalgalar', color: 'text-cyan-300' },
            { value: 'fire', label: 'ÄŸÅ¸â€Â¥ Ã…ÂÃƒÂ¶mine', color: 'text-orange-300' },
        ]}
    ];
    // Yerel mÃƒÂ¼zikler (public/Muzik/)
    const filteredMusicList = LOCAL_MUSIC_LIBRARY.filter(m => !musicSearchQuery || m.title.toLowerCase().includes(musicSearchQuery.toLowerCase()));
    if (filteredMusicList.length > 0) ambientOptions.push({ label: `ÄŸÅ¸ÂÂµ Yerel MÃƒÂ¼zik (${filteredMusicList.length})`, options: filteredMusicList.map(m => ({ value: m.id, label: `ÄŸÅ¸ÂÂ¶ ${m.title}`, color: 'text-violet-400' })) });

    const voiceOptions = [
        { value: 'none', label: 'ÄŸÅ¸â€â€¡ Ses Yok', color: 'text-rose-400 font-bold' },
        ...filteredVoices.map(v => ({ value: v.id, label: v.label }))
    ];
    if (filteredVoices.length === 0) voiceOptions.push({ value: '', label: 'Kriter Uyumsuz', color: 'text-slate-500' });

    const SOCIAL_PLATFORMS = [
        { id: 'x', name: 'X (Twitter)', color: '#1DA1F2', loginUrl: 'https://x.com/login', shareUrl: 'https://x.com/intent/post' },
        { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', loginUrl: 'https://www.linkedin.com/login', shareUrl: 'https://www.linkedin.com/feed/compose/' },
        { id: 'facebook', name: 'Facebook', color: '#1877F2', loginUrl: 'https://www.facebook.com/login', shareUrl: 'https://www.facebook.com/sharer/sharer.php' },
        { id: 'instagram', name: 'Instagram', color: '#E4405F', loginUrl: 'https://www.instagram.com/accounts/login/', shareUrl: 'https://www.instagram.com/' },
        { id: 'tiktok', name: 'TikTok', color: '#000000', loginUrl: 'https://www.tiktok.com/login', shareUrl: 'https://www.tiktok.com/' },
        { id: 'pinterest', name: 'Pinterest', color: '#BD081C', loginUrl: 'https://pinterest.com/login/', shareUrl: 'https://pinterest.com/pin/create/button/' },
        { id: 'bluesky', name: 'Bluesky', color: '#0085FF', loginUrl: 'https://bsky.app/', shareUrl: 'https://bsky.app/' }
    ];
    const [connectedPlatforms, setConnectedPlatforms] = useState(() => {
        const saved = JSON.parse(SafeStorage.getItem('ns_connectedPlatforms')) || {};
        return saved;
    });
    const [shareTargets, setShareTargets] = useState(() => {
        const saved = JSON.parse(SafeStorage.getItem('ns_shareTargets')) || {};
        return saved;
    });
    const [showSharePanel, setShowSharePanel] = useState(false);
    const togglePlatform = (platformId) => {
        setConnectedPlatforms(prev => {
            const next = { ...prev, [platformId]: !prev[platformId] };
            SafeStorage.setItem('ns_connectedPlatforms', JSON.stringify(next));
            if (!next[platformId]) setShareTargets(prev => { const n = { ...prev }; delete n[platformId]; SafeStorage.setItem('ns_shareTargets', JSON.stringify(n)); return n; });
            return next;
        });
    };
    const toggleShareTarget = (platformId) => {
        setShareTargets(prev => {
            const next = { ...prev, [platformId]: !prev[platformId] };
            SafeStorage.setItem('ns_shareTargets', JSON.stringify(next));
            return next;
        });
    };
    const openPlatformConnect = (platform) => {
        const popup = window.open(platform.loginUrl, platform.name, 'width=600,height=700,scrollbars=yes');
        addSystemLog(`${platform.name} giriÃ…Å¸ sayfasÃ„Â± aÃƒÂ§Ã„Â±ldÃ„Â±. Oturum aÃƒÂ§Ã„Â±n, otomatik olarak baÃ„Å¸lanacaksÃ„Â±nÃ„Â±z.`, 'info');
        const checker = setInterval(() => {
            try {
                if (popup.closed) {
                    clearInterval(checker);
                    togglePlatform(platform.id);
                    addSystemLog(`${platform.name} baÃ„Å¸lantÃ„Â±sÃ„Â± tamamlandÃ„Â±!`, 'success');
                }
            } catch (e) { clearInterval(checker); }
        }, 800);
    };

    // SeÃƒÂ§ili platformlarda sÃ„Â±ralÃ„Â± paylaÃ…Å¸Ã„Â±m (popup blocker azaltÃ„Â±r)
    const shareToSelectedPlatforms = async () => {
        const title = workflowRef.current?.state?.script?.thumbnailText || 'Video';
        // HiÃƒÂ§ platform seÃƒÂ§ilmemiÃ…Å¸se hepsini paylaÃ…Å¸
        const hasSelection = Object.values(shareTargets).some(v => v);
        const selected = hasSelection 
            ? SOCIAL_PLATFORMS.filter(p => shareTargets[p.id])
            : SOCIAL_PLATFORMS;
        
        if (selected.length === 0) { 
            addSystemLog("PaylaÃ…Å¸Ã„Â±lacak platform bulunamadÃ„Â±!", 'warn'); 
            return; 
        }
        
        addSystemLog(`${selected.length} platformda paylaÃ…Å¸Ã„Â±m aÃƒÂ§Ã„Â±lÃ„Â±yor...`, 'info');
        
        for (let i = 0; i < selected.length; i++) {
            const platform = selected[i];
            let url = '';
            
            // blob URL paylaÃ…Å¸Ã„Â±lamaz, sadece baÃ…Å¸lÃ„Â±k paylaÃ…Å¸Ã„Â±lÃ„Â±r
            if (platform.id === 'x') 
                url = `https://x.com/intent/post?text=${encodeURIComponent(title)}`;
            else if (platform.id === 'linkedin') {
                // LinkedIn API ile doÃ„Å¸rudan paylaÃ…Å¸Ã„Â±m
                try {
                    addSystemLog('LinkedIn API ile paylaÃ…Å¸Ã„Â±lÃ„Â±yor...', 'info');
                    const result = await shareToLinkedInAPI(title);
                    addSystemLog('LinkedIn\'de paylaÃ…Å¸Ã„Â±ldÃ„Â±! Ã¢Å“â€¦', 'success');
                    if (i < selected.length - 1) await new Promise(r => setTimeout(r, 500));
                    continue; // popup aÃƒÂ§ma, API ile paylaÃ…Å¸Ã„Â±ldÃ„Â±
                } catch (e) {
                    addSystemLog('LinkedIn API hatasÃ„Â±, compose aÃƒÂ§Ã„Â±lÃ„Â±yor: ' + e.message, 'warn');
                    url = `https://www.linkedin.com/feed/compose/?text=${encodeURIComponent(title)}`;
                }
            }
            else if (platform.id === 'pinterest') 
                url = `https://pinterest.com/pin/create/button/?description=${encodeURIComponent(title)}`;
            else if (platform.id === 'bluesky') 
                url = `https://bsky.app/intent/compose?text=${encodeURIComponent(title)}`;
            else if (platform.id === 'facebook') 
                url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(title)}`;
            else if (platform.id === 'instagram') 
                url = 'https://www.instagram.com/';
            else if (platform.id === 'tiktok') 
                url = 'https://www.tiktok.com/upload';
            
            if (url) {
                window.open(url, platform.name, 'width=700,height=700');
                if (i < selected.length - 1) await new Promise(r => setTimeout(r, 500));
            }
        }
        
        addSystemLog(`${selected.length} platform aÃƒÂ§Ã„Â±ldÃ„Â±. Videoyu manuel olarak yÃƒÂ¼kleyin.`, 'success');
    };

    // Linki clipboard'a kopyala (sadece baÃ…Å¸lÃ„Â±k, blob URL paylaÃ…Å¸Ã„Â±lamaz)
    // Otomatik video kaydetme (direk indirme, dosya adÃ„Â± = haber baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â±)
    const autoSaveVideo = async (videoUrl, title, videoFormat) => {
        if (!videoUrl || !videoUrl.startsWith('blob:')) {
            addSystemLog('GeÃƒÂ§ersiz video URL, kaydetme atlandÃ„Â±.', 'warn');
            return;
        }

        addSystemLog('Video kaydediliyor...', 'info');

        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            // UzantÃ„Â±: config'deki videoFormat tercih et, yoksa blob type'dan algÃ„Â±la
            const ext = videoFormat === 'mp4' ? '.mp4' : (blob.type.includes('mp4') ? '.mp4' : '.webm');
            const safeName = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_").toLowerCase();
            const fileName = `${safeName}${ext}`;

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            addSystemLog(`Video indirildi: ${fileName}`, 'success');
        } catch (e) {
            addSystemLog('Video indirme hatasÃ„Â±: ' + e.message, 'error');
        }
    };

    const copyShareLink = async () => {
        const title = workflowRef.current?.state?.script?.thumbnailText || 'Video';
        try {
            await navigator.clipboard.writeText(title);
            addSystemLog('BaÃ…Å¸lÃ„Â±k panoya kopyalandÃ„Â±!', 'success');
        } catch (e) {
            const textarea = document.createElement('textarea');
            textarea.value = title;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            addSystemLog('BaÃ…Å¸lÃ„Â±k panoya kopyalandÃ„Â±!', 'success');
        }
    };

    // Native share (mobilde cihaz paylaÃ…Å¸Ã„Â±mÃ„Â± - sadece baÃ…Å¸lÃ„Â±k)
    const nativeShare = async () => {
        const title = workflowRef.current?.state?.script?.thumbnailText || 'Video';
        try {
            await navigator.share({ title: title, text: title });
            addSystemLog('PaylaÃ…Å¸Ã„Â±m tamamlandÃ„Â±!', 'success');
        } catch (e) {
            if (e.name !== 'AbortError') addSystemLog('PaylaÃ…Å¸Ã„Â±m hatasÃ„Â±: ' + e.message, 'error');
        }
    };

    const shareToPlatform = async (platform, title, videoUrl) => {
        let url = '';
        if (platform.id === 'x') { url = `https://x.com/intent/post?text=${encodeURIComponent(title + ' ' + videoUrl)}`; }
        else if (platform.id === 'linkedin') {
            // LinkedIn API ile doÃ„Å¸rudan paylaÃ…Å¸Ã„Â±m
            try {
                addSystemLog('LinkedIn API ile paylaÃ…Å¸Ã„Â±lÃ„Â±yor...', 'info');
                await shareToLinkedInAPI(title);
                addSystemLog('LinkedIn\'de paylaÃ…Å¸Ã„Â±ldÃ„Â±! Ã¢Å“â€¦', 'success');
                return; // popup aÃƒÂ§ma
            } catch (e) {
                addSystemLog('LinkedIn API hatasÃ„Â±, compose aÃƒÂ§Ã„Â±lÃ„Â±yor: ' + e.message, 'warn');
                url = `https://www.linkedin.com/feed/compose/?text=${encodeURIComponent(title)}`;
            }
        }
        else if (platform.id === 'facebook') { url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(title)}&u=${encodeURIComponent(videoUrl)}`; }
        else if (platform.id === 'pinterest') { url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(videoUrl)}&description=${encodeURIComponent(title)}`; }
        else if (platform.id === 'tiktok') { url = 'https://www.tiktok.com/upload'; }
        else if (platform.id === 'instagram') { url = 'https://www.instagram.com/'; }
        else if (platform.id === 'bluesky') { url = `https://bsky.app/intent/compose?text=${encodeURIComponent(title + ' ' + videoUrl)}`; }
        if (url) window.open(url, '_blank', 'width=700,height=700');
    };

    useEffect(() => { SafeStorage.setItem('ns_activeTab', activeTab); }, [activeTab]);
    useEffect(() => { SafeStorage.setItem('ns_textInput', textInput); }, [textInput]);
    useEffect(() => { SafeStorage.setItem('ns_config', JSON.stringify(config)); }, [config]);
    useEffect(() => { SafeStorage.setItem('ns_prefs', JSON.stringify(prefs)); }, [prefs]);
    useEffect(() => { SafeStorage.setItem('ns_voiceFilters', JSON.stringify(voiceFilters)); }, [voiceFilters]);

    useEffect(() => { let interval; if (uiState.isProcessing) { setElapsedSeconds(0); const start = performance.now(); interval = setInterval(() => { setElapsedSeconds(((performance.now() - start) / 1000).toFixed(1)); }, 100); } else clearInterval(interval); return () => clearInterval(interval); }, [uiState.isProcessing]);

    useEffect(() => {
        sysEventBus.on('SYS_LOG_ADD', (log) => setSysLogs(prev => [...prev, log]));
        sysEventBus.on('SYS_LOG_CLEAR', () => sysEventBus.emit('SYS_LOG_CLEAR_DONE'));
        sysEventBus.on('SYS_LOG_CLEAR_DONE', () => setSysLogs([]));
        sysEventBus.on('PROGRESS', (data) => { const p = Math.min(100, Math.max(0, Math.round(data.percent || 0))); setUiState(prev => ({ ...prev, percent: p, statusText: data.text || prev.statusText })); });
        sysEventBus.on('WORKFLOW_STATE', (data) => {
            if (data.status === 'FAILED') setUiState(prev => ({ ...prev, isProcessing: false, error: data.job.error }));
            if (data.status === 'COMPLETED') {
                setUiState(prev => ({ ...prev, isProcessing: false, percent: 100, statusText: 'TamamlandÃ„Â±!', videoUrl: data.job.videoUrl }));
                // Otomatik video + log indir (H1.141)
                autoSaveVideo(data.job.videoUrl, data.job.script?.thumbnailText || 'video', data.job.config?.videoFormat);
                try { exportWorkflowLog(data.job); } catch (e) { console.warn('Log export hatasÃ„Â±:', e); }
            }
        });
        sysEventBus.on('AUTH_EXPIRED', () => setAuthExpired(true));
    }, []);

    useEffect(() => { if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [sysLogs]);

    useEffect(() => {
        const loadLocalMusic = async () => {
            try {
                // Sunucu otomatik algÃ„Â±lama
                const detectedUrl = await getMusicProxyUrl();
                if (detectedUrl) addSystemLog(`Sunucu bulundu: ${detectedUrl}`, 'success');
                else addSystemLog('MÃƒÂ¼zik proxy sunucusu bulunamadÃ„Â± Ã¢â‚¬â€ CORS proxy kullanÃ„Â±lacak', 'warn');

                // Yerel mÃƒÂ¼zik kÃƒÂ¼tÃƒÂ¼phanesi (public/Muzik/) otomatik yÃƒÂ¼klenir
                const gdCount = LOCAL_MUSIC_LIBRARY.length;
                addSystemLog(`Yerel mÃƒÂ¼zik: ${gdCount} parÃƒÂ§a bulundu (public/Muzik/).`, 'info');

                const allMusic = await AssetManagerService.getAllMusicFromLib();
                setStudioMedia(s => ({ ...s, musicList: [...allMusic], isLoading: false, statusMsg: 'Yerel Mod' }));
                if (allMusic.length > 0) {
                    addSystemLog(`${allMusic.length} mÃƒÂ¼zik IndexedDB'den yÃƒÂ¼klendi.`, 'success');
                } else {
                    addSystemLog("MÃƒÂ¼zik kÃƒÂ¼tÃƒÂ¼phanesi boÃ…Å¸. KlasÃƒÂ¶r seÃƒÂ§erek mÃƒÂ¼zik ekleyin.", 'info');
                }
                // VarsayÃ„Â±lan mÃƒÂ¼zik seÃƒÂ§imi: mÃƒÂ¼zik varsa ve hiÃƒÂ§biri seÃƒÂ§ili deÃ„Å¸ilse ilk mÃƒÂ¼ziÃ„Å¸i seÃƒÂ§
                const savedPrefs = JSON.parse(SafeStorage.getItem('ns_prefs')) || {};
                if (allMusic.length > 0 && (!savedPrefs.ambientSound || savedPrefs.ambientSound === 'none')) {
                    const firstTrack = allMusic[0];
                    setPrefs(p => ({ ...p, ambientSound: firstTrack.id, customBgMusicName: firstTrack.name, customBgMusicId: firstTrack.id }));
                    addSystemLog(`Otomatik seÃƒÂ§im: ${firstTrack.name}`, 'info');
                }
                if (savedPrefs.ambientSound && !['none', 'rain', 'wind', 'waves', 'fire'].includes(savedPrefs.ambientSound)) {
                    const track = allMusic.find(m => m.id === savedPrefs.ambientSound);
                    if (track && track.data) {
                        const raw = track.data.includes(',') ? track.data.split(',')[1] : track.data;
                        const byteString = atob(raw);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                        const blob = new Blob([ab], { type: 'audio/mpeg' });
                        const url = URL.createObjectURL(blob);
                        await AssetManagerService.saveMedia('CUSTOM_MUSIC', url);
                    }
                }
                const savedDir = await AssetManagerService.getDirHandle();
                if (savedDir && savedDir.handle) {
                    try {
                        const permission = await savedDir.handle.requestPermission({ mode: 'read' });
                        if (permission === 'granted') {
                            addSystemLog(`Otomatik mÃƒÂ¼zik senkronizasyonu: ${savedDir.name}`, 'info');
                            const currentMusic = await AssetManagerService.getAllMusicFromLib();
                            const newCount = await syncMusicFromDir(savedDir.handle, currentMusic);
                            if (newCount > 0) {
                                const updated = await AssetManagerService.getAllMusicFromLib();
                                setStudioMedia(s => ({ ...s, musicList: updated }));
                                addSystemLog(`${newCount} yeni mÃƒÂ¼zik otomatik eklendi. Toplam: ${updated.length}`, 'success');
                            }
                        }
                    } catch (e) {
                        console.warn("Otomatik senkronizasyon hatasÃ„Â±:", e);
                    }
                }
            } catch (e) { setStudioMedia(s => ({ ...s, isLoading: false, statusMsg: 'Yerel Mod' })); }
        };
        loadLocalMusic();
    }, []);

    const saveToFirestore = async (updates) => { if (!user || !isFirebaseActive) return; try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'user_assets', 'main'), updates, { merge: true }); } catch (error) { if (!error.message?.includes('offline')) console.warn("Firestore kayÃ„Â±t hatasÃ„Â±"); } };
    const uploadChunks = async (prefix, b64Data) => { if (!user || !isFirebaseActive) return 0; const chunkSize = 800000; const chunksCount = Math.ceil(b64Data.length / chunkSize); try { for (let i = 0; i < chunksCount; i++) { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'asset_chunks', `${prefix}_${i}`), { data: b64Data.substring(i * chunkSize, (i + 1) * chunkSize), index: i }); } return chunksCount; } catch (e) { return 0; } };
    const downloadChunks = async (prefix, chunksCount) => { if (!user || !isFirebaseActive) return null; let b64Data = ""; try { for (let i = 0; i < chunksCount; i++) { let chunkSnap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'asset_chunks', `${prefix}_${i}`)); if (!chunkSnap.exists()) chunkSnap = await getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'music_chunks', `${prefix}_${i}`)); if (chunkSnap.exists()) b64Data += chunkSnap.data().data; else return null; } return b64Data; } catch (e) { return null; } };

    useEffect(() => {
        if (!isFirebaseActive) { return; }
        const initAuth = async () => { try { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token); else await signInAnonymously(auth); } catch (e) { } };
        initAuth();
        const unsubAuth = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u && !isLoadedRef.current) {
                try { const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'user_assets', 'settings')); if (snap.exists()) { const d = snap.data(); if (d.config) setConfig(c => ({ ...c, ...d.config })); if (d.prefs) { if (!d.prefs.ambientSound) d.prefs.ambientSound = d.selectedBgmId || 'none'; setPrefs(p => ({ ...p, ...d.prefs })); } if (d.voiceFilters) setVoiceFilters(f => ({ ...f, ...d.voiceFilters })); if (d.activeTab) setActiveTab(d.activeTab); if (d.textInput) setTextInput(d.textInput); } } catch (e) { }
                isLoadedRef.current = true;
            }
        });
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (!user || !isFirebaseActive || !isLoadedRef.current) return;
        const timer = setTimeout(() => { try { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'user_assets', 'settings'), { config, prefs, voiceFilters, activeTab, textInput, lastUpdated: Date.now() }, { merge: true }).catch(() => { }); } catch (e) { } }, 800);
        return () => clearTimeout(timer);
    }, [config, prefs, voiceFilters, activeTab, textInput, user]);

    useEffect(() => {
        if (!user || !isFirebaseActive) { setStudioMedia(s => ({ ...s, isLoading: false, statusMsg: 'Yerel Mod' })); return; }
        const preloadLocal = async () => {
            const localOutro = await AssetManagerService.loadMedia('CUSTOM_OUTRO');
            const csi = [];
            for (let i = 0; i < 999; i++) { const img = await AssetManagerService.loadMedia("CUSTOM_SCENE_IMG_" + i); if (img) csi.push(img); }
            const allMusics = await AssetManagerService.getAllMusicFromLib();
            const savedDir = await AssetManagerService.getDirHandle();
            setStudioMedia(s => ({ ...s, outroUrl: s.outroUrl || localOutro, musicList: s.musicList.length > 0 ? s.musicList : allMusics, customSceneImages: csi, isLoading: false, statusMsg: localOutro ? 'Yerel Bellek Aktif' : s.statusMsg, syncedFolderName: savedDir?.name || '' }));
            if (savedDir && savedDir.handle) {
                try {
                    const permission = await savedDir.handle.requestPermission({ mode: 'read' });
                    if (permission === 'granted') {
                        addSystemLog(`Otomatik mÃƒÂ¼zik senkronizasyonu: ${savedDir.name}`, 'info');
                        const newCount = await syncMusicFromDir(savedDir.handle, allMusics);
                        if (newCount > 0) {
                            const updated = await AssetManagerService.getAllMusicFromLib();
                            setStudioMedia(s => ({ ...s, musicList: updated }));
                            addSystemLog(`${newCount} yeni mÃƒÂ¼zik otomatik eklendi. Toplam: ${updated.length}`, 'success');
                        } else {
                            addSystemLog(`MÃƒÂ¼zikler senkronize. Toplam: ${allMusics.length}`, 'success');
                        }
                    } else {
                        addSystemLog("KlasÃƒÂ¶r izni yenilenemedi, elle seÃƒÂ§im gerekiyor.", 'warn');
                        await AssetManagerService.removeDirHandle();
                    }
                } catch (e) {
                    console.warn("Otomatik senkronizasyon hatasÃ„Â±:", e);
                    addSystemLog("Otomatik senkronizasyon baÃ…Å¸arÃ„Â±sÃ„Â±z.", 'warn');
                }
            }
        };
        preloadLocal();
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'user_assets', 'main');
        const unsubscribe = onSnapshot(docRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                let updates = {};
                // MÃƒÂ¼zik listesini SADECE yerelde mÃƒÂ¼zik yoksa Firebase'den yÃƒÂ¼kle (overwrite ÃƒÂ¶nleme)
                const localMusicCount = (await AssetManagerService.getAllMusicFromLib()).length;
                if (localMusicCount === 0 && data.bgmList && data.bgmList.length > 0) {
                    updates.musicList = data.bgmList;
                    addSystemLog(`Firebase'den ${data.bgmList.length} mÃƒÂ¼zik senkronize edildi.`, 'info');
                }
                let localOutro = await AssetManagerService.loadMedia('CUSTOM_OUTRO');
                if (data.outroChunksCount) { if (!localOutro) { localOutro = await downloadChunks('outro', data.outroChunksCount); if (localOutro) await AssetManagerService.saveMedia('CUSTOM_OUTRO', localOutro); } updates.outroUrl = localOutro; }
                else if (data.backCover) { updates.outroUrl = data.backCover; if (!localOutro) await AssetManagerService.saveMedia('CUSTOM_OUTRO', data.backCover); }
                else if (data.outroChunksCount === null || data.backCover === null) { updates.outroUrl = null; await AssetManagerService.deleteMedia('CUSTOM_OUTRO'); }
                else updates.outroUrl = localOutro;
                if (data.selectedBgmId) { const trackList = updates.musicList || (await AssetManagerService.getAllMusicFromLib()); const track = trackList.find(m => m.id === data.selectedBgmId); if (track) { let localMusic = await AssetManagerService.getMusicFromLib(data.selectedBgmId); if (!localMusic && track.chunksCount) { const cloudData = await downloadChunks(track.id, track.chunksCount); if (cloudData) { localMusic = { id: track.id, name: track.name, data: cloudData }; await AssetManagerService.saveMusicToLib(localMusic); } } if (localMusic) { await AssetManagerService.saveMedia('CUSTOM_MUSIC', localMusic.data); updates.musicLoaded = true; updates.musicName = track.name; updates.musicId = track.id; } } }
                else if (data.selectedBgmId === null) { updates.musicLoaded = false; updates.musicName = ''; updates.musicId = ''; await AssetManagerService.deleteMedia('CUSTOM_MUSIC'); }
                updates.isLoading = false; if (!updates.statusMsg || updates.statusMsg.includes('Ã„Â°ndiriliyor')) updates.statusMsg = 'Bulutla Senkronize (Aktif)';
                setStudioMedia(s => ({ ...s, ...updates }));
            } else {
                const syncLocalToCloud = async () => { let updates = {}; const localOutro = await AssetManagerService.loadMedia('CUSTOM_OUTRO'); if (localOutro) updates.outroChunksCount = await uploadChunks('outro', localOutro); const db = await AssetManagerService.getDB(); const tx = db.transaction(LIB_STORE, 'readonly'); const req = tx.objectStore(LIB_STORE).getAll(); req.onsuccess = async () => { const allMusics = req.result || []; if (allMusics.length > 0) updates.bgmList = allMusics.map(m => ({ id: m.id, name: m.name, chunksCount: Math.ceil(m.data.length / 800000) })); const savedPrefs = JSON.parse(SafeStorage.getItem('ns_prefs')) || {}; if (savedPrefs.ambientSound && savedPrefs.ambientSound !== 'none') updates.selectedBgmId = savedPrefs.ambientSound; if (Object.keys(updates).length > 0) await setDoc(docRef, updates, { merge: true }); }; };
                syncLocalToCloud(); setStudioMedia(s => ({ ...s, isLoading: false, statusMsg: 'Yerel Bellek Senkronize' }));
            }
        }, () => setStudioMedia(s => ({ ...s, isLoading: false, statusMsg: 'Yerel Mod' })));
        return () => unsubscribe();
    }, [user]);

    const handleOutroUpload = async (e) => { const file = e.target.files?.[0]; if (!file) return; setStudioMedia(s => ({ ...s, isLoading: true, statusMsg: 'Kapak YÃƒÂ¼kleniyor...' })); const b64 = await NetworkUtils.compressImage(file); await AssetManagerService.saveMedia('CUSTOM_OUTRO', b64); const chunksCount = await uploadChunks('outro', b64); await saveToFirestore({ outroChunksCount: chunksCount, backCover: null }); setStudioMedia(s => ({ ...s, outroUrl: b64, isLoading: false, statusMsg: 'Bulutla Senkronize' })); };
    const handleOutroDelete = async () => { await AssetManagerService.deleteMedia('CUSTOM_OUTRO'); setStudioMedia(s => ({ ...s, outroUrl: null })); await saveToFirestore({ outroChunksCount: null, backCover: null }); };
    const handleCustomSceneImagesUpload = async (e) => { const files = Array.from(e.target.files); if (!files.length) return; const availableSlots = 999 - (studioMedia.customSceneImages?.length || 0); const filesToProcess = files.slice(0, availableSlots); const newB64s = []; for (let file of filesToProcess) { if (file.type.startsWith('image/')) { const b64 = await NetworkUtils.compressImage(file); newB64s.push(b64); } } const updatedImages = [...(studioMedia.customSceneImages || []), ...newB64s].slice(0, 5); for (let i = 0; i < updatedImages.length; i++) await AssetManagerService.saveMedia("CUSTOM_SCENE_IMG_" + i, updatedImages[i]); setStudioMedia(s => ({ ...s, customSceneImages: updatedImages })); const newMediaFiles = newB64s.map((b64, i) => ({ name: `SabitGorsel_${Date.now()}_${i}.jpg`, type: 'image/jpeg', data: b64 })); if (newMediaFiles.length > 0) setUiState(prev => ({ ...prev, selectedMediaFiles: [...prev.selectedMediaFiles, ...newMediaFiles] })); e.target.value = null; };
    const handleCustomSceneImageDelete = async (idx) => { const updated = studioMedia.customSceneImages.filter((_, i) => i !== idx); for (let i = 0; i < 999; i++) await AssetManagerService.deleteMedia("CUSTOM_SCENE_IMG_" + i); for (let i = 0; i < updated.length; i++) await AssetManagerService.saveMedia("CUSTOM_SCENE_IMG_" + i, updated[i]); setStudioMedia(s => ({ ...s, customSceneImages: updated })); };
    const deleteMusic = async () => { try { const as = prefs.ambientSound; if (as && !['none', 'rain', 'wind', 'waves', 'fire'].includes(as)) { const oldUrl = await AssetManagerService.loadMedia('CUSTOM_MUSIC'); if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl); await AssetManagerService.deleteMedia('CUSTOM_MUSIC'); if (!as.startsWith('local_')) { await AssetManagerService.removeMusicFromLib(as); const updatedList = studioMedia.musicList.filter(m => m.id !== as); await saveToFirestore({ bgmList: updatedList, selectedBgmId: null }); } setPrefs(p => ({ ...p, ambientSound: 'none' })); } } catch (e) { } };
    const handleFolderSelect = async () => {
        if (musicFileInputRef.current) musicFileInputRef.current.click();
    };
    const handleFolderSelectLegacy = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'];
        const audioFiles = files.filter(f => audioExts.some(ext => f.name.toLowerCase().endsWith(ext)));
        if (!audioFiles.length) { addSystemLog("SeÃƒÂ§ilen dosyalarda ses dosyasÃ„Â± bulunamadÃ„Â±.", "warn"); return; }
        addSystemLog(`${audioFiles.length} mÃƒÂ¼zik dosyasÃ„Â± bulundu, IndexedDB'ye kaydediliyor...`, 'info');
        let savedCount = 0;
        for (const file of audioFiles) {
            const id = "fm_" + file.name.replace(/[^a-zA-Z0-9]/g, '_') + "_" + file.size;
            const existing = await AssetManagerService.getMusicFromLib(id);
            if (existing) continue;
            const b64 = await NetworkUtils.fileToBase64(file);
            await AssetManagerService.saveMusicToLib({ id, name: file.name, data: b64 });
            savedCount++;
        }
        const allMusic = await AssetManagerService.getAllMusicFromLib();
        setStudioMedia(s => ({ ...s, musicList: [...allMusic] }));
        addSystemLog(`${savedCount} yeni mÃƒÂ¼zik kaydedildi. Toplam: ${allMusic.length} mÃƒÂ¼zik`, 'success');
        e.target.value = null;
    };
    const clearSyncedFolder = async () => {
        await AssetManagerService.removeDirHandle();
        setStudioMedia(s => ({ ...s, syncedFolderName: '' }));
        addSystemLog("Otomatik senkronizasyon kaldÃ„Â±rÃ„Â±ldÃ„Â±.", 'info');
    };
    // MÃƒÂ¼zik ÃƒÂ¶nizleme - 8 saniye ÃƒÂ§alar
    const playMusicPreview = (url) => {
        try {
            if (_previewAudioRef.current) { _previewAudioRef.current.pause(); _previewAudioRef.current = null; }
            const audio = new Audio(url);
            audio.volume = 0.5;
            _previewAudioRef.current = audio;
            audio.play().catch(() => {});
            setTimeout(() => { if (_previewAudioRef.current === audio) { audio.pause(); _previewAudioRef.current = null; } }, 8000);
        } catch (e) {}
    };

    const handleFolderMusicSelect = async (musicId) => {
        if (prefs.ambientSound === musicId) { setPrefs(p => ({ ...p, ambientSound: 'none' })); return; }
        // Yerel mÃƒÂ¼zik (public/Muzik/) Ã¢â‚¬â€ doÃ„Å¸rudan URL ile ÃƒÂ§al
        const track = LOCAL_MUSIC_LIBRARY.find(m => m.id === musicId);
        if (!track) { addSystemLog("MÃƒÂ¼zik bulunamadÃ„Â± (public/Muzik/)", 'error'); return; }
        addSystemLog(`MÃƒÂ¼zik hazÃ„Â±rlanÃ„Â±yor: ${track.title}`, 'info');
        const oldUrl = await AssetManagerService.loadMedia('CUSTOM_MUSIC');
        if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
        try {
            const resp = await fetch(track.url);
            if (!resp.ok) throw new Error('MÃƒÂ¼zik dosyasÃ„Â± yÃƒÂ¼klenemedi: ' + track.url);
            const audioBlob = await resp.blob();
            const url = URL.createObjectURL(audioBlob);
            await AssetManagerService.saveMedia('CUSTOM_MUSIC', url);
            setPrefs(p => ({ ...p, ambientSound: musicId, customBgMusicName: track.title, customBgMusicId: musicId }));
            playMusicPreview(url);
            addSystemLog(`MÃƒÂ¼zik hazÃ„Â±r: ${track.title}`, 'success');
        } catch (e) {
            addSystemLog(`MÃƒÂ¼zik yÃƒÂ¼kleme hatasÃ„Â±: ${e.message}`, 'error');
        }
    };
    const processSelectedFiles = async (files) => { if (!files || files.length === 0) return; if (files.length > 999) { setUiState(prev => ({ ...prev, error: "SÃ„Â±nÃ„Â±r yok seÃƒÂ§ebilirsiniz." })); return; } const validFiles = files.filter(f => f.size <= 50 * 1024 * 1024); try { setUiState(prev => ({ ...prev, isProcessing: true, statusText: "Dosyalar iÃ…Å¸leniyor..." })); const processedFiles = await Promise.all(validFiles.map(async (file) => { const base64 = await NetworkUtils.fileToBase64(file); return { name: file.name, type: file.type, data: base64 }; })); setUiState(prev => ({ ...prev, selectedMediaFiles: processedFiles, error: '', isProcessing: false, statusText: "" })); } catch (error) { setUiState(prev => ({ ...prev, error: "Dosya okuma hatasÃ„Â±.", isProcessing: false, statusText: "" })); } };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); processSelectedFiles(Array.from(e.dataTransfer.files)); };

    const handleExecuteStart = async (files = null, forceOutputType = null) => {
        sysEventBus.emit('SYS_LOG_CLEAR');
        const aCtx = _getAudioCtx(); if (aCtx.state === 'suspended') aCtx.resume().catch(() => {});
        const outType = forceOutputType || config.outputType; if (forceOutputType) setConfig(prev => ({ ...prev, outputType: forceOutputType }));
        setUiState(prev => ({ ...prev, isProcessing: true, percent: 0, statusText: 'Workflow BaÃ…Å¸latÃ„Â±lÃ„Â±yor...', error: '', videoUrl: null }));
        addSystemLog('Ã„Â°Ã…Å¸ akÃ„Â±Ã…Å¸Ã„Â± baÃ…Å¸latÃ„Â±ldÃ„Â±.', 'info');
        try {
            let inputData = textInput;
            let inputType = activeTab;
            const runConfig = { ...config, outputType: outType, customSceneImages: studioMedia.customSceneImages };
            // AtatÃƒÂ¼rk iÃƒÂ§erikli gÃƒÂ¼zel sÃƒÂ¶z Ã¢â€ â€™ otomatik mÃƒÂ¼zik seÃƒÂ§imi
            if (config.tip === 'guzel_soz' && textInput.trim()) {
                const ataturkKW = ['atatÃƒÂ¼rk', 'mustafa kemal', 'samsun', 'kurtuluÃ…Å¸', 'cumhuriyet', 'baÃ„Å¸Ã„Â±msÃ„Â±zlÃ„Â±k', 'milli mÃƒÂ¼cadele', 'inkÃ„Â±lap', 'devrim', 'paÃ…Å¸a', 'gazi', 'anÃ„Â±tkabir', '19 mayÃ„Â±s'];
                const ataturkMusicId = LOCAL_MUSIC_LIBRARY.find(m => /bir daha gel samsundan|samsun|atatÃƒÂ¼rk/i.test(m.title))?.id || (LOCAL_MUSIC_LIBRARY[0] && LOCAL_MUSIC_LIBRARY[0].id);
                if (ataturkKW.some(kw => textInput.toLowerCase().includes(kw)) && prefs.ambientSound !== ataturkMusicId) {
                    if (ataturkMusicId) {
                        addSystemLog('AtatÃƒÂ¼rk iÃƒÂ§erikli sÃƒÂ¶z Ã¢â€ â€™ yerel mÃƒÂ¼zik otomatik seÃƒÂ§ildi.', 'success');
                        await handleFolderMusicSelect(ataturkMusicId);
                    }
                }
            }
            if (config.tip === 'guzel_soz') {
                const targetFiles = files || uiState.selectedMediaFiles;
                if (textInput.trim()) {
                    inputData = textInput;
                    inputType = 'text';
                } else if (targetFiles && targetFiles.length > 0) {
                    inputData = targetFiles;
                    inputType = 'media';
                } else {
                    throw new Error("GÃƒÂ¼zel sÃƒÂ¶z iÃƒÂ§in metin veya resim girin.");
                }
            } else if (activeTab === 'media' || activeTab === 'gazete') {
                const targetFiles = files || uiState.selectedMediaFiles;
                if (targetFiles && targetFiles.length > 0) { inputData = targetFiles; inputType = 'media'; }
                else throw new Error("En az bir dosya seÃƒÂ§in.");
            } else {
                // prompt/url sekmesindeyken medya dosyasÃ„Â± (ses/gÃƒÂ¶rsel/video) varsa onu da kullan
                const targetFiles = files || uiState.selectedMediaFiles;
                if (targetFiles && targetFiles.length > 0) {
                    const hasAudio = targetFiles.some(f => f.type?.startsWith('audio'));
                    if (hasAudio) {
                        // Ses dosyasÃ„Â± varsa Ã¢â‚¬â€ transkribe + analiz iÃƒÂ§in medya olarak gÃƒÂ¶nder
                        inputData = targetFiles;
                        inputType = 'media';
                        addSystemLog('Ses dosyasÃ„Â± algÃ„Â±landÃ„Â± Ã¢â‚¬â€ transkribe edilecek ve analiz edilecek.', 'info');
                    } else if (textInput.trim()) {
                        // Metin + gÃƒÂ¶rsel varsa, metni gÃƒÂ¶nder (gÃƒÂ¶rsel AI ÃƒÂ¼retimi iÃƒÂ§in kullanÃ„Â±lÃ„Â±r)
                        inputData = textInput;
                        inputType = 'prompt';
                    }
                }
            }
            await workflowRef.current.startWorkflow(inputData, inputType, runConfig, prefs, canvasRef);
        } catch (e) { addSystemLog(`Hata: ${e.message}`, 'error'); setUiState(prev => ({ ...prev, isProcessing: false, error: e.message })); }
    };

    const handleExecuteResume = async () => { const aCtx = _getAudioCtx(); if (aCtx.state === 'suspended') aCtx.resume().catch(() => {}); setUiState({ isProcessing: true, percent: workflowRef.current.state.progress || 0, statusText: 'SÃƒÂ¼rdÃƒÂ¼rÃƒÂ¼lÃƒÂ¼yor...', error: '', videoUrl: null, showDevMenu: uiState.showDevMenu }); addSystemLog('Workflow sÃƒÂ¼rdÃƒÂ¼rÃƒÂ¼lÃƒÂ¼yor...', 'warn'); try { await workflowRef.current.resumeWorkflow(canvasRef); } catch (e) { addSystemLog(`Kurtarma hatasÃ„Â±: ${e.message}`, 'error'); setUiState(prev => ({ ...prev, isProcessing: false, error: e.message })); } };

    const handleQuickReRender = async () => { const activeJob = workflowRef.current.state; if (!activeJob || !activeJob.script || activeJob.status !== 'COMPLETED') { setUiState(prev => ({ ...prev, error: "Ãƒâ€“nce video oluÃ…Å¸turun." })); return; } setUiState(prev => ({ ...prev, isProcessing: true, percent: 10, statusText: 'Yeniden Paketleniyor...' })); addSystemLog("HÃ„Â±zlÃ„Â± yeniden paketleme...", "info"); try { const outputUrl = await RenderWorkerService.executeRender(activeJob, canvasRef.current, prefs); setUiState(prev => ({ ...prev, isProcessing: false, percent: 100, videoUrl: outputUrl })); addSystemLog("TamamlandÃ„Â±!", "success"); } catch (err) { addSystemLog(`Hata: ${err.message}`, "error"); setUiState(prev => ({ ...prev, isProcessing: false, error: "BaÃ…Å¸arÃ„Â±sÃ„Â±z: " + err.message })); } };

    const handleSilentRecovery = async () => { setUiState(prev => ({ ...prev, isProcessing: true, statusText: "Oturum yenileniyor..." })); const success = await attemptSilentReauth(); if (success) { setAuthExpired(false); setUiState(prev => ({ ...prev, isProcessing: false, statusText: "" })); addSystemLog("Oturum tazelendi.", "success"); } else setUiState(prev => ({ ...prev, isProcessing: false, error: "Yenileme baÃ…Å¸arÃ„Â±sÃ„Â±z. F5 ile yenileyin." })); };

    // === GAZETE TAKÃ„Â°P FONKSÃ„Â°YONLARI ===

    // gazeteoku.com'dan manÃ…Å¸etleri ÃƒÂ§ek (CORS proxy ile)
    const fetchGazeteMansetleri = async () => {
        setGazeteLoading(true);
        setGazeteError('');
        setGazeteItems([]);
        try {
            const proxies = [
                (u) => 'https://corsproxy.io/?' + encodeURIComponent(u),
                (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
                (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
            ];
            let html = '';
            // 1. DoÃ„Å¸rudan fetch dene
            try {
                const r = await fetch('https://www.gazeteoku.com/gazeteler');
                if (r.ok) { const t = await r.text(); if (t.length > 5000 && !t.includes('Access Denied')) html = t; }
            } catch(e) {}
            // 2. CORS proxy ile dene
            if (!html) {
                for (const proxyFn of proxies) {
                    try {
                        const proxyUrl = proxyFn('https://www.gazeteoku.com/gazeteler');
                        const r = await fetch(proxyUrl);
                        if (r.ok) { const t = await r.text(); if (t.length > 5000 && !t.includes('Access Denied')) { html = t; break; } }
                    } catch(e) {}
                }
            }
            if (!html) throw new Error('Gazete manÃ…Å¸etleri yÃƒÂ¼klenemedi. AÃ„Å¸ baÃ„Å¸lantÃ„Â±nÃ„Â±zÃ„Â± kontrol edin.');
            // img etiketlerinden gazete bilgilerini ÃƒÂ§Ã„Â±kar
            const regex = /<img[^>]+(?:src="([^"]+)"[^>]+alt="([^"]+)"|alt="([^"]+)"[^>]+src="([^"]+)")/gi;
            const items = [];
            const seen = new Set();
            let match;
            while ((match = regex.exec(html)) !== null) {
                const src = (match[1] || match[4] || '').trim();
                const name = (match[2] || match[3] || '').trim();
                if (name.length > 2 && src && !seen.has(name) && src.includes('storage/files/images')) {
                    seen.add(name);
                    items.push({ name, src: src.startsWith('http') ? src : 'https://i.gazeteoku.com' + src });
                }
            }
            if (items.length === 0) throw new Error('Gazete bulunamadÃ„Â±. Sayfa yapÃ„Â±sÃ„Â± deÃ„Å¸iÃ…Å¸miÃ…Å¸ olabilir.');
            setGazeteItems(items);
            addSystemLog(items.length + ' gazete manÃ…Å¸eti yÃƒÂ¼klendi.', 'success');
        } catch (e) {
            setGazeteError(e.message);
            addSystemLog('Gazete yÃƒÂ¼kleme hatasÃ„Â±: ' + e.message, 'error');
        } finally {
            setGazeteLoading(false);
        }
    };

    // Crop modal aÃƒÂ§
    const openCropModal = (src, name) => {
        setGazeteCropModal({ src, name });
    };

    // Canvas'tan crop yapÃ„Â±p medya listesine aktar
    const applyCrop = (cropDataUrl, gazeteName) => {
        const newFile = {
            name: gazeteName + '_crop.png',
            type: 'image/png',
            data: cropDataUrl
        };
        setUiState(prev => ({
            ...prev,
            selectedMediaFiles: [...(prev.selectedMediaFiles || []), newFile]
        }));
        setGazeteCropModal(null);
        setActiveTab('media');
        addSystemLog('Crop medyaya aktarÃ„Â±ldÃ„Â±: ' + gazeteName, 'success');
    };

    // Tam gazete gÃƒÂ¶rselini doÃ„Å¸rudan medyaya aktar (crop olmadan)
    const addFullImageToMedia = async (src, name) => {
        try {
            setGazeteLoading(true);
            // GÃƒÂ¶rseli canvas'a yÃƒÂ¼kle ve data URL'e ÃƒÂ§evir
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const dataUrl = await new Promise((resolve, reject) => {
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = img.naturalWidth;
                    c.height = img.naturalHeight;
                    c.getContext('2d').drawImage(img, 0, 0);
                    resolve(c.toDataURL('image/jpeg', 0.92));
                };
                img.onerror = () => reject(new Error('GÃƒÂ¶rsel yÃƒÂ¼klenemedi: ' + name));
                img.src = src;
            });
            const newFile = { name: name + '.jpg', type: 'image/jpeg', data: dataUrl };
            setUiState(prev => ({
                ...prev,
                selectedMediaFiles: [...(prev.selectedMediaFiles || []), newFile]
            }));
            setActiveTab('media');
            addSystemLog('Tam sayfa medyaya aktarÃ„Â±ldÃ„Â±: ' + name, 'success');
        } catch (e) {
            addSystemLog('Aktarma hatasÃ„Â±: ' + e.message, 'error');
        } finally {
            setGazeteLoading(false);
        }
    };

    // === CROP MODAL BÃ„Â°LEÃ…ÂENÃ„Â° ===
    const GazeteCropModal = ({ src, name, onClose, onCrop }) => {
        const containerRef = useRef(null);
        const imgRef = useRef(null);
        const [imgLoaded, setImgLoaded] = useState(false);
        const [selection, setSelection] = useState(null); // {startX, startY, endX, endY}
        const [isDragging, setIsDragging] = useState(false);
        const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

        // GÃƒÂ¶rsel yÃƒÂ¼klendiÃ„Å¸inde boyutlarÃ„Â± al
        const handleImageLoad = (e) => {
            const img = e.target;
            setImgSize({ w: img.offsetWidth, h: img.offsetHeight });
            setImgLoaded(true);
        };

        // Mouse koordinatlarÃ„Â±nÃ„Â± container-relative'a ÃƒÂ§evir
        const getRelPos = (e) => {
            const rect = containerRef.current.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
                y: Math.max(0, Math.min(e.clientY - rect.top, rect.height))
            };
        };

        const handleMouseDown = (e) => {
            e.preventDefault();
            const pos = getRelPos(e);
            setSelection({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
            setIsDragging(true);
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const pos = getRelPos(e);
            setSelection(prev => ({ ...prev, endX: pos.x, endY: pos.y }));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        // Touch desteÃ„Å¸i
        const getTouchPos = (e) => {
            const touch = e.touches[0] || e.changedTouches[0];
            const rect = containerRef.current.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(touch.clientX - rect.left, rect.width)),
                y: Math.max(0, Math.min(touch.clientY - rect.top, rect.height))
            };
        };

        const handleTouchStart = (e) => {
            const pos = getTouchPos(e);
            setSelection({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
            setIsDragging(true);
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            const pos = getTouchPos(e);
            setSelection(prev => ({ ...prev, endX: pos.x, endY: pos.y }));
        };

        const handleTouchEnd = () => setIsDragging(false);

        // Crop'u uygula
        const doCrop = () => {
            if (!selection || !imgRef.current) return;
            const img = imgRef.current;
            const dispW = img.offsetWidth;
            const dispH = img.offsetHeight;
            const natW = img.naturalWidth;
            const natH = img.naturalHeight;

            // SeÃƒÂ§im koordinatlarÃ„Â±nÃ„Â± normalize et
            const x1 = Math.min(selection.startX, selection.endX);
            const y1 = Math.min(selection.startY, selection.endY);
            const x2 = Math.max(selection.startX, selection.endX);
            const y2 = Math.max(selection.startY, selection.endY);

            // Minimum boyut kontrolÃƒÂ¼
            if (x2 - x1 < 10 || y2 - y1 < 10) return;

            // Display Ã¢â€ â€™ natural boyut dÃƒÂ¶nÃƒÂ¼Ã…Å¸ÃƒÂ¼mÃƒÂ¼
            const scaleX = natW / dispW;
            const scaleY = natH / dispH;
            const cropX = Math.round(x1 * scaleX);
            const cropY = Math.round(y1 * scaleY);
            const cropW = Math.round((x2 - x1) * scaleX);
            const cropH = Math.round((y2 - y1) * scaleY);

            // Canvas'ta crop yap
            const canvas = document.createElement('canvas');
            canvas.width = cropW;
            canvas.height = cropH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            const dataUrl = canvas.toDataURL('image/png');
            onCrop(dataUrl, name);
        };

        // SeÃƒÂ§im dikdÃƒÂ¶rtgeninin stilleri
        const selStyle = selection ? {
            left: Math.min(selection.startX, selection.endX) + 'px',
            top: Math.min(selection.startY, selection.endY) + 'px',
            width: Math.abs(selection.endX - selection.startX) + 'px',
            height: Math.abs(selection.endY - selection.startY) + 'px',
        } : null;

        return (
            <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center p-4" onClick={onClose}>
                <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    {/* BaÃ…Å¸lÃ„Â±k */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Scissors size={18} className="text-indigo-400" />
                            <span className="text-white font-bold text-sm">{name}</span>
                        </div>
                        <div className="flex gap-2">
                            {selection && (Math.abs(selection.endX - selection.startX) > 10) && (
                                <button onClick={doCrop} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                    <Check size={14} /> Crop'u Kullan
                                </button>
                            )}
                            <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Ã¢Å“â€¢ Kapat</button>
                        </div>
                    </div>
                    {/* Talimat */}
                    <p className="text-slate-400 text-[11px] mb-2">ÄŸÅ¸â€“Â±Ã¯Â¸Â Fare ile gazete ÃƒÂ¼zerinde bir alan seÃƒÂ§in, sonra "Crop'u Kullan" butonuna tÃ„Â±klayÃ„Â±n.</p>
                    {/* GÃƒÂ¶rsel + SeÃƒÂ§im alanÃ„Â± */}
                    <div ref={containerRef} className="relative flex-1 overflow-auto rounded-xl bg-black/50 select-none"
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                        style={{ cursor: 'crosshair', touchAction: 'none' }}>
                        <img ref={imgRef} src={src} crossOrigin="anonymous" onLoad={handleImageLoad}
                            className="w-full h-auto block" alt={name} draggable={false} />
                        {/* SeÃƒÂ§im dikdÃƒÂ¶rtgeni */}
                        {selection && imgLoaded && (
                            <>
                                {/* KarartÃ„Â±lmÃ„Â±Ã…Å¸ overlay - 4 div ile maske (clipPath yerine daha uyumlu) */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* ÃƒÅ“st */}
                                    <div className="absolute left-0 right-0 top-0 bg-black/50" style={{ bottom: `calc(100% - ${selStyle.top})` }} />
                                    {/* Alt */}
                                    <div className="absolute left-0 right-0 bottom-0 bg-black/50" style={{ top: `calc(${selStyle.top} + ${selStyle.height})` }} />
                                    {/* Sol */}
                                    <div className="absolute left-0 top-0 bottom-0 bg-black/50" style={{ top: selStyle.top, bottom: `calc(100% - ${selStyle.top} - ${selStyle.height})`, right: `calc(100% - ${selStyle.left})` }} />
                                    {/* SaÃ„Å¸ */}
                                    <div className="absolute right-0 top-0 bottom-0 bg-black/50" style={{ top: selStyle.top, bottom: `calc(100% - ${selStyle.top} - ${selStyle.height})`, left: `calc(${selStyle.left} + ${selStyle.width})` }} />
                                </div>
                                {/* SeÃƒÂ§im kutusu */}
                                <div className="absolute border-2 border-emerald-400 bg-emerald-400/10 pointer-events-none"
                                    style={selStyle}>
                                    <div className="absolute -top-5 left-0 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        {Math.round(Math.abs(selection.endX - selection.startX))}Ãƒâ€”{Math.round(Math.abs(selection.endY - selection.startY))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // === GAZETELER ARASI GEÃƒâ€¡Ã„Â°Ã…Â Ã„Â°Ãƒâ€¡Ã„Â°N GALERÃ„Â° MODU ===
    const [gazeteGalleryView, setGazeteGalleryView] = useState('grid'); // 'grid' | 'single'
    const [gazeteCurrentIdx, setGazeteCurrentIdx] = useState(0);

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans p-3 md:p-4 relative overflow-hidden">
            <div className="max-w-3xl mx-auto">
                {/* NVIDIA + GEMINI API KEY PANELÃ„Â° */}
                {showApiKeyPanel && (
                    <div className="mb-4 p-4 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={18} className="text-amber-400" />
                            <h2 className="text-sm font-bold text-amber-300">API AnahtarlarÃ„Â± Gerekli</h2>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">NVIDIA (metin, ÃƒÂ¶nce) ve Gemini (gÃƒÂ¶rsel + TTS + fallback metin) ayrÃ„Â± anahtarlardÃ„Â±r. AyrÃ„Â±ca {AI_PROVIDERS.length} adet ÃƒÂ¼cretsiz OpenAI-uyumlu saÃ„Å¸layÃ„Â±cÃ„Â± fallback zincirine eklenmiÃ…Å¸tir. Anahtarlar tarayÃ„Â±cÃ„Â±da (sessionStorage) saklanÃ„Â±r, koda gÃƒÂ¶mÃƒÂ¼lmez.</p>
                        <button
                            onClick={fillProvidedKeys}
                            className="mb-3 w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                        >Ã¢â€Â¹Ã¯Â¸Â AnahtarlarÃ„Â± Nereye GireceÃ„Å¸imi Bilmiyorum</button>
                        <label className="block text-xs text-slate-400 mb-1">NVIDIA API Key (nvapi-...)</label>
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="nvapi-..."
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-amber-400"
                        />
                        <label className="block text-xs text-slate-400 mb-1">Gemini API Key (AIza...)</label>
                        <input
                            type="password"
                            value={geminiKeyInput}
                            onChange={(e) => setGeminiKeyInput(e.target.value)}
                            placeholder="AIza..."
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-amber-400"
                        />
                        <div className="grid grid-cols-2 gap-2 mb-3">
                        {AI_PROVIDERS.map(p => (
                            <div key={p.id}>
                                <label className="block text-[10px] text-slate-400 mb-1">{p.label}</label>
                                <input
                                    type="password"
                                    value={providerInputs[p.id] || ''}
                                    onChange={(e) => setProviderInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    placeholder={p.label + ' key'}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                                />
                            </div>
                        ))}
                        </div>
                        <label className="block text-xs text-slate-400 mb-1">NVIDIA Model</label>
                        <input
                            type="text"
                            value={nvidiaModel}
                            onChange={(e) => setNvidiaModel(e.target.value)}
                            placeholder="nvidia/llama-3.1-nemotron-70b-instruct"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-amber-400"
                        />
                        <button
                            onClick={saveApiKey}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 rounded-lg text-sm transition-colors"
                        >Kaydet ve Devam Et</button>
                    </div>
                )}
                {!showApiKeyPanel && (
                    <button
                        onClick={() => setShowApiKeyPanel(true)}
                        className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 hover:text-amber-300 transition-colors"
                    ><ShieldCheck size={14} /> NVIDIA: {apiKeyInput ? 'Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢ ' + apiKeyInput.slice(-4) : 'yok'} <span className="text-slate-600">|</span> Gemini: {geminiKeyInput ? 'Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢ ' + geminiKeyInput.slice(-4) : 'yok'} <span className="text-amber-300">(deÃ„Å¸iÃ…Å¸tir)</span></button>
                )}

                <div className="text-center mb-4 flex items-center justify-center gap-3">
                    <h1 className="text-xl md:text-3xl font-black tracking-tight text-white whitespace-nowrap">OTONOM</h1>
                    <div className="bg-indigo-900/40 border-2 border-indigo-500/50 px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                    <p className="text-indigo-300 text-[10px] md:text-xs font-black tracking-widest uppercase">
                             Hermes H1.151 <span className="mx-1 text-white">Ã¢â‚¬Â¢</span> One-Page
                         </p>
                    </div>
                </div>

                {pendingJob && (
                    <div className="mb-6 bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-amber-400">
                            <AlertCircle size={20} className="shrink-0 animate-pulse" />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider">YarÃ„Â±m Kalan Ã„Â°Ã…Å¸lem</p>
                                <p className="text-xs text-slate-300">Son render kurtarÃ„Â±labilir.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={async () => { await AssetManagerService.clearJob(pendingJob.jobId); setPendingJob(null); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition">Yoksay</button>
                            <button onClick={() => { workflowRef.current.state = pendingJob; setPendingJob(null); handleExecuteResume(); }} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition">Devam Et</button>
                        </div>
                    </div>
                )}

                {/* ARKA PLAN SESÃ„Â° */}
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-3 mb-4 shadow-lg">
                    <div className="bg-black/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between relative">
                        <div className="flex items-center gap-3 w-full">
                            <div className={`w-10 h-10 rounded border ${(prefs.ambientSound && prefs.ambientSound !== 'none') ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'} flex items-center justify-center shrink-0`}><CloudRain size={18} /></div>
                            <div className="w-full flex-1 pr-2">
                                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Arka Plan Sesi</p>
                                <CustomSelect value={prefs.ambientSound || "none"} onChange={(val) => { if (['rain', 'wind', 'waves', 'fire', 'none'].includes(val)) { setPrefs({ ...prefs, ambientSound: val }); if (val === 'none') { AssetManagerService.loadMedia('CUSTOM_MUSIC').then(u => { if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); }); AssetManagerService.deleteMedia('CUSTOM_MUSIC'); } } else { handleFolderMusicSelect(val); } }} options={ambientOptions} />
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0 relative z-10">
                            {(prefs.ambientSound && !['none', 'rain', 'wind', 'waves', 'fire'].includes(prefs.ambientSound)) && <button onClick={deleteMusic} className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-500 p-2 rounded-lg transition"><Trash2 size={16} /></button>}
                            <button onClick={handleFolderSelect} className="bg-violet-600 hover:bg-violet-500 text-white px-3 md:px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition whitespace-nowrap">MÃƒÅ“ZÃ„Â°K KLASÃƒâ€“RÃƒÅ“ SEÃƒâ€¡</button>
                            <input ref={musicFileInputRef} type="file" webkitdirectory="true" directory="true" multiple accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.wma" className="hidden" onChange={handleFolderSelectLegacy} />
                        </div>
                    </div>
                    {studioMedia.musicList.length > 0 && (
                        <div className="mt-2">
                            <input type="text" placeholder="MÃƒÂ¼zik ara..." value={musicSearchQuery} onChange={e => setMusicSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500 transition" />
                        </div>
                    )}
                    {studioMedia.syncedFolderName && (
                        <div className="mt-2 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={12} className="text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                                <span className="text-[10px] text-emerald-400 font-bold">Otomatik: {studioMedia.syncedFolderName}</span>
                            </div>
                            <button onClick={clearSyncedFolder} className="text-[10px] text-slate-400 hover:text-rose-400 transition">KaldÃ„Â±r</button>
                        </div>
                    )}
                    {studioMedia.musicList.length === 0 && (
                        <p className="text-[9px] text-slate-500 mt-1.5 text-center">MÃƒÂ¼zik klasÃƒÂ¶rÃƒÂ¼ seÃƒÂ§in Ã¢â‚¬â€ tÃƒÂ¼m mÃƒÂ¼zikler otomatik yÃƒÂ¼klenir</p>
                    )}
                </div>

                {/* ANA Ã„Â°Ãƒâ€¡ERÃ„Â°K */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 md:p-4 shadow-2xl relative z-10 mb-4">
                    <div className="flex flex-col sm:flex-row gap-2 bg-black/30 p-1.5 rounded-xl mb-4 flex-wrap">
                        <button onClick={() => setActiveTab('text')} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Metin / Haber</button>
                        <button onClick={() => setActiveTab('url')} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Haber Linki</button>
                        <button onClick={() => setActiveTab('media')} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'media' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Medya Analizi</button>
                        <button onClick={() => setActiveTab('prompt')} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeTab === 'prompt' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Serbest Prompt</button>
                        <button onClick={() => { setActiveTab('gazete'); if (gazeteItems.length === 0) fetchGazeteMansetleri(); }} className={`flex-1 min-w-[120px] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'gazete' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Newspaper size={14} /> Gazete Takip</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 font-bold">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Clock} value={config.duration} onChange={(val) => setConfig({ ...config, duration: val })} options={[{ value: 'unlimited', label: 'Ã¢Ë†Â SÃ„Â±nÃ„Â±rsÃ„Â±z', color: 'text-emerald-400 font-bold' }, { value: '15', label: '15-30s' }, { value: '30', label: '30-60s' }, { value: '60', label: '60-90s' }, { value: '90', label: '90-120s' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Smartphone} value={config.aspectRatio || '9:16'} onChange={(val) => setConfig({ ...config, aspectRatio: val })} options={[{ value: '9:16', label: 'Dikey (9:16)' }, { value: '16:9', label: 'Yatay (16:9)' }, { value: '1:1', label: 'Kare (1:1)' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Clapperboard} value={config.videoStyle || 'explainer'} onChange={(val) => setConfig({ ...config, videoStyle: val })} options={[{ value: 'news_flash', label: 'Haber BÃƒÂ¼lteni' }, { value: 'cinematic', label: 'Sinematik' }, { value: 'explainer', label: 'AÃƒÂ§Ã„Â±klayÃ„Â±cÃ„Â±' }, { value: 'weekly_roundup', label: 'HaftalÃ„Â±k Ãƒâ€“zet' }, { value: 'prompt_output', label: 'Custom Prompt', color: 'text-fuchsia-400 font-bold' }]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Palette} value={config.imageStyle || 'cinematic'} onChange={(val) => setConfig({ ...config, imageStyle: val })} options={[{ value: 'watercolor', label: 'Sulu Boya' }, { value: 'sketch', label: 'Karakalem' }, { value: 'oil_painting', label: 'YaÃ„Å¸lÃ„Â± Boya' }, { value: 'cinematic', label: 'GerÃƒÂ§ekÃƒÂ§i' }, { value: 'minimalist', label: 'Minimalist' }, { value: 'cyberpunk', label: 'Cyberpunk' }, { value: 'retro', label: 'Retro' }, { value: '3d_render', label: '3D Render' }, { value: 'anime', label: 'Anime' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
                            <Monitor size={16} className="text-indigo-400 shrink-0" />
                            <div className="flex gap-2 w-full">{['1K', '2K', '4K'].map(res => (<button key={res} onClick={() => setConfig({ ...config, resolution: res })} className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${config.resolution === res ? 'bg-slate-200 text-slate-900' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'}`}>{res}</button>))}</div>
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Activity} value={config.transition || 'none'} onChange={(val) => setConfig({ ...config, transition: val })} options={[{ value: 'none', label: 'Yok' }, { value: 'crossfade', label: 'KarÃ„Â±Ã…Å¸Ã„Â±r' }, { value: 'fadeIn', label: 'YavaÃ…Å¸ÃƒÂ§a Belirme' }, { value: 'fadeOut', label: 'YavaÃ…Å¸ÃƒÂ§a Kaybolma' }, { value: 'slideIn', label: 'Kayarak GiriÃ…Å¸' }, { value: 'slideOut', label: 'Kayarak Ãƒâ€¡Ã„Â±kÃ„Â±Ã…Å¸' }]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Clapperboard} value={config.tip || 'haber'} onChange={(val) => setConfig({ ...config, tip: val })} options={[{ value: 'haber', label: 'Haber', color: 'text-emerald-400 font-bold' }, { value: 'guzel_soz', label: 'GÃƒÂ¼zel SÃƒÂ¶z', color: 'text-amber-400 font-bold' }, { value: 'iddia_analizi', label: 'Ã„Â°ddia Analizi', color: 'text-cyan-400 font-bold' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Globe} value={config.language || 'tr'} onChange={(val) => setConfig({ ...config, language: val })} options={[{ value: 'tr', label: 'TÃƒÂ¼rkÃƒÂ§e' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'FranÃƒÂ§ais' }, { value: 'de', label: 'Deutsch' }, { value: 'es', label: 'EspaÃƒÂ±ol' }, { value: 'ar', label: 'Ã˜Â§Ã™â€Ã˜Â¹Ã˜Â±Ã˜Â¨Ã™Å Ã˜Â©' }, { value: 'ru', label: 'ÄÂ Ã‘Æ’Ã‘ÂÃ‘ÂÄÂºÄÂ¸ÄÂ¹' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={MessageSquare} value={config.subtitles || 'on'} onChange={(val) => setConfig({ ...config, subtitles: val })} options={[{ value: 'on', label: 'AltyazÃ„Â±: AÃƒÂ§Ã„Â±k' }, { value: 'off', label: 'AltyazÃ„Â±: KapalÃ„Â±' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Type} value={config.analysisMode || 'yorumsuz'} onChange={(val) => setConfig({ ...config, analysisMode: val })} options={[{ value: 'yorumsuz', label: 'Yorumsuz' }, { value: 'visibility', label: 'GÃƒÂ¶rÃƒÂ¼nÃƒÂ¼rlÃƒÂ¼k' }, { value: 'deep_analysis', label: 'Derin Analiz', color: 'text-fuchsia-400 font-bold' }]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center">
                            <CustomSelect icon={Film} value={config.videoFormat || 'webm'} onChange={(val) => setConfig({ ...config, videoFormat: val })} options={[{ value: 'webm', label: 'WebM' }, { value: 'mp4', label: 'MP4' }]} />
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800 flex items-center relative">
                            <div className="flex items-center gap-2 w-full">
                                <CustomSelect icon={Volume2} value={prefs.narratorVoice} onChange={(val) => setPrefs({ ...prefs, narratorVoice: val })} options={voiceOptions} />
                                <button onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }} className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider transition-colors shrink-0"><Filter size={12} /> Filtreler</button>
                            </div>
                            {showFilters && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[200] p-3 space-y-3">
                                    <div><div className="text-[9px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Gender</div><div className="flex gap-1.5">{['Any', 'Male', 'Female'].map(g => (<button key={g} onClick={() => setVoiceFilters({ ...voiceFilters, gender: g })} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${voiceFilters.gender === g ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>{g}</button>))}</div></div>
                                    <div><div className="text-[9px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Age</div><div className="flex flex-wrap gap-1.5">{['Any', 'Child', 'Young', 'Middle-aged', 'Elderly'].map(a => (<button key={a} onClick={() => setVoiceFilters({ ...voiceFilters, age: a })} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${voiceFilters.age === a ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>{a}</button>))}</div></div>
                                    <div><div className="text-[9px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Category</div><div className="flex flex-wrap gap-1.5">{['Any', 'Games & RPG', 'Audiobooks & Novels', 'Anime & Animation', 'Documentary', 'Commercials & Trailers', 'Corporate & Narration'].map(c => (<button key={c} onClick={() => setVoiceFilters({ ...voiceFilters, category: c })} className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all border ${voiceFilters.category === c ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>{c}</button>))}</div></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KAYNAK ADI + SABÃ„Â°T GÃƒâ€“RSEL + YORUM */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-black/30 p-2 rounded-xl border border-slate-800 flex items-center justify-center">
                            {studioMedia.customSceneImages && studioMedia.customSceneImages[0] ? (
                                <img src={studioMedia.customSceneImages[0]} className="w-full h-10 object-cover rounded-lg" alt="Sabit" />
                            ) : (
                                <div className="text-[8px] text-slate-600 font-bold uppercase">GÃƒÂ¶rsel Yok</div>
                            )}
                        </div>
                        <div className="bg-black/30 p-1.5 rounded-xl border border-slate-800">
                            <div className="flex items-center gap-2">
                                <CustomSelect icon={null} value={config.sourceName || ''} onChange={(val) => setConfig({ ...config, sourceName: val })} options={[
                                    { value: '', label: 'Kaynak Yok', color: 'text-slate-500' },
                                    { label: 'Sosyal Medya', options: [
                                        { value: 'X', label: 'X (Twitter)' }, { value: 'TikTok', label: 'TikTok' }, { value: 'Instagram', label: 'Instagram' }, { value: 'Facebook', label: 'Facebook' }
                                    ]},
                                    { label: 'Gazeteler', options: [
                                        { value: 'Sabah', label: 'Sabah' }, { value: 'HÃƒÂ¼rriyet', label: 'HÃƒÂ¼rriyet' }, { value: 'SÃƒÂ¶zcÃƒÂ¼', label: 'SÃƒÂ¶zcÃƒÂ¼' }, { value: 'Milliyet', label: 'Milliyet' }, { value: 'Posta', label: 'Posta' }, { value: 'HabertÃƒÂ¼rk', label: 'HabertÃƒÂ¼rk' }, { value: 'Fanatik', label: 'Fanatik' }, { value: 'Takvim', label: 'Takvim' }, { value: 'TÃƒÂ¼rkiye Gazetesi', label: 'TÃƒÂ¼rkiye Gazetesi' }, { value: 'Yeni Ã…Âafak', label: 'Yeni Ã…Âafak' }, { value: 'Cumhuriyet', label: 'Cumhuriyet' }, { value: 'BirgÃƒÂ¼n', label: 'BirgÃƒÂ¼n' }, { value: 'AydÃ„Â±nlÃ„Â±k', label: 'AydÃ„Â±nlÃ„Â±k' }, { value: 'YeniÃƒÂ§aÃ„Å¸', label: 'YeniÃƒÂ§aÃ„Å¸' }, { value: 'Evrensel', label: 'Evrensel' }, { value: 'Karar', label: 'Karar' }, { value: 'DiriliÃ…Å¸ PostasÃ„Â±', label: 'DiriliÃ…Å¸ PostasÃ„Â±' }, { value: 'Milat', label: 'Milat' }, { value: 'Korkusuz', label: 'Korkusuz' }, { value: 'DÃƒÂ¼nya', label: 'DÃƒÂ¼nya' }, { value: 'Yeni Birlik', label: 'Yeni Birlik' }, { value: 'Milli Gazete', label: 'Milli Gazete' }, { value: 'TavÃ„Â±r', label: 'TavÃ„Â±r' }, { value: 'Nefes', label: 'Nefes' }, { value: 'AkÃ…Å¸am', label: 'AkÃ…Å¸am' }, { value: 'Gazete Pencere', label: 'Gazete Pencere' }, { value: 'NasÃ„Â±l Bir Ekonomi', label: 'NasÃ„Â±l Bir Ekonomi' }, { value: 'Yeni Mesaj', label: 'Yeni Mesaj' }, { value: 'Analiz', label: 'Analiz' }, { value: 'BugÃƒÂ¼n', label: 'BugÃƒÂ¼n' }, { value: 'Yeni Asya', label: 'Yeni Asya' }, { value: 'FotomaÃƒÂ§', label: 'FotomaÃƒÂ§' }
                                    ]}
                                ]} className="flex-1" />
                            </div>
                            <input
                                type="text"
                                value={config.sourceName || ''}
                                onChange={(e) => setConfig({ ...config, sourceName: e.target.value })}
                                placeholder="Manuel kaynak adÃ„Â± yaz..."
                                className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600 font-bold mt-1.5 px-1 py-1 border-t border-slate-700/50"
                            />
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl border border-slate-800">
                            <textarea value={config.yorum || ''} onChange={(e) => setConfig({ ...config, yorum: e.target.value })} placeholder="Yorum (2-3 satÃ„Â±r)" className="w-full bg-transparent text-[10px] text-slate-200 outline-none placeholder:text-slate-600 font-bold resize-none h-8 leading-tight" rows={2} />
                        </div>
                    </div>

                    {/* SABÃ„Â°T GÃƒâ€“RSELLER + MEDYA Ã¢â‚¬â€ yan yana */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        {/* SABÃ„Â°T GÃƒâ€“RSELLER */}
                        <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-2.5 shadow-lg">
                            <h2 className="text-[10px] font-black text-cyan-400 mb-1 flex items-center gap-1.5"><Layers size={12} /> SABÃ„Â°T GÃƒâ€“RSELLER (SINIRSIZ)</h2>
                            <div className="flex flex-wrap gap-2">
                                {studioMedia.customSceneImages && studioMedia.customSceneImages.map((img, idx) => (
                                    <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shadow-md group">
                                        <img src={img} className="w-full h-full object-cover" alt={`Sabit ${idx}`} />
                                        <button onClick={() => handleCustomSceneImageDelete(idx)} className="absolute top-0.5 right-0.5 bg-rose-500/80 group-hover:opacity-100 hover:bg-rose-500 text-white p-0.5 rounded transition opacity-0 shadow-lg"><Trash2 size={10} /></button>
                                        <div className="absolute bottom-0 left-0 bg-black/70 w-full text-center text-[7px] font-bold py-0.5 text-cyan-400 backdrop-blur-sm tracking-wider">S{idx + 1}</div>
                                    </div>
                                ))}
                                {(!studioMedia.customSceneImages || studioMedia.customSceneImages.length < 999) && (
                                    <label className="w-14 h-14 rounded-lg border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center justify-center cursor-pointer transition text-cyan-400">
                                        <UploadCloud size={16} className="mb-0.5 opacity-80" /><span className="text-[7px] font-bold uppercase tracking-wider opacity-80">Ekle</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleCustomSceneImagesUpload} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* MEDYA YÃƒÅ“KLE */}
                        <div className="bg-black/30 border border-slate-800 rounded-xl p-2.5 shadow-lg">
                            <h2 className="text-[10px] font-black text-indigo-400 mb-1 flex items-center gap-1.5"><FileText size={12} /> MEDYA YÃƒÅ“KLE</h2>
                            <div className="flex flex-wrap gap-2">
                                {uiState.selectedMediaFiles && uiState.selectedMediaFiles.slice(0, 5).map((file, idx) => (
                                    <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shadow-md group">
                                        {file.type.startsWith('image') ? <img src={file.data} className="w-full h-full object-cover" alt={`Medya ${idx}`} /> : <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-indigo-400 bg-slate-900">{file.name.split('.').pop().toUpperCase()}</div>}
                                        <button onClick={() => setUiState(prev => ({ ...prev, selectedMediaFiles: prev.selectedMediaFiles.filter((_, i) => i !== idx) }))} className="absolute top-0.5 right-0.5 bg-rose-500/80 group-hover:opacity-100 hover:bg-rose-500 text-white p-0.5 rounded transition opacity-0 shadow-lg"><Trash2 size={10} /></button>
                                        <div className="absolute bottom-0 left-0 bg-black/70 w-full text-center text-[7px] font-bold py-0.5 text-indigo-400 backdrop-blur-sm tracking-wider">M{idx + 1}</div>
                                    </div>
                                ))}
                                <label className="w-14 h-14 rounded-lg border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/10 flex flex-col items-center justify-center cursor-pointer transition text-indigo-400">
                                    <UploadCloud size={16} className="mb-0.5 opacity-80" /><span className="text-[7px] font-bold uppercase tracking-wider opacity-80">Ekle</span>
                                    <input type="file" multiple accept="*/*" className="hidden" onChange={(e) => { processSelectedFiles(Array.from(e.target.files)); e.target.value = null; }} />
                                </label>
                                {uiState.selectedMediaFiles.length > 5 && <div className="w-14 h-14 rounded-lg bg-slate-800/50 flex items-center justify-center text-[9px] text-slate-400 font-bold border border-slate-700">+{uiState.selectedMediaFiles.length - 5}</div>}
                            </div>
                        </div>
                    </div>

                    {/* === GAZETE TAKÃ„Â°P GALERÃ„Â°SÃ„Â° === */}
                    {activeTab === 'gazete' && (
                        <div className="mb-3">
                            {/* Kaynak seÃƒÂ§ici + Yenile */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex-1 flex gap-1.5">
                                    {[{id:'gazeteoku', label:'Gazeteoku (25+ Gazete)'}, {id:'aydinlik', label:'AydÃ„Â±nlÃ„Â±k'}, {id:'yenimesaj', label:'Yeni Mesaj'}].map(src => (
                                        <button key={src.id} onClick={() => { setGazeteSource(src.id); }}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${gazeteSource === src.id ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500'}`}>
                                            {src.label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={fetchGazeteManÃ…Å¸etleri} disabled={gazeteLoading}
                                    className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-slate-700">
                                    {gazeteLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Yenile
                                </button>
                            </div>

                            {/* Hata mesajÃ„Â± */}
                            {gazeteError && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs font-bold mb-3 flex items-center gap-2">
                                    <AlertCircle size={14} /> {gazeteError}
                                </div>
                            )}

                            {/* YÃƒÂ¼kleniyor */}
                            {gazeteLoading && (
                                <div className="text-center py-12">
                                    <Loader2 size={32} className="text-emerald-400 animate-spin mx-auto mb-3" />
                                    <p className="text-slate-400 text-sm font-bold">Gazete manÃ…Å¸etleri yÃƒÂ¼kleniyor...</p>
                                </div>
                            )}

                            {/* Galeri Grid */}
                            {!gazeteLoading && gazeteItems.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">{gazeteItems.length} gazete bulundu</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => setGazeteGalleryView('grid')} className={`p-1.5 rounded-lg text-[10px] ${gazeteGalleryView === 'grid' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Ã¢â€“Â¦</button>
                                            <button onClick={() => setGazeteGalleryView('single')} className={`p-1.5 rounded-lg text-[10px] ${gazeteGalleryView === 'single' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Ã¢ËœÂ</button>
                                        </div>
                                    </div>

                                    {gazeteGalleryView === 'grid' ? (
                                        /* GRID GÃƒâ€“RÃƒÅ“NÃƒÅ“MÃƒÅ“ Ã¢â‚¬â€ kÃƒÂ¼ÃƒÂ§ÃƒÂ¼k kartlar */
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[50vh] overflow-y-auto p-1">
                                            {gazeteItems.map((item, idx) => (
                                                <div key={idx} className="group relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-emerald-500/50 transition-all cursor-pointer"
                                                    onClick={() => { setGazeteCurrentIdx(idx); setGazeteGalleryView('single'); }}>
                                                    <img src={item.src} crossOrigin="anonymous" className="w-full h-auto block" alt={item.name} loading="lazy" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-1.5">
                                                        <span className="text-white text-[8px] font-bold text-center leading-tight">{item.name}</span>
                                                    </div>
                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                                        <button onClick={(e) => { e.stopPropagation(); openCropModal(item.src, item.name); }}
                                                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded-md shadow-lg" title="Crop yap">
                                                            <Scissors size={10} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); addFullImageToMedia(item.src, item.name); }}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-md shadow-lg" title="Tam sayfa ekle">
                                                            <Check size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* TEKLÃ„Â° GÃƒâ€“RÃƒÅ“NÃƒÅ“M Ã¢â‚¬â€ bÃƒÂ¼yÃƒÂ¼k ÃƒÂ¶nizleme */
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <button onClick={() => setGazeteCurrentIdx(Math.max(0, gazeteCurrentIdx - 1))} disabled={gazeteCurrentIdx === 0}
                                                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Ã¢â€ Â Ãƒâ€“nceki</button>
                                                <span className="text-white text-sm font-bold">{gazeteItems[gazeteCurrentIdx]?.name} <span className="text-slate-500">({gazeteCurrentIdx + 1}/{gazeteItems.length})</span></span>
                                                <button onClick={() => setGazeteCurrentIdx(Math.min(gazeteItems.length - 1, gazeteCurrentIdx + 1))} disabled={gazeteCurrentIdx >= gazeteItems.length - 1}
                                                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Sonraki Ã¢â€ â€™</button>
                                            </div>
                                            <div className="relative bg-black/50 rounded-xl overflow-hidden border border-slate-700/50">
                                                <img src={gazeteItems[gazeteCurrentIdx]?.src} crossOrigin="anonymous" className="w-full h-auto block" alt={gazeteItems[gazeteCurrentIdx]?.name} />
                                                {/* Overlay butonlar */}
                                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                                    <button onClick={() => openCropModal(gazeteItems[gazeteCurrentIdx]?.src, gazeteItems[gazeteCurrentIdx]?.name)}
                                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/30">
                                                        <Scissors size={14} /> Crop Yap
                                                    </button>
                                                    <button onClick={() => addFullImageToMedia(gazeteItems[gazeteCurrentIdx]?.src, gazeteItems[gazeteCurrentIdx]?.name)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/30">
                                                        <Check size={14} /> Tam Sayfa Ekle
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BoÃ…Å¸ durum */}
                            {!gazeteLoading && gazeteItems.length === 0 && !gazeteError && (
                                <div className="text-center py-12">
                                    <Newspaper size={48} className="text-slate-700 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm font-bold">Gazete manÃ…Å¸etleri yÃƒÂ¼klenmedi</p>
                                    <p className="text-slate-600 text-xs mt-1">YukarÃ„Â±daki "Yenile" butonuna tÃ„Â±klayÃ„Â±n</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CROP MODAL */}
                    {gazeteCropModal && (
                        <GazeteCropModal
                            src={gazeteCropModal.src}
                            name={gazeteCropModal.name}
                            onClose={() => setGazeteCropModal(null)}
                            onCrop={applyCrop}
                        />
                    )}

                    {/* METÃ„Â°N GÃ„Â°RÃ„Â°Ã…ÂÃ„Â° (text/URL/prompt iÃƒÂ§in) */}
                    {activeTab !== 'media' && activeTab !== 'gazete' && (
                        <textarea value={textInput} onChange={e => setTextInput(e.target.value)} placeholder={(config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? (activeTab === 'url' ? "Konu linkini yapÃ„Â±Ã…Å¸tÃ„Â±rÃ„Â±n..." : "Konu baÃ…Å¸lÃ„Â±Ã„Å¸Ã„Â± yazÃ„Â±n... (Ãƒâ€“rn: 'Ãƒâ€“zgÃƒÂ¼rlÃƒÂ¼Ã„Å¸ÃƒÂ¼n Bedeli', 'Adalet GÃƒÂ¼ÃƒÂ§lÃƒÂ¼ler Ã„Â°ÃƒÂ§in Mi?')") : (activeTab === 'url' ? "Haber linkini yapÃ„Â±Ã…Å¸tÃ„Â±rÃ„Â±n..." : "Haberi yazÃ„Â±n veya araÃ…Å¸tÃ„Â±rÃ„Â±lacak gÃƒÂ¼ndemi verin...")} className={`w-full h-20 bg-black/30 border rounded-xl p-3 text-sm outline-none mb-3 text-slate-200 resize-none transition-all relative z-0 ${activeTab === 'prompt' ? 'border-fuchsia-500/50 focus:border-fuchsia-500' : 'border-slate-800 focus:border-indigo-500'}`} />
                    )}

                    <div className="flex justify-between items-center mb-3 px-2">
                        {config.tip === 'iddia_analizi' ? (
                            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20">Ã„Â°ddia Analizi Ã¢â‚¬â€ Fact Check + Video ÃƒÅ“retimi</span>
                        ) : config.tip === 'guzel_soz' ? (
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">Felsefi Video Ã¢â‚¬â€ Hook + DÃƒÂ¼Ã…Å¸ÃƒÂ¼nÃƒÂ¼r SÃƒÂ¶zleri + CTA</span>
                        ) : (<><span className="text-xs text-slate-500 flex items-center gap-1"><Type size={12} /> Dil: {getWPS(config.language)} kelime/sn</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">Hedef: ~{maxWordsUI} kelime</span></>)}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 relative z-0">
                        <button onClick={() => handleExecuteStart(uiState.selectedMediaFiles, 'image')} disabled={uiState.isProcessing || ((config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? (!textInput.trim() && uiState.selectedMediaFiles.length === 0) : ((activeTab === 'media' || activeTab === 'gazete') ? uiState.selectedMediaFiles.length === 0 : !textInput.trim()))} className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 py-2.5 md:py-3 rounded-full font-medium text-xs transition-all border border-slate-700 flex items-center justify-center gap-2">
                            {uiState.isProcessing && config.outputType === 'image' ? <><Loader2 size={16} className="animate-spin" /> Ã„Â°Ã…ÂLENÃ„Â°YOR...</> : <><ImagePlus size={16} /> {config.tip === 'iddia_analizi' ? 'Ã„Â°ddia Analizi Yap' : (config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? 'Kart OluÃ…Å¸tur' : 'GÃƒÂ¶rsel oluÃ…Å¸tur'}</>}
                        </button>
                        <button onClick={() => handleExecuteStart(uiState.selectedMediaFiles, 'video')} disabled={uiState.isProcessing || ((config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? (!textInput.trim() && uiState.selectedMediaFiles.length === 0) : ((activeTab === 'media' || activeTab === 'gazete') ? uiState.selectedMediaFiles.length === 0 : !textInput.trim()))} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-indigo-400 text-white py-2.5 md:py-3 rounded-full font-bold text-xs transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                            {uiState.isProcessing && config.outputType === 'video' ? <><Loader2 size={16} className="animate-spin" /> Ã„Â°Ã…ÂLENÃ„Â°YOR...</> : <>{config.tip === 'iddia_analizi' ? <><Eye size={16} /> Ã„Â°ddia Analizi</> : (config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? <><Wand2 size={16} /> GÃƒÂ¼zel SÃƒÂ¶z OluÃ…Å¸tur</> : <><Clapperboard size={16} /> Video oluÃ…Å¸tur</>}</>}
                        </button>
                    </div>
                </div>

                {/* HATA */}
                {uiState.error && (
                    <div className="mt-6 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex gap-3 text-rose-400 text-sm font-medium items-start">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <div><strong className="block mb-1">Hata</strong>{String(uiState.error)}</div>
                    </div>
                )}

                {/* Ãƒâ€¡IKTI */}
                {uiState.videoUrl && (
                    <div className="mt-8 bg-slate-900 border border-emerald-900/50 p-6 rounded-3xl shadow-2xl text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
                            <ShieldCheck size={14} /> {(config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? 'GÃƒÅ“ZEL SÃƒâ€“Z OLUÃ…ÂTURULDU' : (config.outputType === 'image' ? 'GÃƒâ€“RSEL OLUÃ…ÂTURULDU' : 'VIDEO OLUÃ…ÂTURULDU')}
                        </div>
                        {config.outputType === 'image' ? <img src={uiState.videoUrl} className="w-full max-w-md mx-auto rounded-2xl shadow-lg ring-1 ring-white/10 object-cover" alt="Output" /> : <video src={uiState.videoUrl} controls autoPlay className="w-full max-w-md mx-auto rounded-2xl shadow-lg ring-1 ring-white/10" />}
                        <div className="mt-4 flex justify-center gap-3 flex-wrap">
                            <button onClick={() => { const a = document.createElement('a'); a.href = uiState.videoUrl; const rawTitle = workflowRef.current?.state?.script?.thumbnailText || 'video'; const ext = config.outputType === 'image' ? '.png' : (config.videoFormat === 'mp4' ? '.mp4' : '.webm'); a.download = rawTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_").toLowerCase() + ext; a.click(); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"><Download size={14} /> Ã„Â°NDÃ„Â°R</button>
                            <button onClick={() => setShowSharePanel(!showSharePanel)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"><Share2 size={14} /> PAYLAÃ…Â</button>
                            <button onClick={async () => { setUiState(prev => ({ ...prev, videoUrl: null, selectedMediaFiles: [], percent: 0, statusText: '', error: '' })); setConfig(prev => ({ ...prev, yorum: '' })); for (let i = 0; i < 999; i++) await AssetManagerService.deleteMedia("CUSTOM_SCENE_IMG_" + i); setStudioMedia(s => ({ ...s, customSceneImages: [] })); }} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"><RotateCcw size={14} /> {(config.tip === 'guzel_soz' || config.tip === 'iddia_analizi') ? 'YENÃ„Â° SÃƒâ€“Z' : 'YENÃ„Â° HABER'}</button>
                        </div>

                        {showSharePanel && (
                            <div className="mt-4 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-white">Sosyal Medya PaylaÃ…Å¸Ã„Â±mÃ„Â±</h3>
                                    <button onClick={() => setShowSharePanel(false)} className="text-slate-400 hover:text-white">Ã¢Å“â€¢</button>
                                </div>
                                {/* HÃ„Â±zlÃ„Â± seÃƒÂ§im butonlarÃ„Â±: X, TikTok, Instagram, Facebook */}
                                <div className="flex gap-2 mb-3">
                                    {['x', 'tiktok', 'instagram', 'facebook'].map(pid => {
                                        const p = SOCIAL_PLATFORMS.find(pl => pl.id === pid);
                                        return (
                                            <button key={pid} onClick={() => toggleShareTarget(pid)}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${shareTargets[pid] ? 'bg-indigo-500/30 border-indigo-500/60 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                                {p.name.split(' ')[0]}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                                    {SOCIAL_PLATFORMS.map(platform => (
                                        <div key={platform.id} className={`p-3 rounded-xl border cursor-pointer transition-all ${shareTargets[platform.id] ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`} onClick={() => toggleShareTarget(platform.id)}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                                                <span className="text-xs font-bold text-white">{platform.name}</span>
                                            </div>
                                            {connectedPlatforms[platform.id] && <span className="text-[10px] text-emerald-400 mt-1 block">BaÃ„Å¸lÃ„Â±</span>}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={shareToSelectedPlatforms} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Share2 size={14} /> SeÃƒÂ§ilenlerde PaylaÃ…Å¸</button>
                                    <button onClick={copyShareLink} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-bold"><Copy size={14} /></button>
                                    {typeof navigator !== 'undefined' && navigator.share && <button onClick={nativeShare} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Cihazda PaylaÃ…Å¸</button>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Ã„Â°Ã…ÂLEM EKRANI */}
            {uiState.isProcessing && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-lg p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-300 animate-pulse" style={{ width: `${uiState.percent}%` }}></div>
                        <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4"><Loader2 size={28} className="text-indigo-400 animate-spin" /></div>
                        <h2 className="text-5xl font-black text-white mb-2">{Math.round(uiState.percent)}%</h2>
                        <p className="text-indigo-400 font-bold text-sm mb-3 uppercase tracking-widest">{uiState.statusText}</p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-mono mb-4 border border-slate-700/50"><Clock size={12} /> GeÃƒÂ§en: {elapsedSeconds}sn</div>
                        {sysLogs && sysLogs.length > 0 && (
                            <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto space-y-1.5">
                                {sysLogs.map((log, idx) => { let c = "text-slate-400"; if (log.type === "success") c = "text-emerald-400 font-bold"; if (log.type === "warn") c = "text-amber-400 font-bold"; if (log.type === "error") c = "text-rose-400 font-bold animate-pulse"; return (<div key={idx} className={`flex items-start gap-2 ${c}`}><span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span><span className="break-all">{log.text}</span></div>); })}
                                <div ref={logEndRef} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* OTURUM HATASI */}
            {authExpired && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border-2 border-red-500/40 w-full max-w-md p-8 rounded-3xl shadow-2xl text-center">
                        <h2 className="text-2xl font-black text-white mb-3">OTURUM SÃƒÅ“RESÃ„Â° DOLDU</h2>
                        <p className="text-slate-400 text-sm mb-6">LÃƒÂ¼tfen sayfayÃ„Â± yenileyin.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleSilentRecovery} className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"><ShieldCheck size={16} /> OTURUMU YENÃ„Â°LE</button>
                            <button onClick={() => setAuthExpired(false)} className="w-full bg-slate-800 text-slate-300 font-bold py-3 rounded-xl text-xs">GÃƒâ€“ZARDI ET</button>
                            <button onClick={() => window.location.reload()} className="w-full bg-red-600/20 text-red-400 font-bold py-3 rounded-xl text-xs border border-red-500/30">SAYFAYI YENÃ„Â°LE (F5)</button>
                        </div>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} style={{ position: 'fixed', top: '-10000px', left: '-10000px', zIndex: -50 }} />
        </div>
    );
}

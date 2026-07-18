export const PROVIDER_STORAGE = {
  openrouter: 'ns_k_openrouter', zenmux: 'ns_k_zenmux', bluesminds: 'ns_k_bluesminds', mimo: 'ns_k_mimo',
  groq: 'ns_k_groq', github: 'ns_k_github', cerebras: 'ns_k_cerebras', cohere: 'ns_k_cohere', mistral: 'ns_k_mistral',
  fireworks: 'ns_k_fireworks', hyperbolic: 'ns_k_hyperbolic', sambanova: 'ns_k_sambanova', nebius: 'ns_k_nebius', scaleway: 'ns_k_scaleway',
  huggingface: 'ns_k_huggingface', opencodezen: 'ns_k_opencodezen', vercel: 'ns_k_vercel', llm7: 'ns_k_llm7', kluster: 'ns_k_kluster',
  zhipu: 'ns_k_zhipu', xai: 'ns_k_xai', deepseek: 'ns_k_deepseek', siliconflow: 'ns_k_siliconflow', nscale: 'ns_k_nscale',
  ovh: 'ns_k_ovh', chutes: 'ns_k_chutes', modelscope: 'ns_k_modelscope', ai21: 'ns_k_ai21', pollinations: 'ns_k_pollinations', aion: 'ns_k_aion'
};

export const AI_PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1/chat/completions', models: ['openai/gpt-4o-mini', 'nvidia/nemotron-3-super-120b-a12b:free', 'meta-llama/llama-3.3-70b-instruct:free'], isJsonOk: true },
  { id: 'zenmux', label: 'ZenMUX.ai', baseUrl: 'https://ai.zenmux.io/v1/chat/completions', models: ['gpt-4o-mini', 'claude-3.5-haiku', 'gemini-1.5-flash'], isJsonOk: true },
  { id: 'bluesminds', label: 'BluesMinds', baseUrl: 'https://api.bluesminds.com/v1/chat/completions', models: ['gpt-4o-mini', 'llama-3.1-70b', 'nemotron-70b'], isJsonOk: true },
  { id: 'mimo', label: 'Mimo', baseUrl: 'https://api.mimo.example/v1/chat/completions', models: ['gpt-4o-mini'], isJsonOk: true },
  { id: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1/chat/completions', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'], isJsonOk: true },
  { id: 'github', label: 'GitHub Models', baseUrl: 'https://models.inference.ai.azure.com/chat/completions', models: ['gpt-4o', 'gpt-4o-mini', 'Phi-4', 'DeepSeek-R1'], isJsonOk: false },
  { id: 'cerebras', label: 'Cerebras', baseUrl: 'https://api.cerebras.ai/v1/chat/completions', models: ['llama-3.3-70b', 'gpt-oss-120b', 'llama3.1-8b'], isJsonOk: true },
  { id: 'cohere', label: 'Cohere', baseUrl: 'https://api.cohere.com/compatibility/v1/chat/completions', models: ['command-r-plus', 'command-r7b-12-2024', 'c4ai-aya-expanse-32b'], isJsonOk: true },
  { id: 'mistral', label: 'Mistral', baseUrl: 'https://api.mistral.ai/v1/chat/completions', models: ['mistral-small-latest', 'open-mistral-7b', 'ministral-3b-latest'], isJsonOk: true },
  { id: 'fireworks', label: 'Fireworks', baseUrl: 'https://api.fireworks.ai/inference/v1/chat/completions', models: ['accounts/fireworks/models/llama-v3p3-70b-instruct', 'deepseek-r1'], isJsonOk: true },
  { id: 'hyperbolic', label: 'Hyperbolic', baseUrl: 'https://api.hyperbolic.xyz/v1/chat/completions', models: ['meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen3-235B-A22B'], isJsonOk: true },
  { id: 'sambanova', label: 'SambaNova', baseUrl: 'https://api.sambanova.ai/v1/chat/completions', models: ['Meta-Llama-3.3-70B-Instruct', 'DeepSeek-V3-0324', 'Qwen3-235B-A22B'], isJsonOk: true },
  { id: 'nebius', label: 'Nebius', baseUrl: 'https://api.nebius.ai/v1/chat/completions', models: ['meta-llama/Llama-3.3-70B-Instruct', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen3-235B-A22B'], isJsonOk: true },
  { id: 'scaleway', label: 'Scaleway', baseUrl: 'https://api.scaleway.ai/v1/chat/completions', models: ['meta/llama-3.3-70b-instruct', 'qwen3-235b-a22b-instruct-2507', 'deepseek-v3.2'], isJsonOk: true },
  { id: 'huggingface', label: 'HuggingFace', baseUrl: 'https://router.huggingface.co/v1/chat/completions', models: ['meta-llama/Llama-3.3-70B-Instruct', 'Qwen/Qwen3-235B-A22B', 'deepseek-ai/DeepSeek-V3-0324'], isJsonOk: true },
  { id: 'opencodezen', label: 'OpenCode Zen', baseUrl: 'https://api.opencode.ai/v1/chat/completions', models: ['nemotron-3-super-free', 'deepseek-v4-flash-free'], isJsonOk: true },
  { id: 'vercel', label: 'Vercel AI GW', baseUrl: 'https://ai-gateway.vercel.sh/v1/chat/completions', models: ['gpt-4o-mini', 'meta/llama-3.3-70b-instruct', 'google/gemini-2.0-flash'], isJsonOk: true },
  { id: 'llm7', label: 'LLM7.io', baseUrl: 'https://api.llm7.io/v1/chat/completions', models: ['gpt-4o-mini', 'deepseek-r1', 'qwen2.5-coder-32b', 'llama-3.3-70b'], isJsonOk: true },
  { id: 'kluster', label: 'Kluster AI', baseUrl: 'https://api.kluster.ai/v1/chat/completions', models: ['deepseek-r1', 'llama-4-maverick', 'qwen3-235b'], isJsonOk: true },
  { id: 'zhipu', label: 'Zhipu AI (GLM)', baseUrl: 'https://open.bigmodel.cn/api/paite/v4/chat/completions', models: ['glm-4.7-flash', 'glm-4.5-flash'], isJsonOk: true },
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

export const getProviderById = (id) => AI_PROVIDERS.find((p) => p.id === id);

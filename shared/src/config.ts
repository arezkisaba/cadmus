export const CONFIG = {
    APP_NAME: 'Cadmus',
    FRONTEND_PORT: 4446,
    DEEPSEEK_API_URL: 'https://api.deepseek.com/chat/completions',
    DEEPSEEK_MODEL: 'deepseek-v4-flash',
    QWEN_API_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    QWEN_MODEL: 'qwen-turbo',
    CHATGPT_API_URL: 'https://api.openai.com/v1/chat/completions',
    CHATGPT_MODEL: 'gpt-4o-mini',
    PIXABAY_API_URL: 'https://pixabay.com/api/',
    PEXELS_API_URL: 'https://api.pexels.com/v1/search',
    UNSPLASH_API_URL: 'https://api.unsplash.com/search/photos',
} as const;

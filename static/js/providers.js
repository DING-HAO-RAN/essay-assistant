/**
 * ============================================
 * 供应商预设配置模块
 * ============================================
 * 仿照cc-switch的provider presets设计
 * 为每个服务商提供预设配置，简化用户操作
 * ============================================
 */

/**
 * 供应商预设配置列表
 * 每个预设包含：名称、API地址、模型列表、默认模型、图标等
 */
var PROVIDER_PRESETS = [
    {
        id: "openai",
        name: "OpenAI",
        websiteUrl: "https://platform.openai.com",
        apiKeyUrl: "https://platform.openai.com/api-keys",
        baseUrl: "https://api.openai.com/v1",
        models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
        defaultModel: "gpt-4o-mini",
        icon: "🤖",
        iconColor: "#10a37f",
        description: "OpenAI官方API，支持GPT系列模型",
        category: "official"
    },
    {
        id: "claude",
        name: "Claude (Anthropic)",
        websiteUrl: "https://console.anthropic.com",
        apiKeyUrl: "https://console.anthropic.com/settings/keys",
        baseUrl: "https://api.anthropic.com/v1",
        models: ["claude-sonnet-4-20250514", "claude-haiku-4-20250414", "claude-3-opus-20240229"],
        defaultModel: "claude-sonnet-4-20250514",
        icon: "🧠",
        iconColor: "#d4915d",
        description: "Anthropic Claude API，擅长长文本理解",
        category: "official",
        isAnthropic: true
    },
    {
        id: "deepseek",
        name: "DeepSeek (深度求索)",
        websiteUrl: "https://platform.deepseek.com",
        apiKeyUrl: "https://platform.deepseek.com/api_keys",
        baseUrl: "https://api.deepseek.com/v1",
        models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
        defaultModel: "deepseek-chat",
        icon: "🔮",
        iconColor: "#4d6bfe",
        description: "深度求索API，中文能力强，性价比高",
        category: "cn_official"
    },
    {
        id: "moonshot",
        name: "Moonshot (月之暗面/Kimi)",
        websiteUrl: "https://platform.moonshot.cn",
        apiKeyUrl: "https://platform.moonshot.cn/console/api-keys",
        baseUrl: "https://api.moonshot.cn/v1",
        models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
        defaultModel: "moonshot-v1-8k",
        icon: "🌙",
        iconColor: "#6366f1",
        description: "月之暗面Kimi API，支持长上下文",
        category: "cn_official"
    },
    {
        id: "zhipu",
        name: "智谱AI (GLM)",
        websiteUrl: "https://open.bigmodel.cn",
        apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
        baseUrl: "https://open.bigmodel.cn/api/paas/v4",
        models: ["glm-4-flash", "glm-4", "glm-4v", "glm-3-turbo"],
        defaultModel: "glm-4-flash",
        icon: "✨",
        iconColor: "#3451b2",
        description: "智谱AI GLM系列，清华技术背景",
        category: "cn_official"
    },
    {
        id: "qwen",
        name: "通义千问 (阿里云)",
        websiteUrl: "https://dashscope.aliyun.com",
        apiKeyUrl: "https://dashscope.console.aliyun.com/apiKey",
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        models: ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-long"],
        defaultModel: "qwen-turbo",
        icon: "☁️",
        iconColor: "#ff6a00",
        description: "阿里云通义千问API，多模态支持",
        category: "cn_official"
    },
    {
        id: "mimo",
        name: "小米MiMo (官方)",
        websiteUrl: "https://platform.xiaomimimo.com",
        apiKeyUrl: "https://platform.xiaomimimo.com/api-keys",
        baseUrl: "https://api.xiaomimimo.com/v1",
        models: ["mimo-7b", "mimo-7b-chat", "mimo-13b"],
        defaultModel: "mimo-7b-chat",
        icon: "📱",
        iconColor: "#ff6900",
        description: "小米MiMo官方API",
        category: "cn_official"
    },
    {
        id: "mimo-siliconflow",
        name: "小米MiMo (硅基流动)",
        websiteUrl: "https://siliconflow.cn",
        apiKeyUrl: "https://cloud.siliconflow.cn/account/ak",
        baseUrl: "https://api.siliconflow.cn/v1",
        models: ["MiMo-7B-RL", "MiMo-7B-Base", "Qwen/Qwen2.5-7B-Instruct"],
        defaultModel: "MiMo-7B-RL",
        icon: "⚡",
        iconColor: "#7c3aed",
        description: "通过硅基流动调用MiMo，支持token-plan",
        category: "aggregator"
    },
    {
        id: "siliconflow",
        name: "硅基流动 (SiliconFlow)",
        websiteUrl: "https://siliconflow.cn",
        apiKeyUrl: "https://cloud.siliconflow.cn/account/ak",
        baseUrl: "https://api.siliconflow.cn/v1",
        models: ["deepseek-ai/DeepSeek-V3", "Qwen/Qwen2.5-72B-Instruct", "meta-llama/Meta-Llama-3.1-70B-Instruct"],
        defaultModel: "deepseek-ai/DeepSeek-V3",
        icon: "🌊",
        iconColor: "#7c3aed",
        description: "硅基流动API聚合平台，多模型支持",
        category: "aggregator"
    },
    {
        id: "custom",
        name: "自定义 (OpenAI兼容)",
        websiteUrl: "",
        apiKeyUrl: "",
        baseUrl: "",
        models: [],
        defaultModel: "",
        icon: "⚙️",
        iconColor: "#6b7280",
        description: "自定义OpenAI兼容API端点",
        category: "custom",
        isCustom: true
    }
];

/**
 * 根据ID获取供应商预设
 * @param {string} providerId - 供应商ID
 * @returns {Object|null} 供应商预设对象
 */
function getProviderPreset(providerId) {
    for (var i = 0; i < PROVIDER_PRESETS.length; i++) {
        if (PROVIDER_PRESETS[i].id === providerId) {
            return PROVIDER_PRESETS[i];
        }
    }
    return null;
}

/**
 * 获取所有供应商预设
 * @returns {Array} 供应商预设数组
 */
function getAllProviderPresets() {
    return PROVIDER_PRESETS;
}

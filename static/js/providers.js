/**
 * ============================================
 * 供应商预设配置模块 (2026最新)
 * ============================================
 */

var PROVIDER_PRESETS = [
    {
        id: "openai",
        name: "OpenAI",
        websiteUrl: "https://platform.openai.com",
        apiKeyUrl: "https://platform.openai.com/api-keys",
        baseUrl: "https://api.openai.com/v1",
        models: ["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4.1-mini", "o3", "o3-pro", "o4-mini"],
        defaultModel: "gpt-4.1",
        icon: "🤖",
        iconColor: "#10a37f",
        description: "OpenAI官方API",
        category: "official"
    },
    {
        id: "claude",
        name: "Claude (Anthropic)",
        websiteUrl: "https://console.anthropic.com",
        apiKeyUrl: "https://console.anthropic.com/settings/keys",
        baseUrl: "https://api.anthropic.com/v1",
        models: ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
        defaultModel: "claude-sonnet-4-6",
        icon: "🧠",
        iconColor: "#d4915d",
        description: "Anthropic Claude API",
        category: "official"
    },
    {
        id: "deepseek",
        name: "DeepSeek (深度求索)",
        websiteUrl: "https://platform.deepseek.com",
        apiKeyUrl: "https://platform.deepseek.com/api_keys",
        baseUrl: "https://api.deepseek.com/v1",
        models: ["deepseek-chat", "deepseek-reasoner"],
        defaultModel: "deepseek-chat",
        icon: "🔮",
        iconColor: "#4d6bfe",
        description: "深度求索API，性价比极高",
        category: "cn_official"
    },
    {
        id: "moonshot",
        name: "Kimi (月之暗面)",
        websiteUrl: "https://platform.moonshot.cn",
        apiKeyUrl: "https://platform.moonshot.cn/console/api-keys",
        baseUrl: "https://api.moonshot.cn/v1",
        models: ["kimi-k2", "moonshot-v1-128k", "moonshot-v1-32k"],
        defaultModel: "kimi-k2",
        icon: "🌙",
        iconColor: "#6366f1",
        description: "月之暗面Kimi API",
        category: "cn_official"
    },
    {
        id: "zhipu",
        name: "智谱AI (GLM)",
        websiteUrl: "https://open.bigmodel.cn",
        apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
        baseUrl: "https://open.bigmodel.cn/api/paas/v4",
        models: ["glm-4-plus", "glm-4-flash", "glm-4-long", "glm-4v-plus"],
        defaultModel: "glm-4-flash",
        icon: "✨",
        iconColor: "#3451b2",
        description: "智谱AI GLM系列",
        category: "cn_official"
    },
    {
        id: "qwen",
        name: "通义千问 (阿里云)",
        websiteUrl: "https://dashscope.aliyun.com",
        apiKeyUrl: "https://dashscope.console.aliyun.com/apiKey",
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        models: ["qwen-max", "qwen-plus", "qwen-turbo", "qwen-long", "qwen3-235b-a22b"],
        defaultModel: "qwen-max",
        icon: "☁️",
        iconColor: "#ff6a00",
        description: "阿里云通义千问API",
        category: "cn_official"
    },
    {
        id: "mimo",
        name: "小米MiMo",
        websiteUrl: "https://platform.xiaomimimo.com",
        apiKeyUrl: "https://platform.xiaomimimo.com",
        baseUrl: "https://api.xiaomimimo.com/v1",
        models: ["mimo-7b", "MiMo-7B-RL"],
        defaultModel: "mimo-7b",
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
        models: ["Xiaomi/MiMo-7B-RL", "deepseek-ai/DeepSeek-V3-0324", "Qwen/Qwen3-235B-A22B"],
        defaultModel: "Xiaomi/MiMo-7B-RL",
        icon: "⚡",
        iconColor: "#7c3aed",
        description: "通过硅基流动调用，支持按量计费",
        category: "aggregator"
    },
    {
        id: "siliconflow",
        name: "硅基流动 (SiliconFlow)",
        websiteUrl: "https://siliconflow.cn",
        apiKeyUrl: "https://cloud.siliconflow.cn/account/ak",
        baseUrl: "https://api.siliconflow.cn/v1",
        models: ["deepseek-ai/DeepSeek-V3-0324", "Qwen/Qwen3-235B-A22B", "Pro/deepseek-ai/DeepSeek-R1"],
        defaultModel: "deepseek-ai/DeepSeek-V3-0324",
        icon: "🌊",
        iconColor: "#7c3aed",
        description: "硅基流动API聚合平台",
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

function getProviderPreset(providerId) {
    for (var i = 0; i < PROVIDER_PRESETS.length; i++) {
        if (PROVIDER_PRESETS[i].id === providerId) return PROVIDER_PRESETS[i];
    }
    return null;
}

function getAllProviderPresets() {
    return PROVIDER_PRESETS;
}

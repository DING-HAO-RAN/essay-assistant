/**
 * AI作文助手 - 前端交互逻辑
 */

// 全局状态
let currentConfig = null;
let providers = [];
let currentImportType = null;

// API基础URL
const API_BASE = '';

// ============================================
// 页面初始化
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

async function initApp() {
    // 加载服务提供商列表
    await loadProviders();

    // 检查本地存储的配置
    loadSavedConfig();

    // 初始化字数统计
    initWordCount();

    // 加载高考真题列表
    await loadGaokaoTopics();

    // 加载数据库统计
    if (typeof loadDbStats === 'function') {
        await loadDbStats();
    }

    // 配置Marked.js
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }
}

// ============================================
// 页面导航
// ============================================

function showSection(section) {
    // 隐藏所有section
    document.querySelectorAll('[id^="section-"]').forEach(el => {
        el.style.display = 'none';
    });

    // 显示目标section
    const target = document.getElementById(`section-${section}`);
    if (target) {
        target.style.display = 'block';
        target.classList.add('fade-in');
    }

    // 更新导航状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');

    // 检查配置状态
    if (section !== 'config') {
        checkConfigAlert();
    }
}

// ============================================
// 配置管理
// ============================================

async function loadProviders() {
    try {
        const response = await fetch(`${API_BASE}/api/providers`);
        const data = await response.json();

        if (data.success) {
            providers = data.providers;
            updateProviderSelect();
        }
    } catch (error) {
        console.error('加载服务提供商失败:', error);
    }
}

function updateProviderSelect() {
    const select = document.getElementById('config-provider');
    select.innerHTML = '<option value="">请选择...</option>';

    providers.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider.id;
        option.textContent = provider.name;
        select.appendChild(option);
    });
}

function updateProviderConfig() {
    const providerId = document.getElementById('config-provider').value;
    const modelSelect = document.getElementById('config-model');
    const baseUrlInput = document.getElementById('config-baseurl');

    // 清空模型列表
    modelSelect.innerHTML = '<option value="">请选择模型</option>';

    if (!providerId) {
        return;
    }

    const provider = providers.find(p => p.id === providerId);
    if (provider) {
        // 填充模型列表
        provider.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            if (model === provider.default_model) {
                option.selected = true;
                option.textContent += ' (推荐)';
            }
            modelSelect.appendChild(option);
        });

        // 设置默认API地址
        baseUrlInput.value = '';
        baseUrlInput.placeholder = `默认：${getProviderBaseUrl(providerId)}`;
    }
}

function getProviderBaseUrl(providerId) {
    const urls = {
        'openai': 'https://api.openai.com/v1',
        'claude': 'https://api.anthropic.com/v1',
        'deepseek': 'https://api.deepseek.com/v1',
        'moonshot': 'https://api.moonshot.cn/v1',
        'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
        'qwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    };
    return urls[providerId] || '';
}

async function saveConfig() {
    const provider = document.getElementById('config-provider').value;
    const apiKey = document.getElementById('config-apikey').value;
    const baseUrl = document.getElementById('config-baseurl').value;
    const model = document.getElementById('config-model').value;

    if (!provider || !apiKey) {
        showAlert('config-alert-box', '请填写服务商和API Key', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, api_key: apiKey, base_url: baseUrl, model })
        });

        const data = await response.json();

        if (data.success) {
            // 保存到本地存储
            localStorage.setItem('ai_config', JSON.stringify({ provider, api_key: apiKey, base_url: baseUrl, model }));
            currentConfig = { provider, api_key: apiKey, base_url: baseUrl, model };

            showAlert('config-alert-box', '配置保存成功！', 'success');
            updateConnectionStatus(true);
        } else {
            showAlert('config-alert-box', data.error || '保存失败', 'danger');
        }
    } catch (error) {
        showAlert('config-alert-box', '保存配置失败：' + error.message, 'danger');
    }
}

async function testConfig() {
    const provider = document.getElementById('config-provider').value;
    const apiKey = document.getElementById('config-apikey').value;
    const baseUrl = document.getElementById('config-baseurl').value;
    const model = document.getElementById('config-model').value;

    if (!provider || !apiKey) {
        showAlert('config-alert-box', '请填写服务商和API Key', 'danger');
        return;
    }

    showAlert('config-alert-box', '正在测试连接...', 'info');

    try {
        const response = await fetch(`${API_BASE}/api/config/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, api_key: apiKey, base_url: baseUrl, model })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('config-alert-box', `连接测试成功！AI回复：${data.response}`, 'success');
            updateConnectionStatus(true);
        } else {
            showAlert('config-alert-box', data.error || '连接测试失败', 'danger');
            updateConnectionStatus(false);
        }
    } catch (error) {
        showAlert('config-alert-box', '测试连接失败：' + error.message, 'danger');
        updateConnectionStatus(false);
    }
}

function loadSavedConfig() {
    const saved = localStorage.getItem('ai_config');
    if (saved) {
        try {
            currentConfig = JSON.parse(saved);

            // 恢复表单状态
            document.getElementById('config-provider').value = currentConfig.provider;
            updateProviderConfig();

            setTimeout(() => {
                document.getElementById('config-model').value = currentConfig.model;
            }, 100);

            document.getElementById('config-apikey').value = currentConfig.api_key;
            if (currentConfig.base_url) {
                document.getElementById('config-baseurl').value = currentConfig.base_url;
            }

            updateConnectionStatus(true);
        } catch (error) {
            console.error('加载保存的配置失败:', error);
        }
    }
}

function updateConnectionStatus(connected) {
    const statusDiv = document.getElementById('config-status');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    statusDiv.style.display = 'flex';

    if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = `已连接 (${currentConfig?.provider || ''})`;
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = '未连接';
    }
}

function checkConfigAlert() {
    const alert = document.getElementById('config-alert');
    if (!currentConfig) {
        alert.style.display = 'flex';
    } else {
        alert.style.display = 'none';
    }
}

// ============================================
// 字数统计
// ============================================

function initWordCount() {
    const analyzeContent = document.getElementById('analyze-content');
    if (analyzeContent) {
        analyzeContent.addEventListener('input', function() {
            const count = this.value.replace(/\s/g, '').length;
            document.getElementById('analyze-word-count').textContent = count;
        });
    }
}

// ============================================
// 创作指导
// ============================================

async function getWritingGuide() {
    const topic = document.getElementById('guide-topic').value.trim();
    const genre = document.getElementById('guide-genre').value;

    if (!topic) {
        alert('请输入作文题目');
        return;
    }

    if (!currentConfig) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('guide-loading');
    hideResult('guide-result');

    try {
        const response = await fetch(`${API_BASE}/api/guide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, genre })
        });

        const data = await response.json();

        if (data.success) {
            showResult('guide-result', 'guide-content', data.guide);
        } else {
            alert('获取指导失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    } finally {
        hideLoading('guide-loading');
    }
}

// ============================================
// 作文分析
// ============================================

async function analyzeEssay() {
    const title = document.getElementById('analyze-title').value.trim();
    const content = document.getElementById('analyze-content').value.trim();

    if (!title || !content) {
        alert('请输入作文题目和内容');
        return;
    }

    if (!currentConfig) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('analyze-loading');
    hideResult('analyze-result');

    try {
        const response = await fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();

        if (data.success) {
            showResult('analyze-result', 'analyze-content', data.analysis);
        } else {
            alert('分析失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    } finally {
        hideLoading('analyze-loading');
    }
}

async function comprehensiveEvaluate() {
    const title = document.getElementById('analyze-title').value.trim();
    const content = document.getElementById('analyze-content').value.trim();

    if (!title || !content) {
        alert('请输入作文题目和内容');
        return;
    }

    if (!currentConfig) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('analyze-loading');
    hideResult('analyze-result');

    try {
        const response = await fetch(`${API_BASE}/api/comprehensive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, genre: '议论文' })
        });

        const data = await response.json();

        if (data.success) {
            showResult('analyze-result', 'analyze-content', data.comprehensive_result);
        } else {
            alert('评价失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    } finally {
        hideLoading('analyze-loading');
    }
}

async function getRevisionSuggestions() {
    const title = document.getElementById('analyze-title').value.trim();
    const content = document.getElementById('analyze-content').value.trim();
    const analysis = document.getElementById('analyze-content').innerText;

    if (!title || !content) {
        alert('请先输入作文题目和内容');
        return;
    }

    showLoading('analyze-loading');

    try {
        const response = await fetch(`${API_BASE}/api/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, analysis })
        });

        const data = await response.json();

        if (data.success) {
            showResult('analyze-result', 'analyze-content', data.suggestions);
        } else {
            alert('获取修改建议失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    } finally {
        hideLoading('analyze-loading');
    }
}

// ============================================
// 智能评分
// ============================================

async function scoreEssay() {
    const title = document.getElementById('score-title').value.trim();
    const content = document.getElementById('score-content').value.trim();
    const totalScore = parseInt(document.getElementById('score-total').value);

    if (!title || !content) {
        alert('请输入作文题目和内容');
        return;
    }

    if (!currentConfig) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('score-loading');
    hideResult('score-result');

    try {
        const response = await fetch(`${API_BASE}/api/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, total_score: totalScore })
        });

        const data = await response.json();

        if (data.success) {
            showResult('score-result', 'score-content', data.scoring_result);
        } else {
            alert('评分失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    } finally {
        hideLoading('score-loading');
    }
}

// ============================================
// 素材推荐
// ============================================

async function getMaterials() {
    const topic = document.getElementById('material-topic').value.trim();
    const angle = document.getElementById('material-angle').value.trim();

    if (!topic) {
        alert('请输入作文主题');
        return;
    }

    if (!currentConfig) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('material-loading');
    hideResult('material-result');

    try {
        const response = await fetch(`${API_BASE}/api/materials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, angle })
        });

        const data = await response.json();

        if (data.success) {
            showResult('material-result', 'material-content', data.materials);
        } else {
            alert('获取素材失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    } finally {
        hideLoading('material-loading');
    }
}

// ============================================
// UI工具函数
// ============================================

function showLoading(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'flex';
    }
}

function hideLoading(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
    }
}

function showResult(resultId, contentId, markdown) {
    const resultEl = document.getElementById(resultId);
    const contentEl = document.getElementById(contentId);

    if (resultEl && contentEl) {
        // 渲染Markdown
        if (typeof marked !== 'undefined') {
            contentEl.innerHTML = marked.parse(markdown);
        } else {
            // 简单的换行处理
            contentEl.innerHTML = markdown.replace(/\n/g, '<br>');
        }

        resultEl.style.display = 'block';
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function hideResult(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
    }
}

function showAlert(boxId, message, type) {
    const box = document.getElementById(boxId);
    if (box) {
        box.className = `alert alert-${type}`;
        box.innerHTML = `<span>${getAlertIcon(type)}</span><span>${message}</span>`;
        box.style.display = 'flex';
    }
}

function getAlertIcon(type) {
    const icons = {
        'success': '✅',
        'danger': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}

async function copyResult(contentId) {
    const contentEl = document.getElementById(contentId);
    if (contentEl) {
        try {
            await navigator.clipboard.writeText(contentEl.innerText);
            alert('已复制到剪贴板');
        } catch (error) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = contentEl.innerText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('已复制到剪贴板');
        }
    }
}

// ============================================
// 高考真题练习
// ============================================

async function loadGaokaoTopics() {
    try {
        const response = await fetch(`${API_BASE}/api/gaokao/topics`);
        const data = await response.json();

        if (data.success) {
            renderGaokaoTopics(data.topics);
        }
    } catch (error) {
        console.error('加载高考真题列表失败:', error);
    }
}

function renderGaokaoTopics(topics) {
    const container = document.getElementById('gaokao-topics-list');
    if (!container) return;

    // 按年份分组
    const grouped = {};
    topics.forEach(t => {
        if (!grouped[t.year]) grouped[t.year] = [];
        grouped[t.year].push(t);
    });

    let html = '';
    Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
        html += `<div class="feature-card" style="padding: 1.5rem;">
            <h4 style="color: var(--primary-light); margin-bottom: 1rem;">${year}年</h4>
            <ul style="list-style: none; padding: 0;">`;

        grouped[year].forEach(t => {
            html += `<li style="margin-bottom: 0.75rem; padding: 0.5rem; background: var(--bg-input); border-radius: 8px; cursor: pointer;" onclick="practiceGaokaoTopic('${year}', '${t.paper}')">
                <div style="font-weight: 500;">${t.paper}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${t.topic}</div>
                <div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
                    ${t.themes.map(theme => `<span class="tag tag-primary">${theme}</span>`).join('')}
                </div>
            </li>`;
        });

        html += `</ul></div>`;
    });

    container.innerHTML = html;
}

async function startGaokaoPractice() {
    const year = document.getElementById('gaokao-year').value;

    if (!currentConfig) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('gaokao-loading');
    hideResult('gaokao-result');

    try {
        const response = await fetch(`${API_BASE}/api/gaokao/practice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: year || null })
        });

        const data = await response.json();

        if (data.success) {
            const topicInfo = data.topic_info;
            document.getElementById('gaokao-result-title').textContent =
                `${topicInfo.year}年${topicInfo.paper} - ${topicInfo.topic}`;
            showResult('gaokao-result', 'gaokao-content', data.guide);
        } else {
            alert('获取真题讲解失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    } finally {
        hideLoading('gaokao-loading');
    }
}

async function practiceGaokaoTopic(year, paper) {
    if (!currentConfig) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('gaokao-loading');
    hideResult('gaokao-result');

    try {
        const response = await fetch(`${API_BASE}/api/gaokao/practice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: year })
        });

        const data = await response.json();

        if (data.success) {
            const topicInfo = data.topic_info;
            document.getElementById('gaokao-result-title').textContent =
                `${topicInfo.year}年${topicInfo.paper} - ${topicInfo.topic}`;
            showResult('gaokao-result', 'gaokao-content', data.guide);
        } else {
            alert('获取真题讲解失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    } finally {
        hideLoading('gaokao-loading');
    }
}

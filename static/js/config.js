/**
 * ============================================
 * AI服务配置管理模块
 * ============================================
 */

var currentConfig = null;
var selectedProvider = null;

/**
 * 初始化配置页面
 */
function initConfigPage() {
    renderProviderCards();
    loadSavedConfig();
}

/**
 * 渲染供应商卡片
 */
function renderProviderCards() {
    var container = document.getElementById('provider-cards');
    if (!container) return;

    var presets = getAllProviderPresets();
    var html = '<div class="provider-grid">';

    for (var i = 0; i < presets.length; i++) {
        var p = presets[i];
        var isActive = currentConfig && currentConfig.provider === p.id;

        html += '<div class="provider-card' + (isActive ? ' active' : '') + '" ';
        html += 'onclick="selectProvider(\'' + p.id + '\')" ';
        html += 'data-provider-id="' + p.id + '">';

        html += '<div class="provider-icon" style="background-color: ' + (p.iconColor || '#6b7280') + ';">';
        html += '<span>' + (p.icon || '🤖') + '</span>';
        html += '</div>';

        html += '<div class="provider-name">' + p.name + '</div>';
        html += '<div class="provider-desc">' + (p.description || '') + '</div>';

        if (isActive) {
            html += '<div class="provider-status active">已连接</div>';
        }

        if (p.websiteUrl) {
            html += '<div class="provider-links">';
            html += '<a href="' + p.websiteUrl + '" target="_blank" onclick="event.stopPropagation()">官网</a>';
            if (p.apiKeyUrl && p.apiKeyUrl !== p.websiteUrl) {
                html += '<a href="' + p.apiKeyUrl + '" target="_blank" onclick="event.stopPropagation()">获取Key</a>';
            }
            html += '</div>';
        }

        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

/**
 * 选择供应商
 */
function selectProvider(providerId) {
    var preset = getProviderPreset(providerId);
    if (!preset) return;

    selectedProvider = preset;

    // 更新卡片选中状态
    var cards = document.querySelectorAll('.provider-card');
    for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove('selected');
        if (cards[i].getAttribute('data-provider-id') === providerId) {
            cards[i].classList.add('selected');
        }
    }

    renderConfigForm(preset);
}

/**
 * 渲染配置表单 - 模型输入支持自定义
 */
function renderConfigForm(preset) {
    var formContainer = document.getElementById('config-form');
    if (!formContainer) return;

    // 构建datalist选项
    var datalistOptions = '';
    if (preset.models && preset.models.length > 0) {
        for (var i = 0; i < preset.models.length; i++) {
            var isDefault = preset.models[i] === preset.defaultModel;
            datalistOptions += '<option value="' + preset.models[i] + '"';
            if (isDefault) datalistOptions += ' label="推荐"';
            datalistOptions += '>';
        }
    }

    var html = '<div class="config-form-content">';
    html += '<h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 12px;">';
    html += '<span style="font-size: 2rem;">' + (preset.icon || '🤖') + '</span>';
    html += '<span>' + preset.name + '</span>';
    html += '</h3>';

    // API Key
    html += '<div class="form-group">';
    html += '<label class="form-label">API Key <span style="color: var(--danger);">*</span></label>';
    html += '<div class="input-group">';
    html += '<input type="password" class="form-input" id="config-apikey" placeholder="请输入您的API Key">';
    html += '<button class="btn btn-sm btn-secondary" onclick="toggleApiKeyVisibility()">👁️</button>';
    html += '</div>';
    if (preset.apiKeyUrl) {
        html += '<div class="form-hint">前往 <a href="' + preset.apiKeyUrl + '" target="_blank">' + preset.name + '</a> 获取API Key</div>';
    }
    html += '</div>';

    // API地址
    html += '<div class="form-group">';
    html += '<label class="form-label">API地址</label>';
    html += '<input type="text" class="form-input" id="config-baseurl" ';
    html += 'value="' + (preset.baseUrl || '') + '" ';
    html += 'placeholder="请输入API地址">';
    html += '</div>';

    // 模型选择 - 使用input+datalist支持自定义输入
    html += '<div class="form-group">';
    html += '<label class="form-label">模型 <span style="color: var(--danger);">*</span></label>';
    html += '<div class="input-group">';
    html += '<input type="text" class="form-input" id="config-model" ';
    html += 'value="' + (preset.defaultModel || '') + '" ';
    html += 'placeholder="输入或选择模型名称" ';
    html += 'list="model-suggestions">';
    html += '<button class="btn btn-sm btn-secondary" onclick="toggleModelSuggestions()" title="查看可用模型">📋</button>';
    html += '</div>';
    html += '<datalist id="model-suggestions">' + datalistOptions + '</datalist>';

    // 显示预设模型列表
    if (preset.models && preset.models.length > 0) {
        html += '<div class="model-chips" style="margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 6px;">';
        for (var j = 0; j < preset.models.length; j++) {
            var m = preset.models[j];
            var isDef = m === preset.defaultModel;
            html += '<span class="model-chip' + (isDef ? ' default' : '') + '" ';
            html += 'onclick="selectModel(\'' + m + '\')" ';
            html += 'title="点击选择">';
            html += m;
            if (isDef) html += ' ★';
            html += '</span>';
        }
        html += '</div>';
    }
    html += '</div>';

    // 按钮
    html += '<div class="form-actions">';
    html += '<button class="btn btn-secondary" onclick="testConfig()"><span>🔗</span> 测试连接</button>';
    html += '<button class="btn btn-primary" onclick="saveConfig()"><span>💾</span> 保存配置</button>';
    html += '<button class="btn btn-danger" onclick="clearConfig()" style="flex: 0.5;"><span>🗑️</span> 清除</button>';
    html += '</div>';

    // 状态
    html += '<div id="config-status" class="config-status" style="display: none;">';
    html += '<div id="status-dot" class="status-dot"></div>';
    html += '<span id="status-text">未连接</span>';
    html += '</div>';

    html += '<div id="config-alert-box" class="alert" style="display: none; margin-top: 1rem;"></div>';
    html += '</div>';

    formContainer.innerHTML = html;
    formContainer.style.display = 'block';

    // 恢复已保存的值
    if (currentConfig && currentConfig.provider === preset.id) {
        restoreFormValues();
    }

    // 滚动到表单
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 选择模型（点击芯片）
 */
function selectModel(model) {
    var input = document.getElementById('config-model');
    if (input) {
        input.value = model;
    }
}

/**
 * 切换模型建议面板
 */
function toggleModelSuggestions() {
    var chips = document.querySelector('.model-chips');
    if (chips) {
        chips.style.display = chips.style.display === 'none' ? 'flex' : 'none';
    }
}

/**
 * 切换API Key可见性
 */
function toggleApiKeyVisibility() {
    var input = document.getElementById('config-apikey');
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

/**
 * 恢复表单值
 */
function restoreFormValues() {
    if (!currentConfig) return;
    var apiKeyInput = document.getElementById('config-apikey');
    var baseUrlInput = document.getElementById('config-baseurl');
    var modelInput = document.getElementById('config-model');
    if (apiKeyInput && currentConfig.api_key) apiKeyInput.value = currentConfig.api_key;
    if (baseUrlInput && currentConfig.base_url) baseUrlInput.value = currentConfig.base_url;
    if (modelInput && currentConfig.model) modelInput.value = currentConfig.model;
}

/**
 * 保存配置
 */
function saveConfig() {
    if (!selectedProvider) {
        showConfigAlert('请先选择服务商', 'warning');
        return;
    }

    var apiKey = document.getElementById('config-apikey').value.trim();
    var baseUrl = document.getElementById('config-baseurl').value.trim();
    var model = document.getElementById('config-model').value.trim();

    if (!apiKey) { showConfigAlert('请输入API Key', 'warning'); return; }
    if (!baseUrl) { showConfigAlert('请输入API地址', 'warning'); return; }
    if (!model) { showConfigAlert('请输入模型名称', 'warning'); return; }

    var configData = {
        provider: selectedProvider.id,
        api_key: apiKey,
        base_url: baseUrl,
        model: model
    };

    showConfigAlert('正在保存...', 'info');

    fetch(API_BASE + '/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            localStorage.setItem('ai_config', JSON.stringify(configData));
            currentConfig = configData;
            showConfigAlert('配置保存成功！', 'success');
            updateConnectionStatus(true);
            renderProviderCards();
        } else {
            showConfigAlert('保存失败: ' + (data.error || '未知错误'), 'danger');
        }
    })
    .catch(function(e) {
        showConfigAlert('保存失败: ' + e.message, 'danger');
    });
}

/**
 * 测试连接
 */
function testConfig() {
    if (!selectedProvider) {
        showConfigAlert('请先选择服务商', 'warning');
        return;
    }

    var apiKey = document.getElementById('config-apikey').value.trim();
    var baseUrl = document.getElementById('config-baseurl').value.trim();
    var model = document.getElementById('config-model').value.trim();

    if (!apiKey) { showConfigAlert('请先输入API Key', 'warning'); return; }

    var testData = {
        provider: selectedProvider.id,
        api_key: apiKey,
        base_url: baseUrl || selectedProvider.baseUrl,
        model: model || selectedProvider.defaultModel
    };

    showConfigAlert('正在测试连接...', 'info');

    fetch(API_BASE + '/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            showConfigAlert('连接成功！AI回复: ' + data.response, 'success');
            updateConnectionStatus(true);
        } else {
            showConfigAlert('连接失败: ' + (data.error || '未知错误'), 'danger');
            updateConnectionStatus(false);
        }
    })
    .catch(function(e) {
        showConfigAlert('测试失败: ' + e.message, 'danger');
        updateConnectionStatus(false);
    });
}

/**
 * 清除配置
 */
function clearConfig() {
    if (!confirm('确定要清除当前配置吗？')) return;
    localStorage.removeItem('ai_config');
    currentConfig = null;
    selectedProvider = null;
    var formContainer = document.getElementById('config-form');
    if (formContainer) formContainer.style.display = 'none';
    renderProviderCards();
    showConfigAlert('配置已清除', 'info');
}

/**
 * 加载保存的配置
 */
function loadSavedConfig() {
    var saved = localStorage.getItem('ai_config');
    if (!saved) return;
    try {
        currentConfig = JSON.parse(saved);
        if (currentConfig.provider) {
            selectProvider(currentConfig.provider);
        }
        updateConnectionStatus(true);
    } catch (e) {
        console.error('加载配置失败:', e);
    }
}

/**
 * 更新连接状态
 */
function updateConnectionStatus(connected) {
    var statusDiv = document.getElementById('config-status');
    var statusDot = document.getElementById('status-dot');
    var statusText = document.getElementById('status-text');
    if (!statusDiv || !statusDot || !statusText) return;
    statusDiv.style.display = 'flex';
    if (connected && currentConfig) {
        statusDot.className = 'status-dot connected';
        var preset = getProviderPreset(currentConfig.provider);
        statusText.textContent = '已连接 (' + (preset ? preset.name : currentConfig.provider) + ' / ' + currentConfig.model + ')';
    } else {
        statusDot.className = 'status-dot';
        statusText.textContent = '未连接';
    }
}

/**
 * 显示提示
 */
function showConfigAlert(message, type) {
    var alertBox = document.getElementById('config-alert-box');
    if (!alertBox) return;
    var icons = { 'success': '✅', 'danger': '❌', 'warning': '⚠️', 'info': 'ℹ️' };
    alertBox.className = 'alert alert-' + type;
    alertBox.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
    alertBox.style.display = 'flex';
}

/**
 * 检查配置状态
 */
function checkConfigAlert() {
    var alert = document.getElementById('config-alert');
    if (alert) alert.style.display = currentConfig ? 'none' : 'flex';
}

/**
 * 获取当前配置
 */
function getCurrentConfig() { return currentConfig; }

// 兼容旧代码
function loadProviders() {}
function updateProviderConfig() {}

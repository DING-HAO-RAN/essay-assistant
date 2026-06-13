/**
 * ============================================
 * AI服务配置管理模块
 * ============================================
 * 完全仿照cc-switch的provider管理设计
 * 负责：
 * - 供应商卡片列表渲染
 * - API配置表单管理
 * - 配置保存、测试、加载
 * - 配置状态管理
 * ============================================
 */

// 全局状态
var currentConfig = null;
var selectedProvider = null;

/**
 * 初始化配置页面
 * 渲染供应商卡片列表
 */
function initConfigPage() {
    renderProviderCards();
    loadSavedConfig();
}

/**
 * 渲染供应商卡片列表
 * 仿照cc-switch的卡片式供应商选择界面
 */
function renderProviderCards() {
    var container = document.getElementById('provider-cards');
    if (!container) return;

    var presets = getAllProviderPresets();
    var html = '<div class="provider-grid">';

    for (var i = 0; i < presets.length; i++) {
        var p = presets[i];
        var isSelected = selectedProvider && selectedProvider.id === p.id;
        var isActive = currentConfig && currentConfig.provider === p.id;

        html += '<div class="provider-card' + (isSelected ? ' selected' : '') + (isActive ? ' active' : '') + '" ';
        html += 'onclick="selectProvider(\'' + p.id + '\')" ';
        html += 'data-provider-id="' + p.id + '">';

        // 图标
        html += '<div class="provider-icon" style="background-color: ' + (p.iconColor || '#6b7280') + ';">';
        html += '<span>' + (p.icon || '🤖') + '</span>';
        html += '</div>';

        // 名称
        html += '<div class="provider-name">' + p.name + '</div>';

        // 描述
        html += '<div class="provider-desc">' + (p.description || '') + '</div>';

        // 状态标签
        if (isActive) {
            html += '<div class="provider-status active">已连接</div>';
        }

        // 链接
        if (p.websiteUrl) {
            html += '<div class="provider-links">';
            html += '<a href="' + p.websiteUrl + '" target="_blank" onclick="event.stopPropagation()">官网</a>';
            if (p.apiKeyUrl) {
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
 * @param {string} providerId - 供应商ID
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

    // 显示配置表单
    renderConfigForm(preset);
}

/**
 * 渲染配置表单
 * @param {Object} preset - 供应商预设
 */
function renderConfigForm(preset) {
    var formContainer = document.getElementById('config-form');
    if (!formContainer) return;

    var html = '<div class="config-form-content">';
    html += '<h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 12px;">';
    html += '<span style="font-size: 2rem;">' + (preset.icon || '🤖') + '</span>';
    html += '<span>' + preset.name + '</span>';
    html += '</h3>';

    // API Key 输入
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

    // API地址输入（自定义或可编辑）
    html += '<div class="form-group">';
    html += '<label class="form-label">API地址</label>';
    html += '<input type="text" class="form-input" id="config-baseurl" ';
    html += 'value="' + (preset.baseUrl || '') + '" ';
    html += 'placeholder="请输入API地址">';
    if (preset.isCustom) {
        html += '<div class="form-hint">请输入完整的API地址，如 https://api.example.com/v1</div>';
    }
    html += '</div>';

    // 模型选择
    html += '<div class="form-group">';
    html += '<label class="form-label">模型选择</label>';
    if (preset.models && preset.models.length > 0) {
        html += '<select class="form-select" id="config-model">';
        for (var i = 0; i < preset.models.length; i++) {
            var model = preset.models[i];
            var isDefault = model === preset.defaultModel;
            html += '<option value="' + model + '"' + (isDefault ? ' selected' : '') + '>';
            html += model + (isDefault ? ' (推荐)' : '');
            html += '</option>';
        }
        html += '</select>';
    } else {
        html += '<input type="text" class="form-input" id="config-model" placeholder="请输入模型名称">';
    }
    html += '</div>';

    // 按钮组
    html += '<div class="form-actions">';
    html += '<button class="btn btn-secondary" onclick="testConfig()">';
    html += '<span>🔗</span> 测试连接';
    html += '</button>';
    html += '<button class="btn btn-primary" onclick="saveConfig()">';
    html += '<span>💾</span> 保存配置';
    html += '</button>';
    html += '</div>';

    // 状态显示
    html += '<div id="config-status" class="config-status" style="display: none;">';
    html += '<div id="status-dot" class="status-dot"></div>';
    html += '<span id="status-text">未连接</span>';
    html += '</div>';

    // 提示信息
    html += '<div id="config-alert-box" class="alert" style="display: none; margin-top: 1rem;"></div>';

    html += '</div>';

    formContainer.innerHTML = html;
    formContainer.style.display = 'block';

    // 如果有保存的配置，恢复表单值
    if (currentConfig && currentConfig.provider === preset.id) {
        restoreFormValues();
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

    if (apiKeyInput && currentConfig.api_key) {
        apiKeyInput.value = currentConfig.api_key;
    }
    if (baseUrlInput && currentConfig.base_url) {
        baseUrlInput.value = currentConfig.base_url;
    }
    if (modelInput && currentConfig.model) {
        modelInput.value = currentConfig.model;
    }
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

    // 验证必填项
    if (!apiKey) {
        showConfigAlert('请输入API Key', 'warning');
        return;
    }
    if (!baseUrl) {
        showConfigAlert('请输入API地址', 'warning');
        return;
    }
    if (!model) {
        showConfigAlert('请选择或输入模型', 'warning');
        return;
    }

    // 构建配置数据
    var configData = {
        provider: selectedProvider.id,
        api_key: apiKey,
        base_url: baseUrl,
        model: model
    };

    // 显示保存中状态
    showConfigAlert('正在保存配置...', 'info');

    // 发送到后端
    fetch(API_BASE + '/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            // 保存到本地存储
            localStorage.setItem('ai_config', JSON.stringify(configData));
            currentConfig = configData;

            showConfigAlert('配置保存成功！', 'success');
            updateConnectionStatus(true);

            // 重新渲染卡片以更新状态
            renderProviderCards();
        } else {
            showConfigAlert('保存失败: ' + (data.error || '未知错误'), 'danger');
        }
    })
    .catch(function(error) {
        showConfigAlert('保存失败: ' + error.message, 'danger');
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

    if (!apiKey) {
        showConfigAlert('请先输入API Key', 'warning');
        return;
    }

    // 构建测试数据
    var testData = {
        provider: selectedProvider.id,
        api_key: apiKey,
        base_url: baseUrl || selectedProvider.baseUrl,
        model: model || selectedProvider.defaultModel
    };

    // 显示测试中状态
    showConfigAlert('正在测试连接...', 'info');

    // 发送测试请求
    fetch(API_BASE + '/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showConfigAlert('✅ 连接测试成功！AI回复: ' + data.response, 'success');
            updateConnectionStatus(true);
        } else {
            showConfigAlert('❌ 连接测试失败: ' + (data.error || '未知错误'), 'danger');
            updateConnectionStatus(false);
        }
    })
    .catch(function(error) {
        showConfigAlert('❌ 测试失败: ' + error.message, 'danger');
        updateConnectionStatus(false);
    });
}

/**
 * 加载保存的配置
 */
function loadSavedConfig() {
    var saved = localStorage.getItem('ai_config');
    if (!saved) return;

    try {
        currentConfig = JSON.parse(saved);

        // 选中对应的供应商
        if (currentConfig.provider) {
            selectProvider(currentConfig.provider);
        }

        updateConnectionStatus(true);
    } catch (error) {
        console.error('加载保存的配置失败:', error);
    }
}

/**
 * 更新连接状态显示
 * @param {boolean} connected - 是否已连接
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
        statusText.textContent = '已连接 (' + (preset ? preset.name : currentConfig.provider) + ')';
    } else {
        statusDot.className = 'status-dot';
        statusText.textContent = '未连接';
    }
}

/**
 * 显示配置提示信息
 * @param {string} message - 提示信息
 * @param {string} type - 提示类型（success/danger/warning/info）
 */
function showConfigAlert(message, type) {
    var alertBox = document.getElementById('config-alert-box');
    if (!alertBox) return;

    var icons = {
        'success': '✅',
        'danger': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };

    alertBox.className = 'alert alert-' + type;
    alertBox.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
    alertBox.style.display = 'flex';
}

/**
 * 检查是否已配置AI服务
 */
function checkConfigAlert() {
    var alert = document.getElementById('config-alert');
    if (alert) {
        alert.style.display = currentConfig ? 'none' : 'flex';
    }
}

/**
 * 获取当前配置
 * @returns {Object|null} 当前配置对象
 */
function getCurrentConfig() {
    return currentConfig;
}

/**
 * 获取当前配置（异步版本，兼容旧代码）
 */
function loadProviders() {
    // 兼容旧代码，实际不需要做任何事情
    // 因为供应商列表现在是静态的
}

/**
 * 更新供应商配置（兼容旧代码）
 */
function updateProviderConfig() {
    // 兼容旧代码
}

/**
 * 保存配置（兼容旧代码）
 */
function saveConfigLegacy() {
    saveConfig();
}

/**
 * 测试配置（兼容旧代码）
 */
function testConfigLegacy() {
    testConfig();
}

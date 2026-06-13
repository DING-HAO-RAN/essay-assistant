/**
 * ============================================
 * AI服务配置管理模块
 * ============================================
 * 参考cc-switch项目的provider管理设计
 * 负责：
 * - 服务商列表加载和展示
 * - API配置的保存、测试、加载
 * - 配置状态管理
 * ============================================
 */

// 全局状态
var currentConfig = null;
var providers = [];

/**
 * 加载服务商列表
 * 从后端获取支持的AI服务商列表
 */
function loadProviders() {
    fetch(API_BASE + '/api/providers')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                providers = data.providers;
                renderProviderSelect();
            }
        })
        .catch(function(error) {
            console.error('加载服务商列表失败:', error);
        });
}

/**
 * 渲染服务商选择下拉框
 */
function renderProviderSelect() {
    var select = document.getElementById('config-provider');
    if (!select) return;

    // 清空现有选项
    select.innerHTML = '<option value="">请选择服务商...</option>';

    // 添加服务商选项
    for (var i = 0; i < providers.length; i++) {
        var p = providers[i];
        var option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    }
}

/**
 * 更新服务商配置
 * 当用户选择不同的服务商时，更新模型列表和默认配置
 */
function updateProviderConfig() {
    var providerId = document.getElementById('config-provider').value;
    var modelSelect = document.getElementById('config-model');
    var baseUrlInput = document.getElementById('config-baseurl');

    // 清空模型列表
    modelSelect.innerHTML = '<option value="">请选择模型</option>';

    if (!providerId) {
        baseUrlInput.value = '';
        baseUrlInput.placeholder = '请先选择服务商';
        return;
    }

    // 查找选中的服务商
    var provider = null;
    for (var i = 0; i < providers.length; i++) {
        if (providers[i].id === providerId) {
            provider = providers[i];
            break;
        }
    }

    if (provider) {
        // 填充模型列表
        for (var j = 0; j < provider.models.length; j++) {
            var model = provider.models[j];
            var option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            if (model === provider.default_model) {
                option.selected = true;
                option.textContent += ' (推荐)';
            }
            modelSelect.appendChild(option);
        }

        // 设置默认API地址提示
        var baseUrl = getProviderBaseUrl(providerId);
        baseUrlInput.placeholder = baseUrl ? '默认: ' + baseUrl : '请输入API地址';
        baseUrlInput.value = '';
    }
}

/**
 * 获取服务商的默认API地址
 * @param {string} providerId - 服务商ID
 * @returns {string} API地址
 */
function getProviderBaseUrl(providerId) {
    var urls = {
        'openai': 'https://api.openai.com/v1',
        'claude': 'https://api.anthropic.com/v1',
        'deepseek': 'https://api.deepseek.com/v1',
        'moonshot': 'https://api.moonshot.cn/v1',
        'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
        'qwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        'mimo': 'https://api.xiaomimimo.com/v1',
        'mimo-siliconflow': 'https://api.siliconflow.cn/v1'
    };
    return urls[providerId] || '';
}

/**
 * 保存AI服务配置
 * 将配置保存到后端session和本地localStorage
 */
function saveConfig() {
    var provider = document.getElementById('config-provider').value;
    var apiKey = document.getElementById('config-apikey').value;
    var baseUrl = document.getElementById('config-baseurl').value;
    var model = document.getElementById('config-model').value;

    // 验证必填项
    if (!provider) {
        showConfigAlert('请选择服务商', 'warning');
        return;
    }
    if (!apiKey) {
        showConfigAlert('请输入API Key', 'warning');
        return;
    }
    if (!model) {
        showConfigAlert('请选择模型', 'warning');
        return;
    }

    // 构建配置数据
    var configData = {
        provider: provider,
        api_key: apiKey,
        base_url: baseUrl || getProviderBaseUrl(provider),
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
        } else {
            showConfigAlert('保存失败: ' + (data.error || '未知错误'), 'danger');
        }
    })
    .catch(function(error) {
        showConfigAlert('保存失败: ' + error.message, 'danger');
    });
}

/**
 * 测试AI服务连接
 * 发送测试请求验证配置是否正确
 */
function testConfig() {
    var provider = document.getElementById('config-provider').value;
    var apiKey = document.getElementById('config-apikey').value;
    var baseUrl = document.getElementById('config-baseurl').value;
    var model = document.getElementById('config-model').value;

    // 验证必填项
    if (!provider) {
        showConfigAlert('请先选择服务商', 'warning');
        return;
    }
    if (!apiKey) {
        showConfigAlert('请先输入API Key', 'warning');
        return;
    }

    // 构建测试数据
    var testData = {
        provider: provider,
        api_key: apiKey,
        base_url: baseUrl || getProviderBaseUrl(provider),
        model: model || ''
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
            showConfigAlert('连接测试成功！AI回复: ' + data.response, 'success');
            updateConnectionStatus(true);
        } else {
            showConfigAlert('连接测试失败: ' + (data.error || '未知错误'), 'danger');
            updateConnectionStatus(false);
        }
    })
    .catch(function(error) {
        showConfigAlert('测试失败: ' + error.message, 'danger');
        updateConnectionStatus(false);
    });
}

/**
 * 加载保存的配置
 * 从localStorage加载之前保存的配置
 */
function loadSavedConfig() {
    var saved = localStorage.getItem('ai_config');
    if (!saved) return;

    try {
        currentConfig = JSON.parse(saved);

        // 恢复表单状态
        var providerSelect = document.getElementById('config-provider');
        if (providerSelect) {
            providerSelect.value = currentConfig.provider;
            updateProviderConfig();

            // 延迟设置模型，等待模型列表加载
            setTimeout(function() {
                var modelSelect = document.getElementById('config-model');
                if (modelSelect && currentConfig.model) {
                    modelSelect.value = currentConfig.model;
                }
            }, 100);
        }

        // 恢复API Key
        var apiKeyInput = document.getElementById('config-apikey');
        if (apiKeyInput && currentConfig.api_key) {
            apiKeyInput.value = currentConfig.api_key;
        }

        // 恢复自定义API地址
        var baseUrlInput = document.getElementById('config-baseurl');
        if (baseUrlInput && currentConfig.base_url) {
            var defaultUrl = getProviderBaseUrl(currentConfig.provider);
            if (currentConfig.base_url !== defaultUrl) {
                baseUrlInput.value = currentConfig.base_url;
            }
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
        statusText.textContent = '已连接 (' + getProviderName(currentConfig.provider) + ')';
    } else {
        statusDot.className = 'status-dot';
        statusText.textContent = '未连接';
    }
}

/**
 * 获取服务商显示名称
 * @param {string} providerId - 服务商ID
 * @returns {string} 服务商名称
 */
function getProviderName(providerId) {
    for (var i = 0; i < providers.length; i++) {
        if (providers[i].id === providerId) {
            return providers[i].name;
        }
    }
    return providerId;
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
 * 用于其他页面检查配置状态
 */
function checkConfigAlert() {
    var alert = document.getElementById('config-alert');
    if (alert) {
        alert.style.display = currentConfig ? 'none' : 'flex';
    }
}

/**
 * 获取当前配置
 * 供其他模块调用
 * @returns {Object|null} 当前配置对象
 */
function getCurrentConfig() {
    return currentConfig;
}

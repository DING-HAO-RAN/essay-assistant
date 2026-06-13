/**
 * ============================================
 * AI作文助手 - 前端主模块
 * ============================================
 * 负责：
 * - 页面初始化
 * - 页面导航
 * - AI功能调用（创作指导、分析、评分等）
 * - 字数统计
 * - 高考真题功能
 * ============================================
 */

// API基础URL
var API_BASE = '';

// ============================================
// 页面初始化
// ============================================

/**
 * 页面加载完成后初始化应用
 */
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

/**
 * 初始化应用
 * 按顺序加载各种数据和配置
 */
function initApp() {
    // 初始化配置页面
    if (typeof initConfigPage === 'function') {
        initConfigPage();
    }

    // 初始化字数统计
    initWordCount();

    // 加载高考真题列表
    loadGaokaoTopics();

    // 加载数据库统计
    if (typeof loadDbStats === 'function') {
        loadDbStats();
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

/**
 * 显示指定的页面部分
 * @param {string} section - 部分名称（home/guide/analyze/score/materials/gaokao/database/config）
 * @param {HTMLElement} clickedElement - 被点击的导航元素
 */
function showSection(section, clickedElement) {
    // 隐藏所有section
    var sections = document.querySelectorAll('[id^="section-"]');
    for (var i = 0; i < sections.length; i++) {
        sections[i].style.display = 'none';
    }

    // 显示目标section
    var target = document.getElementById('section-' + section);
    if (target) {
        target.style.display = 'block';
        target.classList.add('fade-in');
    }

    // 更新导航状态
    var navLinks = document.querySelectorAll('.nav-link');
    for (var j = 0; j < navLinks.length; j++) {
        navLinks[j].classList.remove('active');
    }
    if (clickedElement) {
        clickedElement.classList.add('active');
    }

    // 检查配置状态
    if (section !== 'config' && typeof checkConfigAlert === 'function') {
        checkConfigAlert();
    }
}

// ============================================
// 字数统计
// ============================================

/**
 * 初始化字数统计功能
 */
function initWordCount() {
    var analyzeContent = document.getElementById('analyze-content');
    if (analyzeContent) {
        analyzeContent.addEventListener('input', function() {
            var count = this.value.replace(/\s/g, '').length;
            var countElement = document.getElementById('analyze-word-count');
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }
}

// ============================================
// 创作指导功能
// ============================================

/**
 * 获取写作指导
 */
function getWritingGuide() {
    var topic = document.getElementById('guide-topic').value.trim();
    var genre = document.getElementById('guide-genre').value;

    if (!topic) {
        alert('请输入作文题目');
        return;
    }

    var config = typeof getCurrentConfig === 'function' ? getCurrentConfig() : null;
    if (!config) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('guide-loading');
    hideResult('guide-result');

    fetch(API_BASE + '/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic, genre: genre })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showResult('guide-result', 'guide-content', data.guide);
        } else {
            alert('获取指导失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(function(error) {
        alert('请求失败: ' + error.message);
    })
    .finally(function() {
        hideLoading('guide-loading');
    });
}

// ============================================
// 作文分析功能
// ============================================

/**
 * 分析作文
 */
function analyzeEssay() {
    var title = document.getElementById('analyze-title').value.trim();
    var content = document.getElementById('analyze-content').value.trim();

    if (!title || !content) {
        alert('请输入作文题目和内容');
        return;
    }

    var config = typeof getCurrentConfig === 'function' ? getCurrentConfig() : null;
    if (!config) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('analyze-loading');
    hideResult('analyze-result');

    fetch(API_BASE + '/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, content: content })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showResult('analyze-result', 'analyze-content', data.analysis);
        } else {
            alert('分析失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(function(error) {
        alert('请求失败: ' + error.message);
    })
    .finally(function() {
        hideLoading('analyze-loading');
    });
}

/**
 * 综合评价（分析+评分+建议）
 */
function comprehensiveEvaluate() {
    var title = document.getElementById('analyze-title').value.trim();
    var content = document.getElementById('analyze-content').value.trim();

    if (!title || !content) {
        alert('请输入作文题目和内容');
        return;
    }

    var config = typeof getCurrentConfig === 'function' ? getCurrentConfig() : null;
    if (!config) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('analyze-loading');
    hideResult('analyze-result');

    fetch(API_BASE + '/api/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, content: content, genre: '议论文' })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showResult('analyze-result', 'analyze-content', data.comprehensive_result);
        } else {
            alert('评价失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(function(error) {
        alert('请求失败: ' + error.message);
    })
    .finally(function() {
        hideLoading('analyze-loading');
    });
}

/**
 * 获取修改建议
 */
function getRevisionSuggestions() {
    var title = document.getElementById('analyze-title').value.trim();
    var content = document.getElementById('analyze-content').value.trim();
    var analysisElement = document.getElementById('analyze-content');
    var analysis = analysisElement ? analysisElement.innerText : '';

    if (!title || !content) {
        alert('请先输入作文题目和内容');
        return;
    }

    showLoading('analyze-loading');

    fetch(API_BASE + '/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, content: content, analysis: analysis })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showResult('analyze-result', 'analyze-content', data.suggestions);
        } else {
            alert('获取修改建议失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(function(error) {
        alert('请求失败: ' + error.message);
    })
    .finally(function() {
        hideLoading('analyze-loading');
    });
}

// ============================================
// 智能评分功能
// ============================================

/**
 * 作文评分
 */
function scoreEssay() {
    var title = document.getElementById('score-title').value.trim();
    var content = document.getElementById('score-content').value.trim();
    var totalScoreElement = document.getElementById('score-total');
    var totalScore = totalScoreElement ? parseInt(totalScoreElement.value) : 60;

    if (!title || !content) {
        alert('请输入作文题目和内容');
        return;
    }

    var config = typeof getCurrentConfig === 'function' ? getCurrentConfig() : null;
    if (!config) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('score-loading');
    hideResult('score-result');

    fetch(API_BASE + '/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, content: content, total_score: totalScore })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showResult('score-result', 'score-content', data.scoring_result);
        } else {
            alert('评分失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(function(error) {
        alert('请求失败: ' + error.message);
    })
    .finally(function() {
        hideLoading('score-loading');
    });
}

// ============================================
// 素材推荐功能
// ============================================

/**
 * 获取素材推荐
 */
function getMaterials() {
    var topic = document.getElementById('material-topic').value.trim();
    var angleElement = document.getElementById('material-angle');
    var angle = angleElement ? angleElement.value.trim() : '';

    if (!topic) {
        alert('请输入作文主题');
        return;
    }

    var config = typeof getCurrentConfig === 'function' ? getCurrentConfig() : null;
    if (!config) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('material-loading');
    hideResult('material-result');

    fetch(API_BASE + '/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic, angle: angle })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            showResult('material-result', 'material-content', data.materials);
        } else {
            alert('获取素材失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(function(error) {
        alert('请求失败: ' + error.message);
    })
    .finally(function() {
        hideLoading('material-loading');
    });
}

// ============================================
// AI写作成文功能
// ============================================

/**
 * AI生成作文
 */
function generateEssay() {
    var topic = document.getElementById('write-topic').value.trim();
    var genre = document.getElementById('write-genre').value;
    var level = document.getElementById('write-level').value;
    var wordcount = document.getElementById('write-wordcount').value;
    var requirements = document.getElementById('write-requirements').value.trim();

    if (!topic) {
        alert('请输入作文题目');
        return;
    }

    var config = typeof getCurrentConfig === 'function' ? getCurrentConfig() : null;
    if (!config) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('write-loading');
    hideResult('write-result');

    fetch(API_BASE + '/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            topic: topic,
            genre: genre,
            level: level,
            wordcount: wordcount,
            requirements: requirements
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            document.getElementById('write-result-title').textContent = topic + ' - AI生成作文';
            showResult('write-result', 'write-content', data.essay);
        } else {
            alert('生成失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(function(error) {
        alert('请求失败: ' + error.message);
    })
    .finally(function() {
        hideLoading('write-loading');
    });
}

/**
 * 分析AI生成的作文
 */
function analyzeGeneratedEssay() {
    var topic = document.getElementById('write-topic').value.trim();
    var contentEl = document.getElementById('write-content');
    var content = contentEl ? contentEl.innerText : '';

    if (!topic || !content) {
        alert('请先生成作文');
        return;
    }

    // 切换到分析页面并填入内容
    showSection('analyze');
    document.getElementById('analyze-title').value = topic;
    document.getElementById('analyze-content').value = content;

    // 更新字数统计
    var countElement = document.getElementById('analyze-word-count');
    if (countElement) {
        countElement.textContent = content.replace(/\s/g, '').length;
    }
}

// ============================================
// 高考真题功能
// ============================================

/**
 * 加载高考真题列表
 */
function loadGaokaoTopics() {
    fetch(API_BASE + '/api/gaokao/topics')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                renderGaokaoTopics(data.topics);
            }
        })
        .catch(function(error) {
            console.error('加载高考真题列表失败:', error);
        });
}

/**
 * 渲染高考真题列表
 * @param {Array} topics - 真题数组
 */
function renderGaokaoTopics(topics) {
    var container = document.getElementById('gaokao-topics-list');
    if (!container) return;

    if (!topics || topics.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无真题数据</div>';
        return;
    }

    // 按年份分组
    var grouped = {};
    for (var i = 0; i < topics.length; i++) {
        var t = topics[i];
        if (!grouped[t.year]) grouped[t.year] = [];
        grouped[t.year].push(t);
    }

    var html = '';
    var years = Object.keys(grouped).sort().reverse();
    for (var y = 0; y < years.length; y++) {
        var year = years[y];
        html += '<div class="feature-card" style="padding: 1.5rem;">';
        html += '<h4 style="color: var(--primary-light); margin-bottom: 1rem;">' + year + '年</h4>';
        html += '<ul style="list-style: none; padding: 0;">';

        for (var j = 0; j < grouped[year].length; j++) {
            var topic = grouped[year][j];
            // 使用data属性存储参数，避免字符串转义问题
            html += '<li class="gaokao-topic-item" ';
            html += 'data-year="' + year + '" ';
            html += 'data-paper="' + (topic.paper || '') + '" ';
            html += 'style="margin-bottom: 0.75rem; padding: 0.75rem; background: var(--bg-input); border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s;">';
            html += '<div style="font-weight: 500;">' + (topic.paper || '') + '</div>';
            html += '<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">' + (topic.topic || '') + '</div>';

            if (topic.themes && topic.themes.length > 0) {
                html += '<div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">';
                for (var k = 0; k < topic.themes.length; k++) {
                    html += '<span class="tag tag-primary">' + topic.themes[k] + '</span>';
                }
                html += '</div>';
            }

            html += '</li>';
        }

        html += '</ul></div>';
    }

    container.innerHTML = html;

    // 使用事件委托绑定点击事件
    container.onclick = function(e) {
        var target = e.target;
        // 向上查找带有gaokao-topic-item类的元素
        while (target && target !== container) {
            if (target.classList && target.classList.contains('gaokao-topic-item')) {
                var year = target.getAttribute('data-year');
                var paper = target.getAttribute('data-paper');
                if (year && paper) {
                    practiceGaokaoTopic(year, paper);
                }
                return;
            }
            target = target.parentNode;
        }
    };
}

/**
 * 开始高考真题练习（随机）
 */
function startGaokaoPractice() {
    var yearElement = document.getElementById('gaokao-year');
    var year = yearElement ? yearElement.value : '';

    var config = typeof getCurrentConfig === 'function' ? getCurrentConfig() : null;
    if (!config) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('gaokao-loading');
    hideResult('gaokao-result');

    fetch(API_BASE + '/api/gaokao/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: year || null })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            var topicInfo = data.topic_info;
            var titleElement = document.getElementById('gaokao-result-title');
            if (titleElement) {
                titleElement.textContent = topicInfo.year + '年' + topicInfo.paper + ' - ' + topicInfo.topic;
            }
            showResult('gaokao-result', 'gaokao-content', data.guide);
        } else {
            alert('获取真题讲解失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(function(error) {
        alert('请求失败: ' + error.message);
    })
    .finally(function() {
        hideLoading('gaokao-loading');
    });
}

/**
 * 练习指定的高考真题
 * @param {string} year - 年份
 * @param {string} paper - 试卷名称
 */
function practiceGaokaoTopic(year, paper) {
    var config = typeof getCurrentConfig === 'function' ? getCurrentConfig() : null;
    if (!config) {
        alert('请先配置AI服务');
        showSection('config');
        return;
    }

    showLoading('gaokao-loading');
    hideResult('gaokao-result');

    fetch(API_BASE + '/api/gaokao/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: year })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.success) {
            var topicInfo = data.topic_info;
            var titleElement = document.getElementById('gaokao-result-title');
            if (titleElement) {
                titleElement.textContent = topicInfo.year + '年' + topicInfo.paper + ' - ' + topicInfo.topic;
            }
            showResult('gaokao-result', 'gaokao-content', data.guide);
        } else {
            alert('获取真题讲解失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(function(error) {
        alert('请求失败: ' + error.message);
    })
    .finally(function() {
        hideLoading('gaokao-loading');
    });
}

// ============================================
// UI工具函数
// ============================================

/**
 * 显示加载动画
 * @param {string} id - 加载元素ID
 */
function showLoading(id) {
    var el = document.getElementById(id);
    if (el) {
        el.style.display = 'flex';
    }
}

/**
 * 隐藏加载动画
 * @param {string} id - 加载元素ID
 */
function hideLoading(id) {
    var el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
    }
}

/**
 * 显示结果
 * @param {string} resultId - 结果容器ID
 * @param {string} contentId - 内容元素ID
 * @param {string} markdown - Markdown内容
 */
function showResult(resultId, contentId, markdown) {
    var resultEl = document.getElementById(resultId);
    var contentEl = document.getElementById(contentId);

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

/**
 * 隐藏结果
 * @param {string} id - 结果容器ID
 */
function hideResult(id) {
    var el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
    }
}

/**
 * 复制结果到剪贴板
 * @param {string} contentId - 内容元素ID
 */
function copyResult(contentId) {
    var contentEl = document.getElementById(contentId);
    if (!contentEl) return;

    var text = contentEl.innerText;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            alert('已复制到剪贴板');
        }).catch(function() {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

/**
 * 降级复制方案
 * @param {string} text - 要复制的文本
 */
function fallbackCopy(text) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('已复制到剪贴板');
}

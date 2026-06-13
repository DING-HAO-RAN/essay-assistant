/**
 * ============================================
 * 数据库管理模块
 * ============================================
 * 负责数据库页面的所有交互功能：
 * - 作文题目管理（增删改查、导入导出）
 * - 素材管理（增删改查、搜索、导入导出）
 * - 范文管理（增删改查、导入导出）
 * - 评分标准管理（增删改查）
 * - 数据统计展示
 * ============================================
 */

// 全局变量：当前导入类型
var currentImportType = null;

/**
 * 加载数据库统计信息
 * 在页面初始化时调用，显示各类数据的数量
 */
function loadDbStats() {
    fetch(API_BASE + '/api/db/stats')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                var stats = data.stats;
                var container = document.getElementById('db-stats');
                if (container) {
                    container.innerHTML =
                        '<div class="feature-card" style="padding:1rem;text-align:center;">' +
                            '<div style="font-size:2rem;font-weight:700;color:var(--primary);">' + (stats.topics || 0) + '</div>' +
                            '<div style="color:var(--text-secondary);">作文题目</div>' +
                        '</div>' +
                        '<div class="feature-card" style="padding:1rem;text-align:center;">' +
                            '<div style="font-size:2rem;font-weight:700;color:var(--secondary);">' + (stats.materials || 0) + '</div>' +
                            '<div style="color:var(--text-secondary);">素材</div>' +
                        '</div>' +
                        '<div class="feature-card" style="padding:1rem;text-align:center;">' +
                            '<div style="font-size:2rem;font-weight:700;color:var(--success);">' + (stats.essays || 0) + '</div>' +
                            '<div style="color:var(--text-secondary);">范文</div>' +
                        '</div>' +
                        '<div class="feature-card" style="padding:1rem;text-align:center;">' +
                            '<div style="font-size:2rem;font-weight:700;color:var(--warning);">' + (stats.standards || 0) + '</div>' +
                            '<div style="color:var(--text-secondary);">评分标准</div>' +
                        '</div>';
                }
            }
        })
        .catch(function(e) { console.error('加载统计失败:', e); });
}

/**
 * 切换数据库标签页
 * @param {string} tab - 标签页名称（topics/materials/essays/standards）
 * @param {HTMLElement} clickedElement - 被点击的标签元素
 */
function switchDbTab(tab, clickedElement) {
    // 隐藏所有标签页内容
    var tabContents = document.querySelectorAll('[id^="db-tab-"]');
    for (var i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
    }

    // 移除所有标签的active状态
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    // 显示选中的标签页
    var targetTab = document.getElementById('db-tab-' + tab);
    if (targetTab) {
        targetTab.style.display = 'block';
    }

    // 设置当前标签为active
    if (clickedElement) {
        clickedElement.classList.add('active');
    }

    // 加载对应数据
    if (tab === 'topics') loadTopics();
    if (tab === 'materials') loadMaterials();
    if (tab === 'essays') loadEssays();
    if (tab === 'standards') loadStandards();
}

// ============================================
// 作文题目管理
// ============================================

/**
 * 加载作文题目列表
 */
function loadTopics() {
    fetch(API_BASE + '/api/db/topics')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) renderTopics(data.topics);
        })
        .catch(function(e) { console.error('加载题目失败:', e); });
}

/**
 * 渲染作文题目列表
 * @param {Array} topics - 题目数组
 */
function renderTopics(topics) {
    var container = document.getElementById('topics-list');
    if (!container) return;

    if (!topics || topics.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无数据，点击"添加题目"开始</div>';
        return;
    }

    var html = '<div style="display:grid;gap:1rem;">';
    for (var i = 0; i < topics.length; i++) {
        var t = topics[i];
        var themes = Array.isArray(t.themes) ? t.themes : [];
        var themeHtml = '';
        for (var j = 0; j < themes.length; j++) {
            themeHtml += '<span class="tag tag-primary">' + themes[j] + '</span>';
        }

        html += '<div class="history-item" style="flex-direction:column;align-items:flex-start;">';
        html += '<div style="display:flex;justify-content:space-between;width:100%;">';
        html += '<div>';
        html += '<div class="history-title">' + (t.title || '') + '</div>';
        html += '<div class="history-meta">' + (t.year ? t.year + '年' : '') + ' ' + (t.paper || '') + ' | ' + (t.genre || '议论文') + '</div>';
        html += '</div>';
        html += '<button class="btn btn-sm btn-danger" onclick="deleteTopic(' + t.id + ')">删除</button>';
        html += '</div>';
        if (t.material) {
            html += '<div style="margin-top:0.5rem;font-size:0.9rem;color:var(--text-secondary);">' + String(t.material).substring(0, 80) + '...</div>';
        }
        html += '<div style="display:flex;gap:4px;margin-top:0.5rem;flex-wrap:wrap;">' + themeHtml + '</div>';
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

/**
 * 显示添加题目的模态框
 */
function showAddTopicModal() {
    document.getElementById('modal-title').textContent = '添加作文题目';
    document.getElementById('modal-body').innerHTML =
        '<div class="form-group">' +
            '<label class="form-label">题目*</label>' +
            '<input type="text" class="form-input" id="topic-title">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">材料</label>' +
            '<textarea class="form-textarea" id="topic-material" rows="3"></textarea>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">' +
            '<div class="form-group">' +
                '<label class="form-label">文体</label>' +
                '<select class="form-select" id="topic-genre">' +
                    '<option>议论文</option>' +
                    '<option>记叙文</option>' +
                    '<option>说明文</option>' +
                    '<option>散文</option>' +
                '</select>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">年份</label>' +
                '<input type="number" class="form-input" id="topic-year" placeholder="2024">' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">试卷</label>' +
            '<input type="text" class="form-input" id="topic-paper">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">关键词(逗号分隔)</label>' +
            '<input type="text" class="form-input" id="topic-keywords">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">主题(逗号分隔)</label>' +
            '<input type="text" class="form-input" id="topic-themes">' +
        '</div>' +
        '<button class="btn btn-primary btn-block" onclick="saveTopic()">保存</button>';
    openModal();
}

/**
 * 保存作文题目
 */
function saveTopic() {
    var title = document.getElementById('topic-title').value;
    var material = document.getElementById('topic-material').value;
    var genre = document.getElementById('topic-genre').value;
    var yearStr = document.getElementById('topic-year').value;
    var paper = document.getElementById('topic-paper').value;
    var keywordsStr = document.getElementById('topic-keywords').value;
    var themesStr = document.getElementById('topic-themes').value;

    var data = {
        title: title,
        material: material,
        genre: genre,
        year: yearStr ? parseInt(yearStr) : null,
        paper: paper,
        keywords: keywordsStr ? keywordsStr.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [],
        themes: themesStr ? themesStr.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : []
    };

    if (!data.title) {
        alert('请输入题目');
        return;
    }

    fetch(API_BASE + '/api/db/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(function(response) { return response.json(); })
    .then(function(result) {
        if (result.success) {
            alert('添加成功');
            closeModal();
            loadTopics();
            loadDbStats();
        } else {
            alert('失败: ' + result.error);
        }
    })
    .catch(function(e) { alert('请求失败: ' + e.message); });
}

/**
 * 删除作文题目
 * @param {number} id - 题目ID
 */
function deleteTopic(id) {
    if (!confirm('确定删除?')) return;
    fetch(API_BASE + '/api/db/topics/' + id, { method: 'DELETE' })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                loadTopics();
                loadDbStats();
            }
        })
        .catch(function(e) { alert(e.message); });
}

/**
 * 批量导入题目
 */
function importTopics() {
    currentImportType = 'topics';
    document.getElementById('import-modal-title').textContent = '批量导入题目';
    document.getElementById('import-format-text').textContent = '格式: [{"title":"题目","material":"材料","genre":"议论文","year":2024}]';
    document.getElementById('import-data').value = '';
    openImportModal();
}

// ============================================
// 素材管理
// ============================================

/**
 * 加载素材列表
 */
function loadMaterials() {
    var catElement = document.getElementById('material-category-filter');
    var cat = catElement ? catElement.value : '';
    var url = cat ? API_BASE + '/api/db/materials?category=' + encodeURIComponent(cat) : API_BASE + '/api/db/materials';

    fetch(url)
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) renderMaterials(data.materials);
        })
        .catch(function(e) { console.error('加载素材失败:', e); });
}

/**
 * 搜索素材
 */
function searchMaterials() {
    var kw = document.getElementById('material-search').value;
    if (!kw) {
        loadMaterials();
        return;
    }
    fetch(API_BASE + '/api/db/materials/search?keyword=' + encodeURIComponent(kw))
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) renderMaterials(data.materials);
        })
        .catch(function(e) { console.error('搜索失败:', e); });
}

/**
 * 渲染素材列表
 * @param {Array} materials - 素材数组
 */
function renderMaterials(materials) {
    var container = document.getElementById('materials-list');
    if (!container) return;

    if (!materials || materials.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无数据</div>';
        return;
    }

    var html = '<div style="display:grid;gap:1rem;">';
    for (var i = 0; i < materials.length; i++) {
        var m = materials[i];
        html += '<div class="history-item" style="flex-direction:column;align-items:flex-start;">';
        html += '<div style="display:flex;justify-content:space-between;width:100%;">';
        html += '<div>';
        html += '<span class="tag tag-primary">' + (m.category || '未分类') + '</span>';
        if (m.theme) {
            html += ' <span class="tag tag-success">' + m.theme + '</span>';
        }
        html += '</div>';
        html += '<button class="btn btn-sm btn-danger" onclick="deleteMaterial(' + m.id + ')">删除</button>';
        html += '</div>';
        html += '<div style="margin-top:0.5rem;">' + (m.content || '') + '</div>';
        html += '<div class="history-meta">' + (m.author ? m.author + ' | ' : '') + (m.source || '') + '</div>';
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

/**
 * 显示添加素材的模态框
 */
function showAddMaterialModal() {
    document.getElementById('modal-title').textContent = '添加素材';
    document.getElementById('modal-body').innerHTML =
        '<div class="form-group">' +
            '<label class="form-label">分类*</label>' +
            '<select class="form-select" id="material-category">' +
                '<option>名言警句</option>' +
                '<option>历史典故</option>' +
                '<option>人物事迹</option>' +
                '<option>时事素材</option>' +
                '<option>其他</option>' +
            '</select>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">内容*</label>' +
            '<textarea class="form-textarea" id="material-content" rows="3"></textarea>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">' +
            '<div class="form-group">' +
                '<label class="form-label">作者</label>' +
                '<input type="text" class="form-input" id="material-author">' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">来源</label>' +
                '<input type="text" class="form-input" id="material-source">' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">适用主题</label>' +
            '<input type="text" class="form-input" id="material-theme">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">使用指南</label>' +
            '<textarea class="form-textarea" id="material-usage" rows="2"></textarea>' +
        '</div>' +
        '<button class="btn btn-primary btn-block" onclick="saveMaterial()">保存</button>';
    openModal();
}

/**
 * 保存素材
 */
function saveMaterial() {
    var data = {
        category: document.getElementById('material-category').value,
        content: document.getElementById('material-content').value,
        author: document.getElementById('material-author').value,
        source: document.getElementById('material-source').value,
        theme: document.getElementById('material-theme').value,
        usage_guide: document.getElementById('material-usage').value
    };

    if (!data.content) {
        alert('请输入内容');
        return;
    }

    fetch(API_BASE + '/api/db/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(function(response) { return response.json(); })
    .then(function(result) {
        if (result.success) {
            alert('添加成功');
            closeModal();
            loadMaterials();
            loadDbStats();
        } else {
            alert('失败: ' + result.error);
        }
    })
    .catch(function(e) { alert('请求失败: ' + e.message); });
}

/**
 * 删除素材
 * @param {number} id - 素材ID
 */
function deleteMaterial(id) {
    if (!confirm('确定删除?')) return;
    fetch(API_BASE + '/api/db/materials/' + id, { method: 'DELETE' })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                loadMaterials();
                loadDbStats();
            }
        })
        .catch(function(e) { alert(e.message); });
}

/**
 * 批量导入素材
 */
function importMaterials() {
    currentImportType = 'materials';
    document.getElementById('import-modal-title').textContent = '批量导入素材';
    document.getElementById('import-format-text').textContent = '格式: [{"category":"名言警句","content":"内容","author":"作者","source":"来源","theme":"主题"}]';
    document.getElementById('import-data').value = '';
    openImportModal();
}

// ============================================
// 范文管理
// ============================================

/**
 * 加载范文列表
 */
function loadEssays() {
    var genreElement = document.getElementById('essay-genre-filter');
    var genre = genreElement ? genreElement.value : '';
    var url = genre ? API_BASE + '/api/db/essays?genre=' + encodeURIComponent(genre) : API_BASE + '/api/db/essays';

    fetch(url)
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) renderEssays(data.essays);
        })
        .catch(function(e) { console.error('加载范文失败:', e); });
}

/**
 * 渲染范文列表
 * @param {Array} essays - 范文数组
 */
function renderEssays(essays) {
    var container = document.getElementById('essays-list');
    if (!container) return;

    if (!essays || essays.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无数据</div>';
        return;
    }

    var html = '<div style="display:grid;gap:1rem;">';
    for (var i = 0; i < essays.length; i++) {
        var e = essays[i];
        html += '<div class="history-item" style="flex-direction:column;align-items:flex-start;">';
        html += '<div style="display:flex;justify-content:space-between;width:100%;">';
        html += '<div>';
        html += '<div class="history-title">' + (e.title || '') + '</div>';
        html += '<div class="history-meta">' + (e.genre || '议论文') + (e.score ? ' | ' + e.score + '分' : '') + '</div>';
        html += '</div>';
        html += '<div style="display:flex;gap:8px;">';
        html += '<button class="btn btn-sm btn-secondary" onclick="viewEssay(' + e.id + ')">查看</button>';
        html += '<button class="btn btn-sm btn-danger" onclick="deleteEssay(' + e.id + ')">删除</button>';
        html += '</div>';
        html += '</div>';
        html += '<div style="margin-top:0.5rem;font-size:0.9rem;color:var(--text-secondary);">' + String(e.content || '').substring(0, 80) + '...</div>';
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

/**
 * 显示添加范文的模态框
 */
function showAddEssayModal() {
    document.getElementById('modal-title').textContent = '添加范文';
    document.getElementById('modal-body').innerHTML =
        '<div class="form-group">' +
            '<label class="form-label">标题*</label>' +
            '<input type="text" class="form-input" id="essay-title">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">内容*</label>' +
            '<textarea class="form-textarea" id="essay-content" rows="10"></textarea>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">' +
            '<div class="form-group">' +
                '<label class="form-label">文体</label>' +
                '<select class="form-select" id="essay-genre">' +
                    '<option>议论文</option>' +
                    '<option>记叙文</option>' +
                    '<option>说明文</option>' +
                    '<option>散文</option>' +
                '</select>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">评分</label>' +
                '<input type="number" class="form-input" id="essay-score" placeholder="55">' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">来源</label>' +
            '<input type="text" class="form-input" id="essay-source">' +
        '</div>' +
        '<button class="btn btn-primary btn-block" onclick="saveEssay()">保存</button>';
    openModal();
}

/**
 * 保存范文
 */
function saveEssay() {
    var title = document.getElementById('essay-title').value;
    var content = document.getElementById('essay-content').value;
    var genre = document.getElementById('essay-genre').value;
    var scoreStr = document.getElementById('essay-score').value;
    var source = document.getElementById('essay-source').value;

    var data = {
        title: title,
        content: content,
        genre: genre,
        score: scoreStr ? parseInt(scoreStr) : null,
        source: source
    };

    if (!data.title || !data.content) {
        alert('请输入标题和内容');
        return;
    }

    fetch(API_BASE + '/api/db/essays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(function(response) { return response.json(); })
    .then(function(result) {
        if (result.success) {
            alert('添加成功');
            closeModal();
            loadEssays();
            loadDbStats();
        } else {
            alert('失败: ' + result.error);
        }
    })
    .catch(function(e) { alert('请求失败: ' + e.message); });
}

/**
 * 查看范文详情
 * @param {number} id - 范文ID
 */
function viewEssay(id) {
    fetch(API_BASE + '/api/db/essays/' + id)
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                var e = data.essay;
                document.getElementById('modal-title').textContent = e.title || '范文详情';
                document.getElementById('modal-body').innerHTML =
                    '<div style="margin-bottom:1rem;">' +
                        '<span class="tag tag-primary">' + (e.genre || '议论文') + '</span>' +
                        (e.score ? ' <span class="tag tag-success">' + e.score + '分</span>' : '') +
                    '</div>' +
                    '<div style="max-height:400px;overflow-y:auto;padding:1rem;background:var(--bg-input);border-radius:8px;">' +
                        String(e.content || '').replace(/\n/g, '<br>') +
                    '</div>';
                openModal();
            }
        })
        .catch(function(e) { alert('获取失败: ' + e.message); });
}

/**
 * 删除范文
 * @param {number} id - 范文ID
 */
function deleteEssay(id) {
    if (!confirm('确定删除?')) return;
    fetch(API_BASE + '/api/db/essays/' + id, { method: 'DELETE' })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                loadEssays();
                loadDbStats();
            }
        })
        .catch(function(e) { alert(e.message); });
}

/**
 * 批量导入范文
 */
function importEssays() {
    currentImportType = 'essays';
    document.getElementById('import-modal-title').textContent = '批量导入范文';
    document.getElementById('import-format-text').textContent = '格式: [{"title":"标题","content":"内容","genre":"议论文","score":55}]';
    document.getElementById('import-data').value = '';
    openImportModal();
}

// ============================================
// 评分标准管理
// ============================================

/**
 * 加载评分标准列表
 */
function loadStandards() {
    var catElement = document.getElementById('standard-category-filter');
    var cat = catElement ? catElement.value : '';
    var url = cat ? API_BASE + '/api/db/standards?category=' + encodeURIComponent(cat) : API_BASE + '/api/db/standards';

    fetch(url)
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) renderStandards(data.standards);
        })
        .catch(function(e) { console.error('加载评分标准失败:', e); });
}

/**
 * 渲染评分标准列表
 * @param {Array} standards - 评分标准数组
 */
function renderStandards(standards) {
    var container = document.getElementById('standards-list');
    if (!container) return;

    if (!standards || standards.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无数据</div>';
        return;
    }

    // 按类别分组
    var grouped = {};
    for (var i = 0; i < standards.length; i++) {
        var s = standards[i];
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category].push(s);
    }

    var html = '';
    var categories = Object.keys(grouped);
    for (var c = 0; c < categories.length; c++) {
        var cat = categories[c];
        html += '<h4 style="margin:1rem 0;color:var(--primary-light);">' + cat + '</h4>';
        for (var j = 0; j < grouped[cat].length; j++) {
            var item = grouped[cat][j];
            html += '<div class="history-item" style="margin-bottom:0.5rem;">';
            html += '<div><strong>' + (item.name || '') + '</strong>';
            html += '<span class="tag tag-primary" style="margin-left:8px;">' + (item.score_range || '') + '</span></div>';
            html += '<div style="color:var(--text-secondary);font-size:0.9rem;">' + (item.description || '') + '</div>';
            html += '</div>';
        }
    }
    container.innerHTML = html;
}

/**
 * 显示添加评分标准的模态框
 */
function showAddStandardModal() {
    document.getElementById('modal-title').textContent = '添加评分标准';
    document.getElementById('modal-body').innerHTML =
        '<div class="form-group">' +
            '<label class="form-label">名称*</label>' +
            '<input type="text" class="form-input" id="standard-name" placeholder="内容一等">' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">' +
            '<div class="form-group">' +
                '<label class="form-label">类别</label>' +
                '<select class="form-select" id="standard-category">' +
                    '<option>内容</option>' +
                    '<option>表达</option>' +
                    '<option>发展等级</option>' +
                '</select>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">分数范围</label>' +
                '<input type="text" class="form-input" id="standard-score-range" placeholder="20-16">' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">描述</label>' +
            '<textarea class="form-textarea" id="standard-description" rows="2"></textarea>' +
        '</div>' +
        '<button class="btn btn-primary btn-block" onclick="saveStandard()">保存</button>';
    openModal();
}

/**
 * 保存评分标准
 */
function saveStandard() {
    var data = {
        name: document.getElementById('standard-name').value,
        category: document.getElementById('standard-category').value,
        score_range: document.getElementById('standard-score-range').value,
        description: document.getElementById('standard-description').value
    };

    if (!data.name) {
        alert('请输入名称');
        return;
    }

    fetch(API_BASE + '/api/db/standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(function(response) { return response.json(); })
    .then(function(result) {
        if (result.success) {
            alert('添加成功');
            closeModal();
            loadStandards();
            loadDbStats();
        } else {
            alert('失败: ' + result.error);
        }
    })
    .catch(function(e) { alert('请求失败: ' + e.message); });
}

// ============================================
// 通用模态框功能
// ============================================

/**
 * 打开模态框
 */
function openModal() {
    var overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

/**
 * 关闭模态框
 */
function closeModal() {
    var overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * 打开导入模态框
 */
function openImportModal() {
    var overlay = document.getElementById('import-modal-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

/**
 * 关闭导入模态框
 */
function closeImportModal() {
    var overlay = document.getElementById('import-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * 执行数据导入
 */
function doImport() {
    var dataStr = document.getElementById('import-data').value;
    if (!dataStr) {
        alert('请输入数据');
        return;
    }

    var data;
    try {
        data = JSON.parse(dataStr);
        if (!Array.isArray(data)) {
            alert('必须是数组');
            return;
        }
    } catch (e) {
        alert('JSON错误: ' + e.message);
        return;
    }

    fetch(API_BASE + '/api/db/import/' + currentImportType, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data })
    })
    .then(function(response) { return response.json(); })
    .then(function(result) {
        if (result.success) {
            alert(result.message);
            closeImportModal();
            loadDbStats();
            if (currentImportType === 'topics') loadTopics();
            if (currentImportType === 'materials') loadMaterials();
            if (currentImportType === 'essays') loadEssays();
        } else {
            alert('失败: ' + result.error);
        }
    })
    .catch(function(e) { alert('请求失败: ' + e.message); });
}

/**
 * 导出数据
 * @param {string} table - 表名
 */
function exportData(table) {
    fetch(API_BASE + '/api/db/export/' + table)
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.success) {
                var blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = table + '_export.json';
                a.click();
                URL.revokeObjectURL(url);
            }
        })
        .catch(function(e) { alert('导出失败: ' + e.message); });
}

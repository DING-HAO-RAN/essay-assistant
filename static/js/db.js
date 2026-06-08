// ============================================
// 数据库管理模块
// ============================================

let currentImportType = null;

async function loadDbStats() {
    try {
        const response = await fetch(API_BASE + '/api/db/stats');
        const data = await response.json();
        if (data.success) {
            const stats = data.stats;
            const container = document.getElementById('db-stats');
            if (container) {
                container.innerHTML = '<div class="feature-card" style="padding:1rem;text-align:center;"><div style="font-size:2rem;font-weight:700;color:var(--primary);">' + (stats.topics||0) + '</div><div style="color:var(--text-secondary);">作文题目</div></div><div class="feature-card" style="padding:1rem;text-align:center;"><div style="font-size:2rem;font-weight:700;color:var(--secondary);">' + (stats.materials||0) + '</div><div style="color:var(--text-secondary);">素材</div></div><div class="feature-card" style="padding:1rem;text-align:center;"><div style="font-size:2rem;font-weight:700;color:var(--success);">' + (stats.essays||0) + '</div><div style="color:var(--text-secondary);">范文</div></div><div class="feature-card" style="padding:1rem;text-align:center;"><div style="font-size:2rem;font-weight:700;color:var(--warning);">' + (stats.standards||0) + '</div><div style="color:var(--text-secondary);">评分标准</div></div>';
            }
        }
    } catch(e) { console.error(e); }
}

function switchDbTab(tab) {
    document.querySelectorAll('[id^="db-tab-"]').forEach(function(el) { el.style.display='none'; });
    document.querySelectorAll('.tab').forEach(function(el) { el.classList.remove('active'); });
    var t = document.getElementById('db-tab-' + tab);
    if(t) t.style.display='block';
    if(event && event.target) event.target.classList.add('active');
    if(tab==='topics') loadTopics();
    if(tab==='materials') loadMaterials();
    if(tab==='essays') loadEssays();
    if(tab==='standards') loadStandards();
}

// 作文题目管理
async function loadTopics(){
    try{var r=await fetch(API_BASE+'/api/db/topics');var d=await r.json();if(d.success)renderTopics(d.topics);}catch(e){console.error(e);}
}

function renderTopics(topics){
    var c=document.getElementById('topics-list');if(!c)return;
    if(!topics.length){c.innerHTML='<div class="alert alert-info">暂无数据，点击"添加题目"开始</div>';return;}
    var h='<div style="display:grid;gap:1rem;">';
    topics.forEach(function(t){
        var themes=Array.isArray(t.themes)?t.themes:[];
        h+='<div class="history-item" style="flex-direction:column;align-items:flex-start;"><div style="display:flex;justify-content:space-between;width:100%;"><div><div class="history-title">'+t.title+'</div><div class="history-meta">'+(t.year?t.year+'年':'')+' '+(t.paper||'')+' | '+(t.genre||'议论文')+'</div></div><button class="btn btn-sm btn-danger" onclick="deleteTopic('+t.id+')">删除</button></div>'+(t.material?'<div style="margin-top:0.5rem;font-size:0.9rem;color:var(--text-secondary);">'+String(t.material).substring(0,80)+'...</div>':'')+'<div style="display:flex;gap:4px;margin-top:0.5rem;flex-wrap:wrap;">'+themes.map(function(x){return '<span class="tag tag-primary">'+x+'</span>';}).join('')+'</div></div>';
    });
    h+='</div>';c.innerHTML=h;
}

function showAddTopicModal(){
    document.getElementById('modal-title').textContent='添加作文题目';
    document.getElementById('modal-body').innerHTML='<div class="form-group"><label class="form-label">题目*</label><input type="text" class="form-input" id="topic-title"></div><div class="form-group"><label class="form-label">材料</label><textarea class="form-textarea" id="topic-material" rows="3"></textarea></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="form-group"><label class="form-label">文体</label><select class="form-select" id="topic-genre"><option>议论文</option><option>记叙文</option><option>说明文</option><option>散文</option></select></div><div class="form-group"><label class="form-label">年份</label><input type="number" class="form-input" id="topic-year" placeholder="2024"></div></div><div class="form-group"><label class="form-label">试卷</label><input type="text" class="form-input" id="topic-paper"></div><div class="form-group"><label class="form-label">关键词(逗号分隔)</label><input type="text" class="form-input" id="topic-keywords"></div><div class="form-group"><label class="form-label">主题(逗号分隔)</label><input type="text" class="form-input" id="topic-themes"></div><button class="btn btn-primary btn-block" onclick="saveTopic()">保存</button>';
    openModal();
}

async function saveTopic(){
    var d={title:document.getElementById('topic-title').value,material:document.getElementById('topic-material').value,genre:document.getElementById('topic-genre').value,year:document.getElementById('topic-year').value?parseInt(document.getElementById('topic-year').value):null,paper:document.getElementById('topic-paper').value,keywords:document.getElementById('topic-keywords').value.split(',').map(function(s){return s.trim();}).filter(function(s){return s;}),themes:document.getElementById('topic-themes').value.split(',').map(function(s){return s.trim();}).filter(function(s){return s;})};
    if(!d.title){alert('请输入题目');return;}
    try{var r=await fetch(API_BASE+'/api/db/topics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});var res=await r.json();if(res.success){alert('添加成功');closeModal();loadTopics();loadDbStats();}else alert('失败:'+res.error);}catch(e){alert(e.message);}
}

async function deleteTopic(id){if(!confirm('确定删除?'))return;try{var r=await fetch(API_BASE+'/api/db/topics/'+id,{method:'DELETE'});var d=await r.json();if(d.success){loadTopics();loadDbStats();}}catch(e){alert(e.message);}}

function importTopics(){currentImportType='topics';document.getElementById('import-modal-title').textContent='批量导入题目';document.getElementById('import-format-text').textContent='格式: [{"title":"题目","material":"材料","genre":"议论文","year":2024}]';document.getElementById('import-data').value='';openImportModal();}

// 素材管理
async function loadMaterials(){var cat=document.getElementById('material-category-filter')?document.getElementById('material-category-filter').value:'';var url=cat?API_BASE+'/api/db/materials?category='+encodeURIComponent(cat):API_BASE+'/api/db/materials';try{var r=await fetch(url);var d=await r.json();if(d.success)renderMaterials(d.materials);}catch(e){console.error(e);}}

async function searchMaterials(){var kw=document.getElementById('material-search').value;if(!kw){loadMaterials();return;}try{var r=await fetch(API_BASE+'/api/db/materials/search?keyword='+encodeURIComponent(kw));var d=await r.json();if(d.success)renderMaterials(d.materials);}catch(e){console.error(e);}}

function renderMaterials(materials){var c=document.getElementById('materials-list');if(!c)return;if(!materials.length){c.innerHTML='<div class="alert alert-info">暂无数据</div>';return;}var h='<div style="display:grid;gap:1rem;">';materials.forEach(function(m){h+='<div class="history-item" style="flex-direction:column;align-items:flex-start;"><div style="display:flex;justify-content:space-between;width:100%;"><div><span class="tag tag-primary">'+(m.category||'未分类')+'</span>'+(m.theme?' <span class="tag tag-success">'+m.theme+'</span>':'')+'</div><button class="btn btn-sm btn-danger" onclick="deleteMaterial('+m.id+')">删除</button></div><div style="margin-top:0.5rem;">'+m.content+'</div><div class="history-meta">'+(m.author?m.author+' | ':'')+(m.source||'')+'</div></div>';});h+='</div>';c.innerHTML=h;}

function showAddMaterialModal(){document.getElementById('modal-title').textContent='添加素材';document.getElementById('modal-body').innerHTML='<div class="form-group"><label class="form-label">分类*</label><select class="form-select" id="material-category"><option>名言警句</option><option>历史典故</option><option>人物事迹</option><option>时事素材</option><option>其他</option></select></div><div class="form-group"><label class="form-label">内容*</label><textarea class="form-textarea" id="material-content" rows="3"></textarea></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="form-group"><label class="form-label">作者</label><input type="text" class="form-input" id="material-author"></div><div class="form-group"><label class="form-label">来源</label><input type="text" class="form-input" id="material-source"></div></div><div class="form-group"><label class="form-label">适用主题</label><input type="text" class="form-input" id="material-theme"></div><div class="form-group"><label class="form-label">使用指南</label><textarea class="form-textarea" id="material-usage" rows="2"></textarea></div><button class="btn btn-primary btn-block" onclick="saveMaterial()">保存</button>';openModal();}

async function saveMaterial(){var d={category:document.getElementById('material-category').value,content:document.getElementById('material-content').value,author:document.getElementById('material-author').value,source:document.getElementById('material-source').value,theme:document.getElementById('material-theme').value,usage_guide:document.getElementById('material-usage').value};if(!d.content){alert('请输入内容');return;}try{var r=await fetch(API_BASE+'/api/db/materials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});var res=await r.json();if(res.success){alert('添加成功');closeModal();loadMaterials();loadDbStats();}else alert('失败:'+res.error);}catch(e){alert(e.message);}}

async function deleteMaterial(id){if(!confirm('确定删除?'))return;try{var r=await fetch(API_BASE+'/api/db/materials/'+id,{method:'DELETE'});var d=await r.json();if(d.success){loadMaterials();loadDbStats();}}catch(e){alert(e.message);}}

function importMaterials(){currentImportType='materials';document.getElementById('import-modal-title').textContent='批量导入素材';document.getElementById('import-format-text').textContent='格式: [{"category":"名言警句","content":"内容","author":"作者","source":"来源","theme":"主题"}]';document.getElementById('import-data').value='';openImportModal();}

// 范文管理
async function loadEssays(){var genre=document.getElementById('essay-genre-filter')?document.getElementById('essay-genre-filter').value:'';var url=genre?API_BASE+'/api/db/essays?genre='+encodeURIComponent(genre):API_BASE+'/api/db/essays';try{var r=await fetch(url);var d=await r.json();if(d.success)renderEssays(d.essays);}catch(e){console.error(e);}}

function renderEssays(essays){var c=document.getElementById('essays-list');if(!c)return;if(!essays.length){c.innerHTML='<div class="alert alert-info">暂无数据</div>';return;}var h='<div style="display:grid;gap:1rem;">';essays.forEach(function(e){h+='<div class="history-item" style="flex-direction:column;align-items:flex-start;"><div style="display:flex;justify-content:space-between;width:100%;"><div><div class="history-title">'+e.title+'</div><div class="history-meta">'+(e.genre||'议论文')+(e.score?' | '+e.score+'分':'')+'</div></div><div style="display:flex;gap:8px;"><button class="btn btn-sm btn-secondary" onclick="viewEssay('+e.id+')">查看</button><button class="btn btn-sm btn-danger" onclick="deleteEssay('+e.id+')">删除</button></div></div><div style="margin-top:0.5rem;font-size:0.9rem;color:var(--text-secondary);">'+String(e.content).substring(0,80)+'...</div></div>';});h+='</div>';c.innerHTML=h;}

function showAddEssayModal(){document.getElementById('modal-title').textContent='添加范文';document.getElementById('modal-body').innerHTML='<div class="form-group"><label class="form-label">标题*</label><input type="text" class="form-input" id="essay-title"></div><div class="form-group"><label class="form-label">内容*</label><textarea class="form-textarea" id="essay-content" rows="10"></textarea></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="form-group"><label class="form-label">文体</label><select class="form-select" id="essay-genre"><option>议论文</option><option>记叙文</option><option>说明文</option><option>散文</option></select></div><div class="form-group"><label class="form-label">评分</label><input type="number" class="form-input" id="essay-score" placeholder="55"></div></div><div class="form-group"><label class="form-label">来源</label><input type="text" class="form-input" id="essay-source"></div><button class="btn btn-primary btn-block" onclick="saveEssay()">保存</button>';openModal();}

async function saveEssay(){var d={title:document.getElementById('essay-title').value,content:document.getElementById('essay-content').value,genre:document.getElementById('essay-genre').value,score:document.getElementById('essay-score').value?parseInt(document.getElementById('essay-score').value):null,source:document.getElementById('essay-source').value};if(!d.title||!d.content){alert('请输入标题和内容');return;}try{var r=await fetch(API_BASE+'/api/db/essays',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});var res=await r.json();if(res.success){alert('添加成功');closeModal();loadEssays();loadDbStats();}else alert('失败:'+res.error);}catch(e){alert(e.message);}}

async function viewEssay(id){try{var r=await fetch(API_BASE+'/api/db/essays/'+id);var d=await r.json();if(d.success){var e=d.essay;document.getElementById('modal-title').textContent=e.title;document.getElementById('modal-body').innerHTML='<div style="margin-bottom:1rem;"><span class="tag tag-primary">'+(e.genre||'议论文')+'</span>'+(e.score?' <span class="tag tag-success">'+e.score+'分</span>':'')+'</div><div style="max-height:400px;overflow-y:auto;padding:1rem;background:var(--bg-input);border-radius:8px;">'+String(e.content).replace(/\n/g,'<br>')+'</div>';openModal();}}catch(e){alert(e.message);}}

async function deleteEssay(id){if(!confirm('确定删除?'))return;try{var r=await fetch(API_BASE+'/api/db/essays/'+id,{method:'DELETE'});var d=await r.json();if(d.success){loadEssays();loadDbStats();}}catch(e){alert(e.message);}}

function importEssays(){currentImportType='essays';document.getElementById('import-modal-title').textContent='批量导入范文';document.getElementById('import-format-text').textContent='格式: [{"title":"标题","content":"内容","genre":"议论文","score":55}]';document.getElementById('import-data').value='';openImportModal();}

// 评分标准管理
async function loadStandards(){var cat=document.getElementById('standard-category-filter')?document.getElementById('standard-category-filter').value:'';var url=cat?API_BASE+'/api/db/standards?category='+encodeURIComponent(cat):API_BASE+'/api/db/standards';try{var r=await fetch(url);var d=await r.json();if(d.success)renderStandards(d.standards);}catch(e){console.error(e);}}

function renderStandards(standards){var c=document.getElementById('standards-list');if(!c)return;if(!standards.length){c.innerHTML='<div class="alert alert-info">暂无数据</div>';return;}var grouped={};standards.forEach(function(s){if(!grouped[s.category])grouped[s.category]=[];grouped[s.category].push(s);});var h='';Object.keys(grouped).forEach(function(cat){h+='<h4 style="margin:1rem 0;color:var(--primary-light);">'+cat+'</h4>';grouped[cat].forEach(function(s){h+='<div class="history-item" style="margin-bottom:0.5rem;"><div><strong>'+s.name+'</strong><span class="tag tag-primary" style="margin-left:8px;">'+(s.score_range||'')+'</span></div><div style="color:var(--text-secondary);font-size:0.9rem;">'+(s.description||'')+'</div></div>';});});c.innerHTML=h;}

function showAddStandardModal(){document.getElementById('modal-title').textContent='添加评分标准';document.getElementById('modal-body').innerHTML='<div class="form-group"><label class="form-label">名称*</label><input type="text" class="form-input" id="standard-name" placeholder="内容一等"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"><div class="form-group"><label class="form-label">类别</label><select class="form-select" id="standard-category"><option>内容</option><option>表达</option><option>发展等级</option></select></div><div class="form-group"><label class="form-label">分数范围</label><input type="text" class="form-input" id="standard-score-range" placeholder="20-16"></div></div><div class="form-group"><label class="form-label">描述</label><textarea class="form-textarea" id="standard-description" rows="2"></textarea></div><button class="btn btn-primary btn-block" onclick="saveStandard()">保存</button>';openModal();}

async function saveStandard(){var d={name:document.getElementById('standard-name').value,category:document.getElementById('standard-category').value,score_range:document.getElementById('standard-score-range').value,description:document.getElementById('standard-description').value};if(!d.name){alert('请输入名称');return;}try{var r=await fetch(API_BASE+'/api/db/standards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});var res=await r.json();if(res.success){alert('添加成功');closeModal();loadStandards();loadDbStats();}else alert('失败:'+res.error);}catch(e){alert(e.message);}}

// 通用功能
function openModal(){document.getElementById('modal-overlay').classList.add('active');}
function closeModal(){document.getElementById('modal-overlay').classList.remove('active');}
function openImportModal(){document.getElementById('import-modal-overlay').classList.add('active');}
function closeImportModal(){document.getElementById('import-modal-overlay').classList.remove('active');}

async function doImport(){var ds=document.getElementById('import-data').value;if(!ds){alert('请输入数据');return;}var d;try{d=JSON.parse(ds);if(!Array.isArray(d)){alert('必须是数组');return;}}catch(e){alert('JSON错误:'+e.message);return;}try{var r=await fetch(API_BASE+'/api/db/import/'+currentImportType,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:d})});var res=await r.json();if(res.success){alert(res.message);closeImportModal();loadDbStats();if(currentImportType==='topics')loadTopics();if(currentImportType==='materials')loadMaterials();if(currentImportType==='essays')loadEssays();}else alert('失败:'+res.error);}catch(e){alert(e.message);}}

async function exportData(table){try{var r=await fetch(API_BASE+'/api/db/export/'+table);var d=await r.json();if(d.success){var blob=new Blob([JSON.stringify(d.data,null,2)],{type:'application/json'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=table+'_export.json';a.click();URL.revokeObjectURL(url);}}catch(e){alert(e.message);}}

"""
==============================================================================
AI作文助手 - Flask后端主程序
==============================================================================

本文件是整个应用的后端入口，负责：
1. 处理HTTP请求和响应
2. 提供RESTful API接口
3. 调用AI服务和工作流引擎
4. 管理数据库操作

技术栈：Flask框架 + SQLite数据库

作者：ding-hao-ran
==============================================================================
"""

# 导入Flask相关模块
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS  # 处理跨域请求

# 导入自定义模块
from ai_service import AIServiceFactory, get_provider_list, PROVIDER_CONFIGS  # AI服务接口
from workflow import EssayWorkflow  # 工作流引擎
from database import db  # 数据库操作

import json
import os
from datetime import datetime

# ============================================
# 初始化Flask应用
# ============================================

app = Flask(__name__)  # 创建Flask应用实例
app.secret_key = os.urandom(24)  # 设置会话密钥，用于加密session数据
CORS(app)  # 启用跨域资源共享，允许前端访问API


# ============================================
# 辅助函数
# ============================================

def get_ai_service():
    """
    从用户的session中获取AI服务配置，并创建对应的AI服务实例

    返回值：
        - 成功：返回AI服务实例（如OpenAIService、ClaudeService等）
        - 失败：返回None（表示用户未配置AI服务）

    工作原理：
        1. 从session中读取用户的AI配置（provider, api_key, base_url, model）
        2. 如果没有配置，返回None
        3. 使用AIServiceFactory工厂类创建对应的AI服务实例
    """
    # 从session获取配置
    config = session.get('ai_config')

    # 如果没有配置，返回None
    if not config:
        return None

    try:
        # 使用工厂模式创建AI服务实例
        return AIServiceFactory.create_service(
            provider=config['provider'],      # 服务提供商（如openai, claude等）
            api_key=config['api_key'],        # API密钥
            base_url=config.get('base_url'),  # API地址（可选）
            model=config.get('model')         # 模型名称（可选）
        )
    except Exception as e:
        # 创建失败返回None
        return None


# ============================================
# 页面路由
# ============================================

@app.route('/')
def index():
    """
    首页路由 - 渲染主页面

    当用户访问 http://localhost:5000/ 时，返回index.html页面
    """
    return render_template('index.html')


# ============================================
# AI服务配置API
# ============================================

@app.route('/api/providers', methods=['GET'])
def get_providers():
    """
    获取支持的AI服务提供商列表

    请求方式：GET
    返回值：JSON格式的服务商列表，包含名称、支持的模型等信息

    示例返回：
    {
        "success": true,
        "providers": [
            {"id": "openai", "name": "OpenAI", "models": ["gpt-4", "gpt-3.5-turbo"]},
            {"id": "claude", "name": "Claude", "models": ["claude-3-sonnet"]},
            ...
        ]
    }
    """
    providers = get_provider_list()
    return jsonify({"success": True, "providers": providers})


@app.route('/api/config', methods=['POST'])
def save_config():
    """
    保存用户的AI服务配置

    请求方式：POST
    请求体（JSON）：
        {
            "provider": "openai",      # 服务商名称
            "api_key": "sk-xxx",       # API密钥
            "base_url": "https://...", # 自定义API地址（可选）
            "model": "gpt-3.5-turbo"   # 模型名称
        }

    返回值：
        成功：{"success": true, "message": "配置保存成功"}
        失败：{"success": false, "error": "错误信息"}
    """
    # 获取请求中的JSON数据
    data = request.json

    # 提取配置参数
    provider = data.get('provider')
    api_key = data.get('api_key')
    base_url = data.get('base_url')
    model = data.get('model')

    # 验证必填参数
    if not provider or not api_key:
        return jsonify({"success": False, "error": "请提供服务商和API Key"})

    try:
        # 尝试创建AI服务实例，验证配置是否有效
        service = AIServiceFactory.create_service(
            provider=provider,
            api_key=api_key,
            base_url=base_url,
            model=model
        )

        # 将配置保存到session中
        session['ai_config'] = {
            'provider': provider,
            'api_key': api_key,
            'base_url': base_url,
            'model': model
        }

        return jsonify({"success": True, "message": "配置保存成功"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/config/test', methods=['POST'])
def test_config():
    """
    测试AI服务连接是否正常

    请求方式：POST
    请求体：同save_config

    返回值：
        成功：{"success": true, "message": "连接测试成功", "response": "AI的回复"}
        失败：{"success": false, "error": "连接测试失败: 错误信息"}
    """
    data = request.json

    provider = data.get('provider')
    api_key = data.get('api_key')
    base_url = data.get('base_url')
    model = data.get('model')

    if not provider or not api_key:
        return jsonify({"success": False, "error": "请提供服务商和API Key"})

    try:
        # 创建AI服务实例
        service = AIServiceFactory.create_service(
            provider=provider,
            api_key=api_key,
            base_url=base_url,
            model=model
        )

        # 发送测试消息
        test_messages = [
            {"role": "user", "content": "你好，请回复'连接成功'"}
        ]

        # 调用AI服务，获取回复
        result = service.chat(test_messages, max_tokens=50)

        return jsonify({"success": True, "message": "连接测试成功", "response": result})

    except Exception as e:
        return jsonify({"success": False, "error": f"连接测试失败: {str(e)}"})


# ============================================
# AI写作功能API
# ============================================

@app.route('/api/guide', methods=['POST'])
def writing_guide():
    """
    作文创作指导API

    功能：根据用户输入的作文题目，生成写作指导（思路、素材、提纲等）

    请求方式：POST
    请求体：
        {
            "topic": "谈坚持",    # 作文题目
            "genre": "议论文"     # 文体类型
        }

    返回值：
        成功：{"success": true, "topic": "...", "genre": "...", "guide": "AI生成的指导内容"}
        失败：{"success": false, "error": "错误信息"}
    """
    # 获取AI服务实例
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    # 获取请求参数
    data = request.json
    topic = data.get('topic', '')
    genre = data.get('genre', '议论文')

    # 验证参数
    if not topic:
        return jsonify({"success": False, "error": "请输入作文题目"})

    # 从数据库搜索相关素材，辅助AI生成更好的指导
    related_materials = db.search_materials(topic, limit=5)

    # 创建工作流引擎实例并执行创作指导工作流
    workflow = EssayWorkflow(service)
    result = workflow.writing_guide_workflow(topic, genre, related_materials)

    return jsonify(result)


@app.route('/api/analyze', methods=['POST'])
def analyze_essay():
    """
    作文分析API

    功能：对用户提交的作文进行多维度分析（结构、语言、内容、修辞等）

    请求方式：POST
    请求体：
        {
            "title": "我的作文",           # 作文标题
            "content": "作文正文内容..."   # 作文内容
        }

    返回值：
        成功：{"success": true, "title": "...", "word_count": 800, "analysis": "分析结果"}
        失败：{"success": false, "error": "错误信息"}
    """
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')

    if not title or not content:
        return jsonify({"success": False, "error": "请输入作文题目和内容"})

    # 从数据库获取评分标准，用于指导AI分析
    standards = db.get_grading_standards()

    # 执行作文分析工作流
    workflow = EssayWorkflow(service)
    result = workflow.essay_analysis_workflow(title, content, standards)

    return jsonify(result)


@app.route('/api/suggest', methods=['POST'])
def revision_suggestions():
    """
    修改建议API

    功能：根据作文内容和之前的分析结果，生成具体的修改建议

    请求方式：POST
    请求体：
        {
            "title": "我的作文",
            "content": "作文正文内容...",
            "analysis": "之前的分析结果（可选）"
        }

    返回值：
        成功：{"success": true, "title": "...", "suggestions": "修改建议内容"}
    """
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')
    analysis = data.get('analysis', '')  # 之前的分析结果，用于生成更有针对性的建议

    if not title or not content:
        return jsonify({"success": False, "error": "请输入作文题目和内容"})

    workflow = EssayWorkflow(service)
    result = workflow.revision_suggestion_workflow(title, content, analysis)

    return jsonify(result)


@app.route('/api/score', methods=['POST'])
def score_essay():
    """
    智能评分API

    功能：按照高考评分标准对作文进行评分

    请求方式：POST
    请求体：
        {
            "title": "我的作文",
            "content": "作文正文内容...",
            "total_score": 60    # 满分分数（默认60分）
        }

    返回值：
        成功：{"success": true, "title": "...", "total_score": 60, "scoring_result": "评分结果"}
    """
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')
    total_score = data.get('total_score', 60)  # 默认满分60分

    if not title or not content:
        return jsonify({"success": False, "error": "请输入作文题目和内容"})

    # 获取数据库中的评分标准
    standards = db.get_grading_standards()

    # 执行评分工作流
    workflow = EssayWorkflow(service)
    result = workflow.scoring_workflow(title, content, total_score, standards)

    return jsonify(result)


@app.route('/api/comprehensive', methods=['POST'])
def comprehensive_evaluation():
    """
    综合评价API

    功能：一次性完成作文分析、评分、修改建议（最全面的评价）

    请求方式：POST
    请求体：
        {
            "title": "我的作文",
            "content": "作文正文内容...",
            "genre": "议论文"
        }

    返回值：
        成功：{"success": true, "title": "...", "comprehensive_result": "综合评价结果"}
    """
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')
    genre = data.get('genre', '议论文')

    if not title or not content:
        return jsonify({"success": False, "error": "请输入作文题目和内容"})

    # 获取评分标准和优秀范文（用于参考）
    standards = db.get_grading_standards()
    sample_essays = db.get_essays(genre=genre, min_score=50, limit=3)

    # 执行综合评价工作流
    workflow = EssayWorkflow(service)
    result = workflow.comprehensive_workflow(title, content, genre, standards, sample_essays)

    return jsonify(result)


@app.route('/api/materials', methods=['POST'])
def recommend_materials():
    """
    素材推荐API

    功能：根据作文主题推荐相关素材（名言、典故、事例等）

    请求方式：POST
    请求体：
        {
            "topic": "坚持",                # 作文主题
            "angle": "从个人成长角度"        # 写作角度（可选）
        }

    返回值：
        成功：{"success": true, "topic": "...", "materials": "推荐素材内容"}
    """
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    topic = data.get('topic', '')
    angle = data.get('angle', '')

    if not topic:
        return jsonify({"success": False, "error": "请输入作文主题"})

    # 从数据库搜索相关素材
    db_materials = db.search_materials(topic, limit=10)

    # 执行素材推荐工作流
    workflow = EssayWorkflow(service)
    result = workflow.material_recommendation_workflow(topic, angle, db_materials)

    return jsonify(result)


@app.route('/api/write', methods=['POST'])
def ai_write_essay():
    """
    AI写作成文API

    功能：根据题目和要求，AI直接生成一篇完整的作文

    请求方式：POST
    请求体：
        {
            "topic": "谈坚持",           # 作文题目
            "genre": "议论文",           # 文体类型
            "level": "45",              # 目标分数
            "wordcount": "800",         # 字数要求
            "requirements": "..."       # 补充要求（可选）
        }

    返回值：
        成功：{"success": true, "essay": "生成的作文内容"}
    """
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    topic = data.get('topic', '')
    genre = data.get('genre', '议论文')
    level = data.get('level', '45')
    wordcount = data.get('wordcount', '800')
    requirements = data.get('requirements', '')

    if not topic:
        return jsonify({"success": False, "error": "请输入作文题目"})

    # 从数据库获取相关素材
    db_materials = db.search_materials(topic, limit=5)

    # 执行AI写作工作流
    workflow = EssayWorkflow(service)
    result = workflow.ai_write_essay_workflow(topic, genre, level, wordcount, requirements, db_materials)
    return jsonify(result)


@app.route('/api/gaokao/practice', methods=['POST'])
def gaokao_practice():
    """
    高考真题练习API

    功能：随机或按年份选择高考真题，提供详细的写作指导

    请求方式：POST
    请求体：
        {
            "year": 2024    # 年份（可选，不填则随机）
        }

    返回值：
        成功：{"success": true, "topic_info": {...}, "guide": "真题讲解内容"}
    """
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    year = data.get('year')

    # 从数据库获取真题
    if year:
        db_topics = db.get_topics(year=int(year))
    else:
        db_topics = db.get_topics(limit=10)

    # 执行高考真题练习工作流
    workflow = EssayWorkflow(service)
    result = workflow.gaokao_topic_practice_workflow(year, db_topics)

    return jsonify(result)


@app.route('/api/gaokao/topics', methods=['GET'])
def get_gaokao_topics():
    """
    获取高考真题列表API

    功能：返回所有高考真题的简要信息（用于前端展示真题列表）

    请求方式：GET
    返回值：{"success": true, "topics": [{"year": 2024, "paper": "新课标I卷", "topic": "...", "themes": [...]}]}
    """
    from gaokao_data import GAOKAO_TOPICS

    topics_list = []
    for year, papers in GAOKAO_TOPICS.items():
        for paper_name, paper_info in papers.items():
            topics_list.append({
                "year": year,
                "paper": paper_name,
                "topic": paper_info["topic"],
                "themes": paper_info.get("themes", [])
            })

    return jsonify({"success": True, "topics": topics_list})


# ============================================
# 数据库管理API - 作文题目
# ============================================

@app.route('/api/db/topics', methods=['GET'])
def db_get_topics():
    """
    获取数据库中的作文题目列表

    请求方式：GET
    查询参数：
        - genre: 文体类型（可选，如"议论文"）
        - year: 年份（可选，如2024）

    返回值：{"success": true, "topics": [...]}
    """
    genre = request.args.get('genre')
    year = request.args.get('year', type=int)
    topics = db.get_topics(genre=genre, year=year)
    return jsonify({"success": True, "topics": topics})


@app.route('/api/db/topics', methods=['POST'])
def db_add_topic():
    """
    添加作文题目到数据库

    请求方式：POST
    请求体：
        {
            "title": "题目名称",
            "material": "作文材料",
            "genre": "议论文",
            "year": 2024,
            "paper": "全国甲卷",
            "keywords": ["关键词1", "关键词2"],
            "themes": ["主题1", "主题2"]
        }
    """
    data = request.json
    try:
        topic_id = db.add_topic(data)
        return jsonify({"success": True, "id": topic_id, "message": "添加成功"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/db/topics/<int:topic_id>', methods=['GET'])
def db_get_topic(topic_id):
    """获取单个作文题目的详细信息"""
    topic = db.get_topic_by_id(topic_id)
    if topic:
        return jsonify({"success": True, "topic": topic})
    return jsonify({"success": False, "error": "题目不存在"})


@app.route('/api/db/topics/<int:topic_id>', methods=['PUT'])
def db_update_topic(topic_id):
    """更新作文题目"""
    data = request.json
    if db.update_topic(topic_id, data):
        return jsonify({"success": True, "message": "更新成功"})
    return jsonify({"success": False, "error": "更新失败"})


@app.route('/api/db/topics/<int:topic_id>', methods=['DELETE'])
def db_delete_topic(topic_id):
    """删除作文题目"""
    if db.delete_topic(topic_id):
        return jsonify({"success": True, "message": "删除成功"})
    return jsonify({"success": False, "error": "删除失败"})


@app.route('/api/db/topics/import', methods=['POST'])
def db_import_topics():
    """
    批量导入作文题目

    请求体：{"topics": [{...}, {...}, ...]}
    """
    data = request.json
    topics = data.get('topics', [])
    count = db.import_topics(topics)
    return jsonify({"success": True, "count": count, "message": f"成功导入{count}条题目"})


# ============================================
# 数据库管理API - 作文素材
# ============================================

@app.route('/api/db/materials', methods=['GET'])
def db_get_materials():
    """获取素材列表，支持按分类和主题筛选"""
    category = request.args.get('category')
    theme = request.args.get('theme')
    materials = db.get_materials(category=category, theme=theme)
    return jsonify({"success": True, "materials": materials})


@app.route('/api/db/materials', methods=['POST'])
def db_add_material():
    """添加新素材"""
    data = request.json
    try:
        material_id = db.add_material(data)
        return jsonify({"success": True, "id": material_id, "message": "添加成功"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/db/materials/<int:material_id>', methods=['PUT'])
def db_update_material(material_id):
    """更新素材"""
    data = request.json
    if db.update_material(material_id, data):
        return jsonify({"success": True, "message": "更新成功"})
    return jsonify({"success": False, "error": "更新失败"})


@app.route('/api/db/materials/<int:material_id>', methods=['DELETE'])
def db_delete_material(material_id):
    """删除素材"""
    if db.delete_material(material_id):
        return jsonify({"success": True, "message": "删除成功"})
    return jsonify({"success": False, "error": "删除失败"})


@app.route('/api/db/materials/search', methods=['GET'])
def db_search_materials():
    """
    搜索素材

    查询参数：keyword - 搜索关键词
    """
    keyword = request.args.get('keyword', '')
    materials = db.search_materials(keyword)
    return jsonify({"success": True, "materials": materials})


@app.route('/api/db/materials/import', methods=['POST'])
def db_import_materials():
    """批量导入素材"""
    data = request.json
    materials = data.get('materials', [])
    count = db.import_materials(materials)
    return jsonify({"success": True, "count": count, "message": f"成功导入{count}条素材"})


@app.route('/api/db/materials/categories', methods=['GET'])
def db_get_material_categories():
    """获取所有素材分类"""
    categories = db.get_material_categories()
    return jsonify({"success": True, "categories": categories})


# ============================================
# 数据库管理API - 作文范文
# ============================================

@app.route('/api/db/essays', methods=['GET'])
def db_get_essays():
    """获取范文列表，支持按文体和最低分数筛选"""
    genre = request.args.get('genre')
    min_score = request.args.get('min_score', type=int)
    essays = db.get_essays(genre=genre, min_score=min_score)
    return jsonify({"success": True, "essays": essays})


@app.route('/api/db/essays', methods=['POST'])
def db_add_essay():
    """添加范文"""
    data = request.json
    try:
        essay_id = db.add_essay(data)
        return jsonify({"success": True, "id": essay_id, "message": "添加成功"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/db/essays/<int:essay_id>', methods=['GET'])
def db_get_essay(essay_id):
    """获取单篇范文的详细内容"""
    essay = db.get_essay_by_id(essay_id)
    if essay:
        return jsonify({"success": True, "essay": essay})
    return jsonify({"success": False, "error": "范文不存在"})


@app.route('/api/db/essays/<int:essay_id>', methods=['PUT'])
def db_update_essay(essay_id):
    """更新范文"""
    data = request.json
    if db.update_essay(essay_id, data):
        return jsonify({"success": True, "message": "更新成功"})
    return jsonify({"success": False, "error": "更新失败"})


@app.route('/api/db/essays/<int:essay_id>', methods=['DELETE'])
def db_delete_essay(essay_id):
    """删除范文"""
    if db.delete_essay(essay_id):
        return jsonify({"success": True, "message": "删除成功"})
    return jsonify({"success": False, "error": "删除失败"})


@app.route('/api/db/essays/import', methods=['POST'])
def db_import_essays():
    """批量导入范文"""
    data = request.json
    essays = data.get('essays', [])
    count = db.import_essays(essays)
    return jsonify({"success": True, "count": count, "message": f"成功导入{count}篇范文"})


# ============================================
# 数据库管理API - 评分标准
# ============================================

@app.route('/api/db/standards', methods=['GET'])
def db_get_standards():
    """获取评分标准列表"""
    category = request.args.get('category')
    standards = db.get_grading_standards(category=category)
    return jsonify({"success": True, "standards": standards})


@app.route('/api/db/standards', methods=['POST'])
def db_add_standard():
    """添加评分标准"""
    data = request.json
    try:
        standard_id = db.add_grading_standard(data)
        return jsonify({"success": True, "id": standard_id, "message": "添加成功"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/db/standards/<int:standard_id>', methods=['PUT'])
def db_update_standard(standard_id):
    """更新评分标准"""
    data = request.json
    if db.update_grading_standard(standard_id, data):
        return jsonify({"success": True, "message": "更新成功"})
    return jsonify({"success": False, "error": "更新失败"})


@app.route('/api/db/standards/<int:standard_id>', methods=['DELETE'])
def db_delete_standard(standard_id):
    """删除评分标准"""
    if db.delete_grading_standard(standard_id):
        return jsonify({"success": True, "message": "删除成功"})
    return jsonify({"success": False, "error": "删除失败"})


# ============================================
# 数据库管理API - 用户作文记录
# ============================================

@app.route('/api/db/user-essays', methods=['GET'])
def db_get_user_essays():
    """获取用户提交过的作文记录"""
    essays = db.get_user_essays()
    return jsonify({"success": True, "essays": essays})


@app.route('/api/db/user-essays', methods=['POST'])
def db_save_user_essay():
    """保存用户的作文"""
    data = request.json
    try:
        essay_id = db.save_user_essay(data)
        return jsonify({"success": True, "id": essay_id, "message": "保存成功"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/db/user-essays/<int:essay_id>', methods=['DELETE'])
def db_delete_user_essay(essay_id):
    """删除用户的作文记录"""
    if db.delete_user_essay(essay_id):
        return jsonify({"success": True, "message": "删除成功"})
    return jsonify({"success": False, "error": "删除失败"})


# ============================================
# 数据库统计和导出API
# ============================================

@app.route('/api/db/stats', methods=['GET'])
def db_get_stats():
    """
    获取数据库统计信息

    返回值：{"success": true, "stats": {"topics": 18, "materials": 36, "essays": 8, "standards": 12}}
    """
    stats = db.get_stats()
    return jsonify({"success": True, "stats": stats})


@app.route('/api/db/themes', methods=['GET'])
def db_get_themes():
    """获取所有主题标签列表"""
    themes = db.get_themes()
    return jsonify({"success": True, "themes": themes})


@app.route('/api/db/export/<table>', methods=['GET'])
def db_export(table):
    """
    导出指定表的数据为JSON格式

    参数：table - 表名（topics/materials/essays/grading_standards）
    """
    try:
        data = db.export_data(table)
        return jsonify({"success": True, "data": data, "count": len(data)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/db/import/<table>', methods=['POST'])
def db_import(table):
    """
    通用数据导入接口

    参数：table - 目标表名
    请求体：{"data": [{...}, {...}, ...]}
    """
    data = request.json
    items = data.get('data', [])
    try:
        count = db.import_data(table, items)
        return jsonify({"success": True, "count": count, "message": f"成功导入{count}条数据"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


# ============================================
# 启动应用
# ============================================

if __name__ == '__main__':
    """
    启动Flask应用

    参数说明：
        debug=True     - 开启调试模式（代码修改后自动重启，显示详细错误信息）
        host='0.0.0.0' - 监听所有网络接口（允许局域网访问）
        port=5000      - 监听端口号

    访问地址：
        本地访问：http://localhost:5000
        局域网访问：http://你的IP:5000
    """
    app.run(debug=True, host='0.0.0.0', port=5000)

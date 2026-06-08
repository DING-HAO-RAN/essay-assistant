"""
作文助手 Flask 后端主程序
"""

from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from ai_service import AIServiceFactory, get_provider_list, PROVIDER_CONFIGS
from workflow import EssayWorkflow
from database import db
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)


def get_ai_service():
    """从session获取AI服务配置"""
    config = session.get('ai_config')
    if not config:
        return None

    try:
        return AIServiceFactory.create_service(
            provider=config['provider'],
            api_key=config['api_key'],
            base_url=config.get('base_url'),
            model=config.get('model')
        )
    except Exception as e:
        return None


@app.route('/')
def index():
    """首页"""
    return render_template('index.html')


# ============================================
# AI服务配置API
# ============================================

@app.route('/api/providers', methods=['GET'])
def get_providers():
    """获取支持的AI服务提供商列表"""
    providers = get_provider_list()
    return jsonify({"success": True, "providers": providers})


@app.route('/api/config', methods=['POST'])
def save_config():
    """保存AI服务配置"""
    data = request.json

    provider = data.get('provider')
    api_key = data.get('api_key')
    base_url = data.get('base_url')
    model = data.get('model')

    if not provider or not api_key:
        return jsonify({"success": False, "error": "请提供服务商和API Key"})

    try:
        service = AIServiceFactory.create_service(
            provider=provider,
            api_key=api_key,
            base_url=base_url,
            model=model
        )
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
    """测试AI服务配置"""
    data = request.json

    provider = data.get('provider')
    api_key = data.get('api_key')
    base_url = data.get('base_url')
    model = data.get('model')

    if not provider or not api_key:
        return jsonify({"success": False, "error": "请提供服务商和API Key"})

    try:
        service = AIServiceFactory.create_service(
            provider=provider,
            api_key=api_key,
            base_url=base_url,
            model=model
        )
        test_messages = [
            {"role": "user", "content": "你好，请回复'连接成功'"}
        ]
        result = service.chat(test_messages, max_tokens=50)
        return jsonify({"success": True, "message": "连接测试成功", "response": result})
    except Exception as e:
        return jsonify({"success": False, "error": f"连接测试失败: {str(e)}"})


# ============================================
# AI写作功能API
# ============================================

@app.route('/api/guide', methods=['POST'])
def writing_guide():
    """作文创作指导"""
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    topic = data.get('topic', '')
    genre = data.get('genre', '议论文')

    if not topic:
        return jsonify({"success": False, "error": "请输入作文题目"})

    # 从数据库获取相关素材
    related_materials = db.search_materials(topic, limit=5)

    workflow = EssayWorkflow(service)
    result = workflow.writing_guide_workflow(topic, genre, related_materials)
    return jsonify(result)


@app.route('/api/analyze', methods=['POST'])
def analyze_essay():
    """作文分析"""
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')

    if not title or not content:
        return jsonify({"success": False, "error": "请输入作文题目和内容"})

    # 从数据库获取评分标准
    standards = db.get_grading_standards()

    workflow = EssayWorkflow(service)
    result = workflow.essay_analysis_workflow(title, content, standards)
    return jsonify(result)


@app.route('/api/suggest', methods=['POST'])
def revision_suggestions():
    """修改建议"""
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')
    analysis = data.get('analysis', '')

    if not title or not content:
        return jsonify({"success": False, "error": "请输入作文题目和内容"})

    workflow = EssayWorkflow(service)
    result = workflow.revision_suggestion_workflow(title, content, analysis)
    return jsonify(result)


@app.route('/api/score', methods=['POST'])
def score_essay():
    """作文评分"""
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')
    total_score = data.get('total_score', 60)

    if not title or not content:
        return jsonify({"success": False, "error": "请输入作文题目和内容"})

    # 从数据库获取评分标准
    standards = db.get_grading_standards()

    workflow = EssayWorkflow(service)
    result = workflow.scoring_workflow(title, content, total_score, standards)
    return jsonify(result)


@app.route('/api/comprehensive', methods=['POST'])
def comprehensive_evaluation():
    """综合评价"""
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')
    genre = data.get('genre', '议论文')

    if not title or not content:
        return jsonify({"success": False, "error": "请输入作文题目和内容"})

    # 从数据库获取评分标准和范文
    standards = db.get_grading_standards()
    sample_essays = db.get_essays(genre=genre, min_score=50, limit=3)

    workflow = EssayWorkflow(service)
    result = workflow.comprehensive_workflow(title, content, genre, standards, sample_essays)
    return jsonify(result)


@app.route('/api/materials', methods=['POST'])
def recommend_materials():
    """素材推荐"""
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    topic = data.get('topic', '')
    angle = data.get('angle', '')

    if not topic:
        return jsonify({"success": False, "error": "请输入作文主题"})

    # 从数据库获取相关素材
    db_materials = db.search_materials(topic, limit=10)

    workflow = EssayWorkflow(service)
    result = workflow.material_recommendation_workflow(topic, angle, db_materials)
    return jsonify(result)


@app.route('/api/gaokao/practice', methods=['POST'])
def gaokao_practice():
    """高考真题练习"""
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

    workflow = EssayWorkflow(service)
    result = workflow.gaokao_topic_practice_workflow(year, db_topics)
    return jsonify(result)


@app.route('/api/gaokao/topics', methods=['GET'])
def get_gaokao_topics():
    """获取高考真题列表"""
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
    """获取数据库中的作文题目"""
    genre = request.args.get('genre')
    year = request.args.get('year', type=int)
    topics = db.get_topics(genre=genre, year=year)
    return jsonify({"success": True, "topics": topics})


@app.route('/api/db/topics', methods=['POST'])
def db_add_topic():
    """添加作文题目"""
    data = request.json
    try:
        topic_id = db.add_topic(data)
        return jsonify({"success": True, "id": topic_id, "message": "添加成功"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/db/topics/<int:topic_id>', methods=['GET'])
def db_get_topic(topic_id):
    """获取单个作文题目"""
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
    """批量导入作文题目"""
    data = request.json
    topics = data.get('topics', [])
    count = db.import_topics(topics)
    return jsonify({"success": True, "count": count, "message": f"成功导入{count}条题目"})


# ============================================
# 数据库管理API - 作文素材
# ============================================

@app.route('/api/db/materials', methods=['GET'])
def db_get_materials():
    """获取数据库中的素材"""
    category = request.args.get('category')
    theme = request.args.get('theme')
    materials = db.get_materials(category=category, theme=theme)
    return jsonify({"success": True, "materials": materials})


@app.route('/api/db/materials', methods=['POST'])
def db_add_material():
    """添加素材"""
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
    """搜索素材"""
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
    """获取素材分类"""
    categories = db.get_material_categories()
    return jsonify({"success": True, "categories": categories})


# ============================================
# 数据库管理API - 作文范文
# ============================================

@app.route('/api/db/essays', methods=['GET'])
def db_get_essays():
    """获取数据库中的范文"""
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
    """获取单个范文"""
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
    """获取评分标准"""
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
# 数据库管理API - 用户作文
# ============================================

@app.route('/api/db/user-essays', methods=['GET'])
def db_get_user_essays():
    """获取用户作文记录"""
    essays = db.get_user_essays()
    return jsonify({"success": True, "essays": essays})


@app.route('/api/db/user-essays', methods=['POST'])
def db_save_user_essay():
    """保存用户作文"""
    data = request.json
    try:
        essay_id = db.save_user_essay(data)
        return jsonify({"success": True, "id": essay_id, "message": "保存成功"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/db/user-essays/<int:essay_id>', methods=['DELETE'])
def db_delete_user_essay(essay_id):
    """删除用户作文"""
    if db.delete_user_essay(essay_id):
        return jsonify({"success": True, "message": "删除成功"})
    return jsonify({"success": False, "error": "删除失败"})


# ============================================
# 数据库统计和导出API
# ============================================

@app.route('/api/db/stats', methods=['GET'])
def db_get_stats():
    """获取数据库统计信息"""
    stats = db.get_stats()
    return jsonify({"success": True, "stats": stats})


@app.route('/api/db/themes', methods=['GET'])
def db_get_themes():
    """获取主题列表"""
    themes = db.get_themes()
    return jsonify({"success": True, "themes": themes})


@app.route('/api/db/export/<table>', methods=['GET'])
def db_export(table):
    """导出表数据"""
    try:
        data = db.export_data(table)
        return jsonify({"success": True, "data": data, "count": len(data)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/db/import/<table>', methods=['POST'])
def db_import(table):
    """导入表数据"""
    data = request.json
    items = data.get('data', [])
    try:
        count = db.import_data(table, items)
        return jsonify({"success": True, "count": count, "message": f"成功导入{count}条数据"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

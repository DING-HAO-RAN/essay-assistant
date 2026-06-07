"""
作文助手 Flask 后端主程序
"""

from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from ai_service import AIServiceFactory, get_provider_list, PROVIDER_CONFIGS
from workflow import EssayWorkflow
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

# 数据存储（简化版，实际项目可使用数据库）
essays_db = []


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

    # 验证配置
    try:
        service = AIServiceFactory.create_service(
            provider=provider,
            api_key=api_key,
            base_url=base_url,
            model=model
        )
        # 保存到session
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
        # 发送测试请求
        test_messages = [
            {"role": "user", "content": "你好，请回复'连接成功'"}
        ]
        result = service.chat(test_messages, max_tokens=50)
        return jsonify({"success": True, "message": "连接测试成功", "response": result})
    except Exception as e:
        return jsonify({"success": False, "error": f"连接测试失败: {str(e)}"})


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

    workflow = EssayWorkflow(service)
    result = workflow.writing_guide_workflow(topic, genre)
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

    workflow = EssayWorkflow(service)
    result = workflow.essay_analysis_workflow(title, content)
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

    workflow = EssayWorkflow(service)
    result = workflow.scoring_workflow(title, content, total_score)
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

    workflow = EssayWorkflow(service)
    result = workflow.comprehensive_workflow(title, content, genre)
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

    workflow = EssayWorkflow(service)
    result = workflow.material_recommendation_workflow(topic, angle)
    return jsonify(result)


@app.route('/api/gaokao/practice', methods=['POST'])
def gaokao_practice():
    """高考真题练习"""
    service = get_ai_service()
    if not service:
        return jsonify({"success": False, "error": "请先配置AI服务"})

    data = request.json
    year = data.get('year')

    workflow = EssayWorkflow(service)
    result = workflow.gaokao_topic_practice_workflow(year)
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


@app.route('/api/essays', methods=['GET'])
def get_essays():
    """获取历史作文记录"""
    return jsonify({"success": True, "essays": essays_db})


@app.route('/api/essays', methods=['POST'])
def save_essay():
    """保存作文记录"""
    data = request.json

    essay = {
        "id": len(essays_db) + 1,
        "title": data.get('title', ''),
        "content": data.get('content', ''),
        "genre": data.get('genre', '议论文'),
        "created_at": datetime.now().isoformat(),
        "analysis": data.get('analysis'),
        "score": data.get('score')
    }

    essays_db.append(essay)
    return jsonify({"success": True, "essay": essay})


@app.route('/api/essays/<int:essay_id>', methods=['DELETE'])
def delete_essay(essay_id):
    """删除作文记录"""
    global essays_db
    essays_db = [e for e in essays_db if e['id'] != essay_id]
    return jsonify({"success": True, "message": "删除成功"})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

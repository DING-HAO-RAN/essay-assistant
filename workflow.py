"""
==============================================================================
作文助手工作流引擎
==============================================================================

本模块是系统的核心业务逻辑层，负责：
1. 定义各种作文相关的工作流（创作指导、分析、评分等）
2. 构建专业的AI提示词（Prompt）
3. 整合数据库素材和评分标准
4. 调用AI服务并返回结果

工作流设计原则：
- 每个工作流都是一个独立的方法
- 提示词基于高考评分标准和满分作文结构优化
- 支持从数据库获取素材和评分标准
- 返回统一格式的结果（success + data/error）

作者：AI大赛参赛项目
==============================================================================
"""

from typing import Dict, Any, List, Optional  # 类型注解
from ai_service import BaseAIService  # AI服务基类
from gaokao_data import (  # 高考数据
    GAOKAO_TOPICS,           # 高考真题
    GRADING_STANDARDS,       # 评分标准
    EXCELLENT_ESSAY_TEMPLATES,  # 满分作文模板
    THEME_MATERIALS,         # 主题素材
    get_random_topic,        # 随机获取真题
    get_topics_by_theme,     # 按主题获取真题
    get_materials_by_theme,  # 按主题获取素材
    format_grading_standards # 格式化评分标准
)
import json
import re


class EssayWorkflow:
    """
    作文助手工作流引擎类

    包含以下工作流：
    1. writing_guide_workflow - 创作指导工作流
    2. essay_analysis_workflow - 作文分析工作流
    3. revision_suggestion_workflow - 修改建议工作流
    4. scoring_workflow - 智能评分工作流
    5. comprehensive_workflow - 综合评价工作流
    6. material_recommendation_workflow - 素材推荐工作流
    7. gaokao_topic_practice_workflow - 高考真题练习工作流

    每个工作流都遵循相同的模式：
    1. 构建系统提示词（定义AI的角色和行为）
    2. 构建用户提示词（包含具体任务和要求）
    3. 调用AI服务获取回复
    4. 返回统一格式的结果
    """

    def __init__(self, ai_service: BaseAIService):
        """
        初始化工作流引擎

        参数：
            ai_service: AI服务实例（如OpenAIService、ClaudeService等）
        """
        self.ai = ai_service

    # ============================================
    # 工作流1：创作指导
    # ============================================

    def writing_guide_workflow(self, topic: str, genre: str = "议论文",
                               db_materials: List[Dict] = None) -> Dict[str, Any]:
        """
        作文创作指导工作流

        功能：根据作文题目，生成详细的写作指导
        包括：审题指导、写作思路、结构提纲、素材推荐、高分技巧等

        参数：
            topic: 作文题目（如"谈坚持"）
            genre: 文体类型（默认"议论文"）
            db_materials: 从数据库获取的相关素材（可选）

        返回值：
            成功：{"success": True, "topic": "...", "genre": "...", "guide": "指导内容"}
            失败：{"success": False, "error": "错误信息"}

        工作原理：
            1. 获取相关主题的高考真题和素材作为参考
            2. 构建专业的提示词，包含满分作文结构模板
            3. 调用AI生成写作指导
        """
        # 获取相关主题的高考真题和素材
        related_topics = get_topics_by_theme(topic[:2])
        theme_materials = get_materials_by_theme(topic[:2])

        # 获取满分作文结构模板
        template = EXCELLENT_ESSAY_TEMPLATES.get(genre, EXCELLENT_ESSAY_TEMPLATES["议论文"])

        # 系统提示词：定义AI的角色和行为
        system_prompt = """你是一位资深的高中语文教师，拥有20年作文教学经验，曾多次参加高考阅卷。
你需要为学生提供专业、实用的作文写作指导。
指导要基于高考评分标准，帮助学生写出高分作文。
请用清晰的结构、具体的例子来帮助学生理解。"""

        # 构建素材参考（从内置素材库）
        materials_ref = ""
        if theme_materials:
            materials_ref = f"""
【相关主题素材参考】
名言警句：
{chr(10).join('- ' + m for m in theme_materials.get('名言', [])[:3])}

经典事例：
{chr(10).join('- ' + s for s in theme_materials.get('事例', [])[:3])}
"""

        # 添加数据库素材
        if db_materials:
            materials_ref += "\n【数据库素材参考】\n"
            for m in db_materials[:5]:
                materials_ref += f"- {m.get('content', '')}（{m.get('source', '未知来源')}）\n"

        # 用户提示词：包含具体任务和要求
        user_prompt = f"""请为高中{genre}《{topic}》提供详细的写作指导。

【满分作文结构参考】（{genre}）
结构：{template['结构']}
{chr(10).join(f'- {k}：{v}' for k, v in template['详细'].items())}

{materials_ref}

请提供以下写作指导：

## 1. 题目解读与审题指导
- 题目的关键词分析
- 题目的深层含义和立意方向
- 常见的审题误区（避免偏题）
- 高分立意角度（至少3个）

## 2. 写作思路（提供3种不同角度）
### 思路一：常规稳妥型（保底45分以上）
- 具体思路和论证方向

### 思路二：深度思考型（冲击50分以上）
- 更深层次的思考角度

### 思路三：创新独特型（冲击满分）
- 独特新颖的切入点

## 3. 作文结构提纲
- 开头（100-150字）：具体的开头写法和示例
- 主体段落1（200-300字）：论点+论据+分析
- 主体段落2（200-300字）：论点+论据+分析
- 主体段落3（200-300字）：论点+论据+分析
- 结尾（100-150字）：总结升华方式

## 4. 推荐素材
- 名言警句（至少3条，注明出处和适用场景）
- 历史典故或时事素材（至少2个，说明如何使用）
- 人物事迹素材（至少2个，说明论证角度）

## 5. 高分技巧
- 如何设计亮眼的标题
- 如何写好开头和结尾（阅卷重点）
- 如何使用高级词汇和句式
- 如何体现思辨性

## 6. 常见失分点提醒
- 审题偏差的风险点
- 论证不充分的表现
- 语言表达的常见问题

请用Markdown格式输出，结构清晰，便于学生阅读和使用。"""

        # 构建消息列表
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # 调用AI服务
        try:
            result = self.ai.chat(messages, temperature=0.8, max_tokens=3500)
            return {
                "success": True,
                "topic": topic,
                "genre": genre,
                "guide": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================
    # 工作流2：作文分析
    # ============================================

    def essay_analysis_workflow(self, title: str, content: str,
                                db_standards: List[Dict] = None) -> Dict[str, Any]:
        """
        作文分析工作流

        功能：对作文进行多维度深度分析
        分析维度：审题立意、内容、结构、语言、修辞、思辨性等

        参数：
            title: 作文标题
            content: 作文内容
            db_standards: 数据库中的评分标准（可选）

        返回值：
            成功：{"success": True, "title": "...", "word_count": 800, "analysis": "分析结果"}
        """
        # 统计字数（不计算空格和换行）
        word_count = len(content.replace(" ", "").replace("\n", ""))

        # 系统提示词
        system_prompt = """你是一位专业的高考作文阅卷专家，拥有丰富的阅卷经验。
你需要对学生的作文进行全面、客观、专业的分析。
分析要严格按照高考评分标准，有理有据，指出优点和不足。
语言要专业但易懂，给学生明确的改进方向。"""

        # 用户提示词
        user_prompt = f"""请按照高考作文阅卷标准，对以下高中作文进行全面分析：

【作文题目】{title}
【字数统计】约{word_count}字

【作文内容】
{content}

请从以下维度进行详细分析：

## 1. 审题立意分析（对应评分标准"内容"项）
- 是否切题/偏题
- 立意是否准确、深刻
- 中心思想是否明确、突出
- 有无跑题风险

## 2. 内容分析
- 素材是否丰富、典型
- 论证是否充分、有力
- 素材与观点是否契合
- 内容是否充实（对比满分标准）

## 3. 结构分析（对应评分标准"表达"项）
- 整体结构是否完整（开头、主体、结尾）
- 段落安排是否合理
- 层次是否清晰
- 过渡是否自然流畅
- 详略是否得当

## 4. 语言表达分析
- 语言是否流畅
- 用词是否准确、丰富（有无高级词汇）
- 句式是否多样（长短句、整散句结合）
- 有无语病或错别字
- 文采如何

## 5. 思辨性分析
- 观点是否有深度
- 是否体现辩证思维
- 分析是否透彻

## 6. 亮点与不足
### 亮点（至少指出2-3个）
- 具体指出文章的优点

### 不足（至少指出2-3个）
- 具体指出问题所在
- 说明为什么这是问题

## 7. 发展等级评估
- 深刻性：
- 丰富性：
- 文采性：
- 创新性：

## 8. 改进建议
- 最急需改进的1-2个问题
- 具体的改进方法

请用Markdown格式输出，分析要具体、有深度，引用原文作为例证。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            result = self.ai.chat(messages, temperature=0.7, max_tokens=3500)
            return {
                "success": True,
                "title": title,
                "word_count": word_count,
                "analysis": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================
    # 工作流3：修改建议
    # ============================================

    def revision_suggestion_workflow(self, title: str, content: str,
                                     analysis: str = "") -> Dict[str, Any]:
        """
        修改建议工作流

        功能：针对作文中的问题，提供具体可操作的修改方案
        特点：给出修改前后的对比示例，让学生清楚知道如何改进

        参数：
            title: 作文标题
            content: 作文内容
            analysis: 之前的分析结果（用于生成更有针对性的建议）
        """
        system_prompt = """你是一位耐心细致的语文教师，擅长指导学生修改作文以提升分数。
你需要针对学生作文中的问题，给出具体、可操作的修改建议。
建议要详细，最好能给出修改前后的对比示例，让学生清楚知道如何改进。
重点关注能快速提分的修改点。"""

        # 如果有之前的分析结果，添加到上下文中
        analysis_context = ""
        if analysis:
            analysis_context = f"""
【之前的分析结果】
{analysis}

基于以上分析，请给出针对性的修改建议。"""

        user_prompt = f"""请为以下高中作文提供详细的修改建议，目标是帮助学生提升到48分以上（优秀作文水平）：

【作文题目】{title}

【作文内容】
{content}
{analysis_context}

请提供以下修改建议：

## 1. 紧急修改（快速提分项）
### 标题优化
- 当前标题评价
- 建议的新标题（2-3个选项）

### 开头优化（阅卷重点关注）
- 当前开头的问题
- 修改后的开头示例

### 结尾优化（阅卷重点关注）
- 当前结尾的问题
- 修改后的结尾示例

## 2. 内容层面修改
### 论点优化
- 如何让论点更深刻

### 素材优化
- 哪些素材需要替换
- 推荐更好的素材
- 如何分析素材与论点的关系

### 论证深化
- 哪些地方论证不充分
- 如何加强论证

## 3. 结构层面修改
- 段落调整建议
- 过渡句添加建议
- 详略安排优化

## 4. 语言层面修改
### 词汇升级
- 列出5个可以替换为更高级词汇的词
- 给出替换建议

### 句式优化
- 选取2-3处，展示句式变化
- 修改前后对比

### 语病修正
- 指出并修正语病

## 5. 修改示例（重点段落重写）
请选取原文中论证最薄弱的一段（约150-200字），给出完整的修改版本：
- 原文：[引用原文]
- 修改后：[完整的修改版本]
- 修改说明：[逐句解释为什么这样修改，如何提分]

## 6. 提分路径
- 从当前分数提升到45分需要做什么
- 从45分提升到50分需要做什么
- 从50分冲击满分需要做什么

请用Markdown格式输出，建议要具体、可操作，最好有修改前后的对比。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            result = self.ai.chat(messages, temperature=0.7, max_tokens=3500)
            return {
                "success": True,
                "title": title,
                "suggestions": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================
    # 工作流4：智能评分
    # ============================================

    def scoring_workflow(self, title: str, content: str,
                         total_score: int = 60,
                         db_standards: List[Dict] = None) -> Dict[str, Any]:
        """
        智能评分工作流

        功能：严格按照高考评分标准对作文进行评分
        评分维度：基础等级（内容+表达）+ 发展等级 - 扣分项

        参数：
            title: 作文标题
            content: 作文内容
            total_score: 满分分数（默认60分）
            db_standards: 数据库中的评分标准
        """
        word_count = len(content.replace(" ", "").replace("\n", ""))

        system_prompt = """你是一位严谨的高考作文阅卷专家，参加过多次高考阅卷工作。
你需要严格按照高考作文评分标准对学生作文进行客观、公正的评分。
评分要有明确的依据，每项扣分都要说明理由。
评语要具体、有建设性，帮助学生了解自己的水平和改进方向。"""

        # 获取评分标准文本
        grading_standards = format_grading_standards()

        user_prompt = f"""请严格按照高考作文评分标准，对以下作文进行评分：

【作文题目】{title}
【字数统计】约{word_count}字

【评分标准参考】
{grading_standards}

【作文内容】
{content}

请按以下格式输出评分结果：

## 一、基础等级评分（40分）

### 内容项（20分）
- 审题立意：__分（理由：）
- 中心思想：__分（理由：）
- 内容充实度：__分（理由：）
- **内容项总分：__/20分**

### 表达项（20分）
- 文体规范：__分（理由：）
- 结构严谨度：__分（理由：）
- 语言流畅度：__分（理由：）
- 文面整洁度：__分（理由：）
- **表达项总分：__/20分**

### 基础等级总分：__/40分

## 二、发展等级评分（20分）

- 深刻性：__分（理由：）
- 丰富性：__分（理由：）
- 文采性：__分（理由：）
- 创新性：__分（理由：）
- **发展等级总分：__/20分**（取最高等级赋分，不累加）

## 三、扣分项

- 错别字：扣__分（共__处）
- 字数不足：扣__分（少__字）
- 标点符号：扣__分
- 其他：扣__分
- **扣分总计：__分**

## 四、最终得分

- 基础等级：__分
- 发展等级：__分
- 扣分项：__分
- **最终得分：__/{total_score}分**

## 五、等级评定
（优秀48-60/良好42-47/中等36-41/较差36以下）

## 六、阅卷评语

### 核心优点（2-3点）
1.
2.
3.

### 主要问题（2-3点）
1.
2.
3.

### 提升建议
- 最急需改进：
- 中期提升方向：
- 长期发展目标：

请严格按照评分标准打分，评语要具体、有建设性。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            result = self.ai.chat(messages, temperature=0.5, max_tokens=3000)
            return {
                "success": True,
                "title": title,
                "total_score": total_score,
                "word_count": word_count,
                "scoring_result": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================
    # 工作流5：综合评价
    # ============================================

    def comprehensive_workflow(self, title: str, content: str,
                               genre: str = "议论文",
                               db_standards: List[Dict] = None,
                               db_essays: List[Dict] = None) -> Dict[str, Any]:
        """
        综合评价工作流

        功能：一次性完成作文分析、评分、修改建议（最全面的评价）
        相当于同时调用分析、评分、建议三个工作流

        参数：
            title: 作文标题
            content: 作文内容
            genre: 文体类型
            db_standards: 评分标准
            db_essays: 优秀范文（用于参考对比）
        """
        word_count = len(content.replace(" ", "").replace("\n", ""))

        system_prompt = """你是一位资深的高中语文教师和高考作文阅卷专家。
你需要对学生的作文进行全面、专业的分析和评价，包括分析、评分和修改建议。
评价要基于高考评分标准，专业、客观、有建设性。
请用专业但易懂的语言，给出有深度、有指导意义的评价。"""

        grading_standards = format_grading_standards()

        user_prompt = f"""请按照高考阅卷标准，对以下高中{genre}进行综合评价：

【作文题目】{title}
【字数统计】约{word_count}字

【评分标准参考】
{grading_standards}

【作文内容】
{content}

请提供完整的综合评价报告：

## 一、总体评分（满分60分）

### 基础等级（40分）
- 内容项：__/20分
- 表达项：__/20分

### 发展等级（20分）
- 得分：__/20分

### 扣分项
- 共扣：__分

### **最终得分：__/60分**
### **等级：__**

## 二、详细分析

### 1. 审题立意
- 切题程度：
- 立意深度：
- 中心明确度：

### 2. 内容分析
- 素材运用：
- 论证充分性：
- 内容充实度：

### 3. 结构分析
- 整体结构：
- 段落安排：
- 过渡衔接：

### 4. 语言表达
- 语言流畅度：
- 用词准确性：
- 句式变化：
- 文采表现：

### 5. 思辨深度
- 观点深度：
- 辩证思维：
- 分析透彻度：

## 三、亮点（3点）
1.
2.
3.

## 四、问题（3点）
1.
2.
3.

## 五、修改建议

### 快速提分项（改了就能加分）
1.
2.

### 内容优化建议
-

### 结构优化建议
-

### 语言优化建议
-

## 六、提升路径
- 当前水平：__分档
- 短期目标（1-2周）：提升到__分，需要：
- 中期目标（1-2月）：提升到__分，需要：
- 长期目标：冲击满分，需要：

请用Markdown格式输出，评价要全面、客观、有建设性。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            result = self.ai.chat(messages, temperature=0.6, max_tokens=4000)
            return {
                "success": True,
                "title": title,
                "genre": genre,
                "word_count": word_count,
                "comprehensive_result": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================
    # 工作流6：素材推荐
    # ============================================

    def material_recommendation_workflow(self, topic: str, angle: str = "",
                                          db_materials: List[Dict] = None) -> Dict[str, Any]:
        """
        素材推荐工作流

        功能：根据作文主题推荐相关素材
        包括：名言警句、历史典故、人物事迹、时事素材等

        参数：
            topic: 作文主题
            angle: 写作角度（可选）
            db_materials: 数据库中的相关素材
        """
        # 获取主题素材
        theme_materials = get_materials_by_theme(topic[:2])

        system_prompt = """你是一位博学的语文教师，拥有丰富的文学和历史知识。
你需要为学生推荐适合其作文主题的素材，包括名言、典故、事例等。
素材要准确、典型，并说明适用场景和使用方法。
优先推荐高考满分作文中常用的经典素材。"""

        # 构建已有素材参考
        existing_materials = ""
        if theme_materials:
            existing_materials = f"""
【主题素材库参考】
以下是"{topic[:2]}"主题的常用素材：

名言警句：
{chr(10).join('- ' + m for m in theme_materials.get('名言', []))}

经典事例：
{chr(10).join('- ' + s for s in theme_materials.get('事例', []))}

请在此基础上补充更多素材，并详细说明使用方法。"""

        # 添加数据库素材
        if db_materials:
            existing_materials += "\n【数据库素材】\n"
            for m in db_materials[:5]:
                existing_materials += f"- {m.get('content', '')}（{m.get('source', '')}）\n"

        angle_context = f"\n写作角度：{angle}" if angle else ""

        user_prompt = f"""请为作文主题《{topic}》推荐写作素材：{angle_context}
{existing_materials}

请分类推荐以下素材：

## 1. 名言警句（至少5句）
每句包含：
- 原文（确保准确）
- 出处/作者
- 适用场景说明
- 在作文中如何使用（给出示例句）

## 2. 古代典故（至少3个）
每个包含：
- 典故名称和来源
- 主要内容（80字以内）
- 适用的论证角度
- 使用示例

## 3. 现代事例（至少3个）
每个包含：
- 人物/事件名称
- 核心事迹（100字以内）
- 适用的论证角度
- 如何与论点结合

## 4. 时事热点（至少2个）
每个包含：
- 事件概述
- 可论证的观点
- 使用建议

## 5. 素材使用技巧
- 如何自然地引入素材
- 如何分析素材与论点的关系
- 避免素材堆砌的技巧

请用Markdown格式输出，确保素材准确、实用。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            result = self.ai.chat(messages, temperature=0.8, max_tokens=3000)
            return {
                "success": True,
                "topic": topic,
                "materials": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================
    # 工作流7：高考真题练习
    # ============================================

    def gaokao_topic_practice_workflow(self, year: str = None,
                                        db_topics: List[Dict] = None) -> Dict[str, Any]:
        """
        高考真题练习工作流

        功能：随机或按年份选择高考真题，提供详细的写作指导
        包括：题目解读、审题指导、写作思路、满分结构、推荐素材等

        参数：
            year: 年份（可选）
            db_topics: 数据库中的真题
        """
        # 优先使用数据库中的真题
        if db_topics and len(db_topics) > 0:
            import random
            topic_data = random.choice(db_topics)
            topic_info = {
                "year": topic_data.get("year", "未知"),
                "paper": topic_data.get("paper", "未知"),
                "topic": topic_data.get("title", "未知"),
                "material": topic_data.get("material", ""),
                "keywords": topic_data.get("keywords", []),
                "themes": topic_data.get("themes", [])
            }
        else:
            # 使用内置的高考真题数据
            topic_info = get_random_topic(year)

        system_prompt = """你是一位资深的高考作文辅导教师。
你需要为学生详细讲解一道高考真题，帮助学生理解题意、掌握写作方法。"""

        user_prompt = f"""请详细讲解以下高考作文真题：

【真题信息】
年份：{topic_info['year']}
试卷：{topic_info['paper']}
题目：{topic_info['topic']}

【材料内容】
{topic_info['material']}

【关键词】{', '.join(topic_info.get('keywords', []))}
【主题方向】{', '.join(topic_info.get('themes', []))}

请提供以下讲解内容：

## 1. 题目解读
- 材料的核心含义
- 关键词的深层理解
- 题目的限制与开放

## 2. 审题指导
- 正确的审题方法
- 常见的偏题情况
- 如何确定立意角度

## 3. 写作思路（3种）
- 思路一：稳妥型
- 思路二：深度型
- 思路三：创新型

## 4. 满分作文结构
- 详细的结构提纲
- 各段落的写作要点

## 5. 推荐素材
- 适合此题的名言
- 适合此题的事例

## 6. 评分要点
- 阅卷老师关注什么
- 高分作文的特点
- 常见失分点

请用Markdown格式输出。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            result = self.ai.chat(messages, temperature=0.7, max_tokens=3000)
            return {
                "success": True,
                "topic_info": topic_info,
                "guide": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================
    # 工作流8：AI写作成文
    # ============================================

    def ai_write_essay_workflow(self, topic: str, genre: str = "议论文",
                                 level: str = "45", wordcount: str = "800",
                                 requirements: str = "",
                                 db_materials: List[Dict] = None) -> Dict[str, Any]:
        """
        AI写作成文工作流

        功能：根据题目和要求，AI直接生成一篇完整的作文

        参数：
            topic: 作文题目
            genre: 文体类型
            level: 目标分数（45/50/55）
            wordcount: 字数要求
            requirements: 补充要求
            db_materials: 数据库中的相关素材
        """
        system_prompt = """你是一位资深的高中语文教师和高考满分作文写手。
你需要根据题目要求，写出一篇高质量的高考作文。
作文要符合高考评分标准，结构完整，语言优美，论证充分，有思想深度。
请直接输出作文正文，不要输出任何解释或说明。"""

        # 构建素材参考
        materials_ref = ""
        if db_materials and len(db_materials) > 0:
            materials_ref = "\n【可用素材参考】\n"
            for m in db_materials[:5]:
                materials_ref += f"- {m.get('content', '')}（{m.get('source', '')}）\n"

        user_prompt = f"""请写一篇高中{genre}，要求如下：

【作文题目】{topic}
【文体要求】{genre}
【字数要求】约{wordcount}字
【目标分数】{level}分以上
{f'【补充要求】{requirements}' if requirements else ''}
{materials_ref}

写作要求：
1. 立意深刻，角度新颖
2. 结构完整，层次清晰（开头+3个主体段+结尾）
3. 论据充实，素材典型
4. 语言优美，有文采（善用修辞、长短句结合）
5. 体现思辨性

请直接输出作文正文（包含标题）："""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            result = self.ai.chat(messages, temperature=0.85, max_tokens=4000)
            return {
                "success": True,
                "topic": topic,
                "genre": genre,
                "essay": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


class WorkflowProgress:
    """
    工作流进度追踪类

    用于追踪长时间运行的工作流的进度
    可以显示当前步骤、总步骤数、进度百分比等信息

    使用示例：
        progress = WorkflowProgress()
        progress.start(["步骤1", "步骤2", "步骤3"])
        progress.next_step()  # 进入步骤1
        progress.next_step()  # 进入步骤2
        print(progress.get_progress())  # 获取当前进度
    """

    def __init__(self):
        """初始化进度追踪器"""
        self.steps = []           # 步骤列表
        self.current_step = 0     # 当前步骤索引
        self.total_steps = 0      # 总步骤数

    def start(self, steps: List[str]):
        """
        开始追踪

        参数：
            steps: 步骤名称列表
        """
        self.steps = steps
        self.total_steps = len(steps)
        self.current_step = 0

    def next_step(self, result: Any = None):
        """
        进入下一步

        参数：
            result: 当前步骤的结果（可选）

        返回值：包含进度信息的字典
        """
        self.current_step += 1
        return {
            "progress": self.current_step / self.total_steps * 100,  # 进度百分比
            "current": self.current_step,   # 当前步骤
            "total": self.total_steps,      # 总步骤数
            "step": self.steps[self.current_step - 1] if self.current_step <= self.total_steps else "完成",
            "result": result
        }

    def get_progress(self) -> Dict[str, Any]:
        """
        获取当前进度

        返回值：包含进度信息的字典
        """
        return {
            "progress": self.current_step / self.total_steps * 100 if self.total_steps > 0 else 0,
            "current": self.current_step,
            "total": self.total_steps,
            "step": self.steps[self.current_step - 1] if 0 < self.current_step <= self.total_steps else "等待开始"
        }

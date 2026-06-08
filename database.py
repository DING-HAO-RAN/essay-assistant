"""
作文助手数据库模块
支持存储：作文题目、素材、范文、评分标准
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional


class EssayDatabase:
    """作文助手数据库"""

    def __init__(self, db_path: str = "data/essay_assistant.db"):
        self.db_path = db_path
        self._ensure_data_dir()
        self.init_db()

    def _ensure_data_dir(self):
        """确保数据目录存在"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

    def get_conn(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """初始化数据库表"""
        conn = self.get_conn()
        cursor = conn.cursor()

        # 作文题目表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                material TEXT,
                genre TEXT DEFAULT '议论文',
                year INTEGER,
                paper TEXT,
                keywords TEXT,
                themes TEXT,
                difficulty INTEGER DEFAULT 3,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 作文素材表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                subcategory TEXT,
                content TEXT NOT NULL,
                source TEXT,
                author TEXT,
                theme TEXT,
                usage_guide TEXT,
                example TEXT,
                tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 作文范文表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS essays (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                genre TEXT DEFAULT '议论文',
                topic_id INTEGER,
                score INTEGER,
                grade TEXT,
                source TEXT,
                highlights TEXT,
                analysis TEXT,
                tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (topic_id) REFERENCES topics(id)
            )
        ''')

        # 评分标准表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS grading_standards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                level INTEGER,
                score_range TEXT,
                description TEXT,
                criteria TEXT,
                examples TEXT,
                is_default BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 用户作文记录表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_essays (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                genre TEXT DEFAULT '议论文',
                topic_id INTEGER,
                score INTEGER,
                analysis TEXT,
                suggestions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (topic_id) REFERENCES topics(id)
            )
        ''')

        conn.commit()
        conn.close()

    # ============================================
    # 作文题目操作
    # ============================================

    def add_topic(self, data: Dict[str, Any]) -> int:
        """添加作文题目"""
        conn = self.get_conn()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO topics (title, material, genre, year, paper, keywords, themes, difficulty, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('title'),
            data.get('material'),
            data.get('genre', '议论文'),
            data.get('year'),
            data.get('paper'),
            json.dumps(data.get('keywords', []), ensure_ascii=False),
            json.dumps(data.get('themes', []), ensure_ascii=False),
            data.get('difficulty', 3),
            data.get('notes')
        ))

        topic_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return topic_id

    def get_topics(self, genre: str = None, year: int = None, limit: int = 100) -> List[Dict]:
        """获取作文题目列表"""
        conn = self.get_conn()
        cursor = conn.cursor()

        query = "SELECT * FROM topics WHERE 1=1"
        params = []

        if genre:
            query += " AND genre = ?"
            params.append(genre)
        if year:
            query += " AND year = ?"
            params.append(year)

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [self._row_to_dict(row) for row in rows]

    def get_topic_by_id(self, topic_id: int) -> Optional[Dict]:
        """根据ID获取作文题目"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM topics WHERE id = ?", (topic_id,))
        row = cursor.fetchone()
        conn.close()
        return self._row_to_dict(row) if row else None

    def update_topic(self, topic_id: int, data: Dict[str, Any]) -> bool:
        """更新作文题目"""
        conn = self.get_conn()
        cursor = conn.cursor()

        fields = []
        values = []

        for key in ['title', 'material', 'genre', 'year', 'paper', 'difficulty', 'notes']:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])

        if 'keywords' in data:
            fields.append("keywords = ?")
            values.append(json.dumps(data['keywords'], ensure_ascii=False))

        if 'themes' in data:
            fields.append("themes = ?")
            values.append(json.dumps(data['themes'], ensure_ascii=False))

        fields.append("updated_at = CURRENT_TIMESTAMP")
        values.append(topic_id)

        cursor.execute(f"UPDATE topics SET {', '.join(fields)} WHERE id = ?", values)
        affected = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return affected

    def delete_topic(self, topic_id: int) -> bool:
        """删除作文题目"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM topics WHERE id = ?", (topic_id,))
        affected = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return affected

    # ============================================
    # 作文素材操作
    # ============================================

    def add_material(self, data: Dict[str, Any]) -> int:
        """添加作文素材"""
        conn = self.get_conn()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO materials (category, subcategory, content, source, author, theme, usage_guide, example, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('category'),
            data.get('subcategory'),
            data.get('content'),
            data.get('source'),
            data.get('author'),
            data.get('theme'),
            data.get('usage_guide'),
            data.get('example'),
            json.dumps(data.get('tags', []), ensure_ascii=False)
        ))

        material_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return material_id

    def get_materials(self, category: str = None, theme: str = None, limit: int = 100) -> List[Dict]:
        """获取素材列表"""
        conn = self.get_conn()
        cursor = conn.cursor()

        query = "SELECT * FROM materials WHERE 1=1"
        params = []

        if category:
            query += " AND category = ?"
            params.append(category)
        if theme:
            query += " AND theme LIKE ?"
            params.append(f"%{theme}%")

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [self._row_to_dict(row) for row in rows]

    def get_material_by_id(self, material_id: int) -> Optional[Dict]:
        """根据ID获取素材"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM materials WHERE id = ?", (material_id,))
        row = cursor.fetchone()
        conn.close()
        return self._row_to_dict(row) if row else None

    def search_materials(self, keyword: str, limit: int = 20) -> List[Dict]:
        """搜索素材"""
        conn = self.get_conn()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM materials
            WHERE content LIKE ? OR source LIKE ? OR author LIKE ? OR theme LIKE ? OR tags LIKE ?
            LIMIT ?
        ''', (f"%{keyword}%",) * 5 + (limit,))

        rows = cursor.fetchall()
        conn.close()

        return [self._row_to_dict(row) for row in rows]

    def update_material(self, material_id: int, data: Dict[str, Any]) -> bool:
        """更新素材"""
        conn = self.get_conn()
        cursor = conn.cursor()

        fields = []
        values = []

        for key in ['category', 'subcategory', 'content', 'source', 'author', 'theme', 'usage_guide', 'example']:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])

        if 'tags' in data:
            fields.append("tags = ?")
            values.append(json.dumps(data['tags'], ensure_ascii=False))

        fields.append("updated_at = CURRENT_TIMESTAMP")
        values.append(material_id)

        cursor.execute(f"UPDATE materials SET {', '.join(fields)} WHERE id = ?", values)
        affected = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return affected

    def delete_material(self, material_id: int) -> bool:
        """删除素材"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM materials WHERE id = ?", (material_id,))
        affected = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return affected

    # ============================================
    # 作文范文操作
    # ============================================

    def add_essay(self, data: Dict[str, Any]) -> int:
        """添加范文"""
        conn = self.get_conn()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO essays (title, content, genre, topic_id, score, grade, source, highlights, analysis, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('title'),
            data.get('content'),
            data.get('genre', '议论文'),
            data.get('topic_id'),
            data.get('score'),
            data.get('grade'),
            data.get('source'),
            data.get('highlights'),
            data.get('analysis'),
            json.dumps(data.get('tags', []), ensure_ascii=False)
        ))

        essay_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return essay_id

    def get_essays(self, genre: str = None, topic_id: int = None, min_score: int = None, limit: int = 100) -> List[Dict]:
        """获取范文列表"""
        conn = self.get_conn()
        cursor = conn.cursor()

        query = "SELECT * FROM essays WHERE 1=1"
        params = []

        if genre:
            query += " AND genre = ?"
            params.append(genre)
        if topic_id:
            query += " AND topic_id = ?"
            params.append(topic_id)
        if min_score:
            query += " AND score >= ?"
            params.append(min_score)

        query += " ORDER BY score DESC, created_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [self._row_to_dict(row) for row in rows]

    def get_essay_by_id(self, essay_id: int) -> Optional[Dict]:
        """根据ID获取范文"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM essays WHERE id = ?", (essay_id,))
        row = cursor.fetchone()
        conn.close()
        return self._row_to_dict(row) if row else None

    def update_essay(self, essay_id: int, data: Dict[str, Any]) -> bool:
        """更新范文"""
        conn = self.get_conn()
        cursor = conn.cursor()

        fields = []
        values = []

        for key in ['title', 'content', 'genre', 'topic_id', 'score', 'grade', 'source', 'highlights', 'analysis']:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])

        if 'tags' in data:
            fields.append("tags = ?")
            values.append(json.dumps(data['tags'], ensure_ascii=False))

        fields.append("updated_at = CURRENT_TIMESTAMP")
        values.append(essay_id)

        cursor.execute(f"UPDATE essays SET {', '.join(fields)} WHERE id = ?", values)
        affected = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return affected

    def delete_essay(self, essay_id: int) -> bool:
        """删除范文"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM essays WHERE id = ?", (essay_id,))
        affected = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return affected

    # ============================================
    # 评分标准操作
    # ============================================

    def add_grading_standard(self, data: Dict[str, Any]) -> int:
        """添加评分标准"""
        conn = self.get_conn()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO grading_standards (name, category, level, score_range, description, criteria, examples, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('category'),
            data.get('level'),
            data.get('score_range'),
            data.get('description'),
            data.get('criteria'),
            data.get('examples'),
            data.get('is_default', 0)
        ))

        standard_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return standard_id

    def get_grading_standards(self, category: str = None) -> List[Dict]:
        """获取评分标准列表"""
        conn = self.get_conn()
        cursor = conn.cursor()

        query = "SELECT * FROM grading_standards WHERE 1=1"
        params = []

        if category:
            query += " AND category = ?"
            params.append(category)

        query += " ORDER BY category, level"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return [self._row_to_dict(row) for row in rows]

    def update_grading_standard(self, standard_id: int, data: Dict[str, Any]) -> bool:
        """更新评分标准"""
        conn = self.get_conn()
        cursor = conn.cursor()

        fields = []
        values = []

        for key in ['name', 'category', 'level', 'score_range', 'description', 'criteria', 'examples', 'is_default']:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])

        fields.append("updated_at = CURRENT_TIMESTAMP")
        values.append(standard_id)

        cursor.execute(f"UPDATE grading_standards SET {', '.join(fields)} WHERE id = ?", values)
        affected = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return affected

    def delete_grading_standard(self, standard_id: int) -> bool:
        """删除评分标准"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM grading_standards WHERE id = ?", (standard_id,))
        affected = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return affected

    # ============================================
    # 用户作文记录操作
    # ============================================

    def save_user_essay(self, data: Dict[str, Any]) -> int:
        """保存用户作文"""
        conn = self.get_conn()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO user_essays (title, content, genre, topic_id, score, analysis, suggestions)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('title'),
            data.get('content'),
            data.get('genre', '议论文'),
            data.get('topic_id'),
            data.get('score'),
            data.get('analysis'),
            data.get('suggestions')
        ))

        essay_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return essay_id

    def get_user_essays(self, limit: int = 50) -> List[Dict]:
        """获取用户作文列表"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_essays ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_dict(row) for row in rows]

    def delete_user_essay(self, essay_id: int) -> bool:
        """删除用户作文"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_essays WHERE id = ?", (essay_id,))
        affected = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return affected

    # ============================================
    # 批量导入操作
    # ============================================

    def import_topics(self, topics: List[Dict]) -> int:
        """批量导入作文题目"""
        count = 0
        for topic in topics:
            try:
                self.add_topic(topic)
                count += 1
            except Exception as e:
                print(f"导入题目失败: {e}")
        return count

    def import_materials(self, materials: List[Dict]) -> int:
        """批量导入素材"""
        count = 0
        for material in materials:
            try:
                self.add_material(material)
                count += 1
            except Exception as e:
                print(f"导入素材失败: {e}")
        return count

    def import_essays(self, essays: List[Dict]) -> int:
        """批量导入范文"""
        count = 0
        for essay in essays:
            try:
                self.add_essay(essay)
                count += 1
            except Exception as e:
                print(f"导入范文失败: {e}")
        return count

    # ============================================
    # 统计查询
    # ============================================

    def get_stats(self) -> Dict[str, int]:
        """获取数据库统计信息"""
        conn = self.get_conn()
        cursor = conn.cursor()

        stats = {}

        cursor.execute("SELECT COUNT(*) FROM topics")
        stats['topics'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM materials")
        stats['materials'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM essays")
        stats['essays'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM grading_standards")
        stats['standards'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM user_essays")
        stats['user_essays'] = cursor.fetchone()[0]

        conn.close()
        return stats

    def get_material_categories(self) -> List[str]:
        """获取素材分类列表"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT category FROM materials ORDER BY category")
        rows = cursor.fetchall()
        conn.close()
        return [row[0] for row in rows]

    def get_themes(self) -> List[str]:
        """获取主题列表"""
        conn = self.get_conn()
        cursor = conn.cursor()

        themes = set()

        # 从题目获取
        cursor.execute("SELECT themes FROM topics WHERE themes IS NOT NULL")
        for row in cursor.fetchall():
            try:
                themes.update(json.loads(row[0]))
            except:
                pass

        # 从素材获取
        cursor.execute("SELECT DISTINCT theme FROM materials WHERE theme IS NOT NULL")
        for row in cursor.fetchall():
            if row[0]:
                themes.add(row[0])

        conn.close()
        return sorted(list(themes))

    # ============================================
    # 辅助方法
    # ============================================

    def _row_to_dict(self, row) -> Dict:
        """将数据库行转换为字典"""
        if row is None:
            return None

        d = dict(row)

        # 解析JSON字段
        for field in ['keywords', 'themes', 'tags']:
            if field in d and d[field]:
                try:
                    d[field] = json.loads(d[field])
                except:
                    pass

        return d

    def export_data(self, table: str) -> List[Dict]:
        """导出表数据"""
        conn = self.get_conn()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_dict(row) for row in rows]

    def import_data(self, table: str, data: List[Dict]) -> int:
        """通用导入方法"""
        method_map = {
            'topics': self.add_topic,
            'materials': self.add_material,
            'essays': self.add_essay,
            'grading_standards': self.add_grading_standard
        }

        if table not in method_map:
            raise ValueError(f"不支持的表: {table}")

        count = 0
        for item in data:
            try:
                method_map[table](item)
                count += 1
            except Exception as e:
                print(f"导入失败: {e}")
        return count


# 初始化默认评分标准
def init_default_standards(db: EssayDatabase):
    """初始化默认评分标准"""
    conn = db.get_conn()
    cursor = conn.cursor()

    # 检查是否已有数据
    cursor.execute("SELECT COUNT(*) FROM grading_standards")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    # 基础等级 - 内容
    standards = [
        # 内容项
        {
            "name": "内容一等",
            "category": "内容",
            "level": 1,
            "score_range": "20-16",
            "description": "切合题意、中心突出、内容充实、思想健康、感情真挚",
            "criteria": "1. 审题准确，完全符合题意\n2. 中心思想明确且突出\n3. 素材丰富，论据充实\n4. 思想积极向上\n5. 情感真挚动人",
            "is_default": 1
        },
        {
            "name": "内容二等",
            "category": "内容",
            "level": 2,
            "score_range": "15-11",
            "description": "符合题意、中心明确、内容较充实、思想健康、感情真实",
            "criteria": "1. 审题正确，基本符合题意\n2. 中心思想较明确\n3. 有一定素材支撑\n4. 思想健康\n5. 情感真实",
            "is_default": 1
        },
        {
            "name": "内容三等",
            "category": "内容",
            "level": 3,
            "score_range": "10-6",
            "description": "基本符合题意、中心基本明确、内容单薄",
            "criteria": "1. 审题基本准确\n2. 中心思想不够突出\n3. 素材较少\n4. 内容单薄",
            "is_default": 1
        },
        {
            "name": "内容四等",
            "category": "内容",
            "level": 4,
            "score_range": "5-0",
            "description": "偏离题意、中心不明确、内容空洞",
            "criteria": "1. 审题偏差\n2. 中心不明确\n3. 内容空洞\n4. 思想不健康或感情虚假",
            "is_default": 1
        },
        # 表达项
        {
            "name": "表达一等",
            "category": "表达",
            "level": 1,
            "score_range": "20-16",
            "description": "符合文体要求、结构严谨、语言流畅、字迹工整",
            "criteria": "1. 文体规范\n2. 结构严谨，层次清晰\n3. 语言流畅，有文采\n4. 书写工整",
            "is_default": 1
        },
        {
            "name": "表达二等",
            "category": "表达",
            "level": 2,
            "score_range": "15-11",
            "description": "符合文体要求、结构完整、语言通顺、字迹清楚",
            "criteria": "1. 符合文体要求\n2. 结构完整\n3. 语言通顺\n4. 书写清楚",
            "is_default": 1
        },
        {
            "name": "表达三等",
            "category": "表达",
            "level": 3,
            "score_range": "10-6",
            "description": "基本符合文体要求、结构基本完整、语言基本通顺",
            "criteria": "1. 基本符合文体\n2. 结构基本完整\n3. 语言基本通顺\n4. 有语病",
            "is_default": 1
        },
        {
            "name": "表达四等",
            "category": "表达",
            "level": 4,
            "score_range": "5-0",
            "description": "不符合文体要求、结构混乱、语言不通顺",
            "criteria": "1. 文体不符\n2. 结构混乱\n3. 语言不通顺\n4. 书写潦草",
            "is_default": 1
        },
        # 发展等级
        {
            "name": "深刻",
            "category": "发展等级",
            "level": 1,
            "score_range": "20",
            "description": "透过现象深入本质、揭示事物内在关系、观点具有启发性",
            "criteria": "1. 能透过现象看到本质\n2. 揭示事物内在关系\n3. 观点有启发性\n4. 分析深入透彻",
            "is_default": 1
        },
        {
            "name": "丰富",
            "category": "发展等级",
            "level": 2,
            "score_range": "20",
            "description": "材料丰富、论据充实、形象丰满、意境深远",
            "criteria": "1. 素材丰富多样\n2. 论据充实有力\n3. 形象丰满\n4. 意境深远",
            "is_default": 1
        },
        {
            "name": "有文采",
            "category": "发展等级",
            "level": 3,
            "score_range": "20",
            "description": "用词贴切、句式灵活、善用修辞、文句有表现力",
            "criteria": "1. 用词准确贴切\n2. 句式灵活多变\n3. 善用修辞手法\n4. 文句有表现力",
            "is_default": 1
        },
        {
            "name": "有创新",
            "category": "发展等级",
            "level": 4,
            "score_range": "20",
            "description": "见解新颖、材料新鲜、构思精巧、有个性色彩",
            "criteria": "1. 见解新颖独到\n2. 素材新鲜\n3. 构思精巧\n4. 有个性色彩",
            "is_default": 1
        }
    ]

    for standard in standards:
        db.add_grading_standard(standard)

    conn.close()


# 全局数据库实例
db = EssayDatabase()
init_default_standards(db)

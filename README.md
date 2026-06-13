# AI作文助手 - 智能写作辅导系统

> **[English](#english-version) | 中文**

## 项目简介

AI作文助手是一款基于人工智能技术的高中语文作文辅助系统，为学生提供专业的作文创作指导、AI写作成文、智能分析、修改建议和自动评分服务。系统基于近五年高考真题和评分标准优化，帮助学生写出高分作文。

### 核心功能

- **创作指导**：输入作文题目，获取写作思路、素材推荐和结构提纲
- **AI写作**：输入题目和要求，AI直接生成一篇完整的高分作文 ✨新增
- **作文分析**：多维度分析作文的结构、语言、内容、修辞等
- **智能评分**：模拟高考评分标准，给出综合评分和详细评语
- **素材推荐**：根据主题智能推荐名言警句、典故、事例等素材
- **高考真题**：2020-2024年高考真题库，提供真题讲解和写作练习
- **数据管理**：支持自定义添加题目、素材、范文、评分标准

### 技术特点

- **通用AI接口**：支持OpenAI、Claude、DeepSeek、Kimi、智谱AI、通义千问、小米MiMo等8种服务
- **高考标准优化**：基于高考评分标准和满分作文结构进行优化
- **现代化界面**：响应式设计，深色主题，卡片式交互
- **模块化架构**：清晰的代码结构，易于扩展和维护
- **本地数据库**：SQLite数据库，支持数据导入导出

---

## 环境要求

- Python 3.8+
- pip (Python包管理器)
- 现代浏览器（Chrome、Edge、Firefox等）

---

## 安装步骤

### 方式一：使用启动脚本（推荐）

1. 双击 `start.bat` 文件
2. 脚本会自动安装依赖并启动应用
3. 浏览器访问 `http://localhost:5000`

### 方式二：手动安装

```bash
# 1. 进入项目目录
cd essay-assistant

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动应用
python app.py

# 4. 访问应用
# 打开浏览器访问：http://localhost:5000
```

---

## 支持的AI服务商

| 服务商 | 模型 | API地址 | 说明 |
|--------|------|---------|------|
| OpenAI | gpt-4.1, gpt-5, o3 | api.openai.com/v1 | 国际主流 |
| Claude | claude-sonnet-4-6, claude-opus-4-8 | api.anthropic.com/v1 | 长文本理解 |
| DeepSeek | deepseek-chat, deepseek-reasoner | api.deepseek.com/v1 | 性价比高 |
| Kimi | kimi-k2, moonshot-v1-128k | api.moonshot.cn/v1 | 长上下文 |
| 智谱AI | glm-4-plus, glm-4-flash | open.bigmodel.cn/api/paas/v4 | 清华背景 |
| 通义千问 | qwen-max, qwen3-235b | dashscope.aliyuncs.com/.../v1 | 阿里云 |
| **小米MiMo** | **mimo-v2.5-pro** | **mimo.mi.com/v1** | **推理能力强** |
| 硅基流动 | DeepSeek-V3, Qwen3等 | api.siliconflow.cn/v1 | 多模型聚合 |

---

## 功能使用指南

### 1. 创作指导

输入作文题目，AI为您提供：
- 审题指导和立意方向
- 3种不同角度的写作思路
- 详细的结构提纲
- 推荐素材和名言
- 高分技巧

### 2. AI写作成文 ✨新增

输入作文题目和要求，AI直接生成一篇完整的高分作文：
- 支持设置文体（议论文/记叙文/说明文/散文）
- 支持设置目标分数（45/50/55分以上）
- 支持设置字数要求（800/1000/1200字）
- 支持补充要求（指定素材、开头方式等）
- 生成后可一键分析作文

### 3. 作文分析

对作文进行多维度深度分析：
- 审题立意分析
- 内容分析（素材、论证）
- 结构分析（段落、层次、过渡）
- 语言表达分析（用词、句式、文采）
- 思辨性分析
- 亮点与不足
- 改进建议

### 4. 智能评分

严格按照高考评分标准评分：
- 基础等级（内容20分 + 表达20分）
- 发展等级（20分）
- 扣分项说明
- 最终得分和等级评定
- 提升路径建议

### 5. 素材推荐

根据作文主题推荐相关素材：
- 名言警句（含出处和使用方法）
- 历史典故（含使用示例）
- 人物事迹（含论证角度）
- 时事热点

### 6. 高考真题练习

2020-2024年高考作文真题库：
- 真题讲解和审题指导
- 3种写作思路
- 满分作文结构
- 推荐素材

### 7. 数据管理

支持自定义管理数据库：
- 作文题目（添加/删除/批量导入/导出）
- 素材库（添加/删除/搜索/批量导入/导出）
- 范文库（添加/查看/删除/批量导入/导出）
- 评分标准（添加/删除）

---

## 项目结构

```
essay-assistant/
├── app.py              # Flask后端主程序
├── ai_service.py       # 通用AI服务接口（支持8种服务商）
├── workflow.py         # 工作流引擎（8个核心工作流）
├── database.py         # SQLite数据库模块
├── gaokao_data.py      # 高考真题数据库
├── import_gaokao_data.py # 数据导入脚本
├── requirements.txt    # 依赖包列表
├── start.bat           # 一键启动脚本
├── README.md           # 项目说明文档
├── static/
│   ├── css/
│   │   └── style.css   # 现代化深色主题样式
│   └── js/
│       ├── main.js     # 主模块（页面导航、AI功能）
│       ├── providers.js # 供应商预设配置
│       ├── config.js   # 配置管理模块
│       └── db.js       # 数据库管理模块
├── templates/
│   └── index.html      # 主页面模板
└── data/
    └── essay_assistant.db  # SQLite数据库文件
```

---

## 技术架构

```
┌─────────────────────────────────────────────────────┐
│                    用户界面层                         │
│  HTML5 + CSS3 + JavaScript (响应式设计，深色主题)     │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                    后端服务层                         │
│  Flask (路由处理、API接口、会话管理)                  │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                   工作流引擎层                        │
│  EssayWorkflow (8个核心工作流)                        │
│  - 创作指导 / AI写作 / 作文分析 / 修改建议            │
│  - 智能评分 / 素材推荐 / 综合评价 / 真题练习          │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                   AI服务接口层                        │
│  AIServiceFactory (支持8种服务商)                     │
│  OpenAI / Claude / DeepSeek / Kimi / 智谱AI /        │
│  通义千问 / 小米MiMo / 硅基流动                       │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                   数据存储层                          │
│  SQLite数据库 (题目/素材/范文/评分标准)               │
└─────────────────────────────────────────────────────┘
```

---

## 更新日志

### v1.3.0 (2026-06-13)

**新功能：**
- ✨ 新增AI写作成文功能，输入题目直接生成完整作文
- ✨ 支持设置文体、目标分数、字数、补充要求
- ✨ 生成后可一键跳转分析页面

**修复：**
- 🐛 修复高考真题界面点击无响应问题
- 🐛 修复JS文件加载顺序导致配置无法读取
- 🐛 增加API请求超时时间至120秒

### v1.2.0 (2026-06-13)

**新功能：**
- ✨ 完全仿照cc-switch重写API配置模块
- ✨ 卡片式供应商选择界面
- ✨ 支持自定义模型输入（input+datalist）
- ✨ 模型芯片标签，点击快速选择
- ✨ 新增小米MiMo官方API支持（mimo-v2.5-pro）

**改进：**
- 🔧 更新所有模型列表至2026最新版本
- 🔧 添加清除配置按钮
- 🔧 优化连接状态显示

### v1.1.0 (2026-06-12)

**新功能：**
- ✨ 添加SQLite数据库管理系统
- ✨ 支持作文题目、素材、范文、评分标准的增删改查
- ✨ 支持批量导入和导出
- ✨ 添加高考真题练习功能（2020-2024年）
- ✨ 导入18道高考真题、36条素材、8篇范文

**改进：**
- 🔧 优化作文评分工作流，严格按高考标准评分
- 🔧 优化作文生成工作流，增加满分作文结构参考

### v1.0.0 (2026-06-11)

**初始版本：**
- ✨ 作文创作指导功能
- ✨ 作文智能分析功能
- ✨ 作文修改建议功能
- ✨ 作文智能评分功能
- ✨ 素材推荐功能
- ✨ 支持6种AI服务提供商
- ✨ 现代化深色主题界面

---

## 许可证

本项目仅供学习和参赛使用。

---

## 联系方式

- GitHub: https://github.com/DING-HAO-RAN/essay-assistant

---

---

# English Version

## Overview

AI Essay Assistant is an AI-powered Chinese essay writing system for high school students. It provides professional writing guidance, AI essay generation, intelligent analysis, revision suggestions, and automatic scoring based on the National College Entrance Exam (Gaokao) standards.

### Core Features

- **Writing Guidance**: Get writing ideas, material recommendations, and outline suggestions
- **AI Writing**: Generate a complete high-scoring essay from a topic and requirements ✨NEW
- **Essay Analysis**: Multi-dimensional analysis of structure, language, content, and rhetoric
- **Smart Scoring**: Simulate Gaokao scoring standards with detailed comments
- **Material Recommendations**: Smart recommendations of quotes, historical examples, and current events
- **Gaokao Practice**: 2020-2024 Gaokao essay topic database with detailed guidance
- **Data Management**: Custom management of topics, materials, essays, and scoring standards

### Supported AI Providers

| Provider | Models | Base URL |
|----------|--------|----------|
| OpenAI | gpt-4.1, gpt-5, o3 | api.openai.com/v1 |
| Claude | claude-sonnet-4-6, claude-opus-4-8 | api.anthropic.com/v1 |
| DeepSeek | deepseek-chat, deepseek-reasoner | api.deepseek.com/v1 |
| Kimi | kimi-k2 | api.moonshot.cn/v1 |
| Zhipu AI | glm-4-plus, glm-4-flash | open.bigmodel.cn/api/paas/v4 |
| Qwen | qwen-max, qwen3-235b | dashscope.aliyuncs.com/.../v1 |
| **Xiaomi MiMo** | **mimo-v2.5-pro** | **mimo.mi.com/v1** |
| SiliconFlow | DeepSeek-V3, Qwen3 | api.siliconflow.cn/v1 |

### Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py

# Open in browser
# http://localhost:5000
```

### Configuration

1. Click ⚙️ Settings in the navigation bar
2. Select an AI provider card
3. Enter your API Key
4. Click "Test Connection"
5. Click "Save Configuration"

### Project Structure

```
essay-assistant/
├── app.py              # Flask backend
├── ai_service.py       # Universal AI service interface
├── workflow.py         # Workflow engine (8 workflows)
├── database.py         # SQLite database module
├── gaokao_data.py      # Gaokao exam data
├── static/
│   ├── css/style.css   # Dark theme styles
│   └── js/
│       ├── main.js     # Main module
│       ├── providers.js # Provider presets
│       ├── config.js   # Config management
│       └── db.js       # Database management
├── templates/
│   └── index.html      # Main page template
└── data/
    └── essay_assistant.db  # SQLite database
```

### Changelog

#### v1.3.0 (2026-06-13)
- NEW: AI essay generation feature
- FIX: Gaokao page click events not responding
- FIX: JS loading order causing config read failure
- FIX: Increase API timeout to 120 seconds

#### v1.2.0 (2026-06-13)
- NEW: Redesigned API config UI (card-based provider selection)
- NEW: Custom model input support
- NEW: Xiaomi MiMo official API support (mimo-v2.5-pro)
- UPDATE: All model lists updated to 2026 latest versions

#### v1.1.0 (2026-06-12)
- NEW: SQLite database management system
- NEW: Gaokao practice feature (2020-2024)
- NEW: Import 18 Gaokao topics, 36 materials, 8 sample essays

#### v1.0.0 (2026-06-11)
- Initial release
- Writing guidance, analysis, scoring, material recommendations
- Support for 6 AI providers
- Modern dark theme UI

---

### License

This project is for learning and competition use only.

### Links

- GitHub: https://github.com/DING-HAO-RAN/essay-assistant

"""
==============================================================================
AI服务接口模块 - 通用AI服务调用层
==============================================================================

本模块是整个系统的AI调用核心，负责：
1. 定义统一的AI服务接口（抽象基类）
2. 实现多种AI服务提供商的具体调用（OpenAI、Claude等）
3. 提供工厂模式，方便创建不同的AI服务实例
4. 支持流式输出（Streaming）

设计模式：工厂模式 + 策略模式
- 工厂模式：通过AIServiceFactory根据provider创建对应的AI服务实例
- 策略模式：不同的AI服务提供商实现相同的接口，可以互相替换

支持的AI服务提供商：
- OpenAI（GPT系列）
- Claude（Anthropic）
- DeepSeek（深度求索）
- Moonshot（月之暗面/Kimi）
- 智谱AI（GLM系列）
- 通义千问（阿里云）
- 任何兼容OpenAI格式的自定义服务

作者：ding-hao-ran
==============================================================================
"""

import requests      # 用于发送HTTP请求
import json          # 用于处理JSON数据
from typing import Optional, Dict, Any, List  # 类型注解
from abc import ABC, abstractmethod  # 抽象基类


# ============================================
# 抽象基类 - 定义AI服务的统一接口
# ============================================

class BaseAIService(ABC):
    """
    AI服务抽象基类

    所有AI服务提供商都必须继承这个类，并实现其中的抽象方法。
    这样做的好处是：上层代码只需要针对这个基类编程，而不需要关心
    具体使用的是哪个AI服务提供商。

    属性：
        api_key: API密钥，用于身份验证
        base_url: API基础地址
        model: 使用的模型名称
    """

    def __init__(self, api_key: str, base_url: str, model: str):
        """
        初始化AI服务

        参数：
            api_key: API密钥（必需）
            base_url: API基础地址（如 https://api.openai.com/v1）
            model: 模型名称（如 gpt-3.5-turbo）
        """
        self.api_key = api_key
        self.base_url = base_url
        self.model = model

    @abstractmethod
    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7,
             max_tokens: int = 2000) -> str:
        """
        发送对话请求（抽象方法，子类必须实现）

        参数：
            messages: 对话消息列表，格式为 [{"role": "user", "content": "..."}]
            temperature: 温度参数（0-1），控制回复的随机性
                - 0：回复最确定、最保守
                - 1：回复最随机、最有创意
            max_tokens: 最大生成token数

        返回值：AI的回复文本
        """
        pass

    @abstractmethod
    def chat_stream(self, messages: List[Dict[str, str]], temperature: float = 0.7,
                    max_tokens: int = 2000):
        """
        流式对话请求（抽象方法，子类必须实现）

        与chat()的区别：
        - chat()：等待AI完全生成后一次性返回
        - chat_stream()：AI一边生成一边返回（像打字一样逐字显示）

        返回值：生成器，逐个yield AI回复的片段
        """
        pass


# ============================================
# OpenAI兼容服务实现
# ============================================

class OpenAIService(BaseAIService):
    """
    OpenAI兼容服务类

    不仅支持OpenAI官方API，还支持所有兼容OpenAI格式的第三方服务：
    - DeepSeek（深度求索）
    - Moonshot（月之暗面/Kimi）
    - 智谱AI（GLM）
    - 通义千问（阿里云）
    - 以及其他任何兼容OpenAI格式的服务

    这是因为大多数国内AI服务都采用了与OpenAI兼容的API格式，
    所以只需要实现一次，就能支持多个服务商。
    """

    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1",
                 model: str = "gpt-3.5-turbo"):
        """
        初始化OpenAI兼容服务

        参数：
            api_key: API密钥
            base_url: API地址（默认为OpenAI官方地址）
            model: 模型名称（默认为gpt-3.5-turbo）
        """
        super().__init__(api_key, base_url, model)

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7,
             max_tokens: int = 2000) -> str:
        """
        发送对话请求（非流式）

        实现原理：
        1. 构建请求头（包含API密钥）
        2. 构建请求体（模型、消息、参数等）
        3. 发送POST请求到 /chat/completions 端点
        4. 解析响应，提取AI回复内容

        参数：
            messages: 对话消息列表
            temperature: 温度参数
            max_tokens: 最大token数

        返回值：AI的回复文本
        """
        # 构建请求头
        headers = {
            "Authorization": f"Bearer {self.api_key}",  # Bearer认证
            "Content-Type": "application/json"           # JSON格式
        }

        # 构建请求体
        data = {
            "model": self.model,           # 使用的模型
            "messages": messages,          # 对话消息
            "temperature": temperature,    # 温度参数
            "max_tokens": max_tokens       # 最大token数
        }

        try:
            # 发送POST请求
            response = requests.post(
                f"{self.base_url}/chat/completions",  # API端点
                headers=headers,                       # 请求头
                json=data,                             # 请求体（自动序列化为JSON）
                timeout=60                             # 超时时间（秒）
            )

            # 检查响应状态码（如果不是2xx，会抛出异常）
            response.raise_for_status()

            # 解析JSON响应
            result = response.json()

            # 提取AI回复内容
            # 响应格式：{"choices": [{"message": {"content": "回复内容"}}]}
            return result["choices"][0]["message"]["content"]

        except requests.exceptions.RequestException as e:
            # 网络请求异常
            raise Exception(f"API请求失败: {str(e)}")
        except (KeyError, IndexError) as e:
            # 响应格式解析异常
            raise Exception(f"API响应解析失败: {str(e)}")

    def chat_stream(self, messages: List[Dict[str, str]], temperature: float = 0.7,
                    max_tokens: int = 2000):
        """
        流式对话请求

        实现原理：
        1. 在请求体中添加 "stream": True
        2. 服务器会以SSE（Server-Sent Events）格式逐步返回数据
        3. 逐行读取并解析数据
        4. 使用yield逐个返回AI回复的片段

        SSE数据格式：
            data: {"choices": [{"delta": {"content": "你"}}]}
            data: {"choices": [{"delta": {"content": "好"}}]}
            data: [DONE]

        返回值：生成器，逐个yield文本片段
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True  # 关键：启用流式输出
        }

        try:
            # 发送请求，stream=True表示流式接收响应
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                stream=True,  # 流式接收
                timeout=60
            )
            response.raise_for_status()

            # 逐行处理SSE数据
            for line in response.iter_lines():
                if line:
                    # 解码字节为字符串
                    line = line.decode('utf-8')

                    # SSE格式：以 "data: " 开头
                    if line.startswith('data: '):
                        line = line[6:]  # 去掉 "data: " 前缀

                        # "[DONE]" 表示流式输出结束
                        if line.strip() == '[DONE]':
                            break

                        try:
                            # 解析JSON数据
                            chunk = json.loads(line)

                            # 提取文本片段
                            content = chunk["choices"][0]["delta"].get("content", "")

                            # 如果有内容，yield返回
                            if content:
                                yield content

                        except json.JSONDecodeError:
                            # JSON解析失败，跳过这一行
                            continue

        except requests.exceptions.RequestException as e:
            raise Exception(f"API流式请求失败: {str(e)}")


# ============================================
# Claude服务实现
# ============================================

class ClaudeService(BaseAIService):
    """
    Claude AI服务类

    Claude是Anthropic公司的AI助手，其API格式与OpenAI不同：
    - 使用 "x-api-key" 而不是 "Authorization: Bearer"
    - 消息格式略有不同
    - 系统提示词单独传递
    - 使用 "anthropic-version" 头指定API版本
    """

    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        """
        初始化Claude服务

        参数：
            api_key: Anthropic API密钥
            model: 模型名称（默认为claude-3-sonnet）
        """
        super().__init__(api_key, "https://api.anthropic.com/v1", model)

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7,
             max_tokens: int = 2000) -> str:
        """
        发送对话请求到Claude API

        Claude API的特殊之处：
        1. 系统提示词（system）需要单独传递，不放在messages中
        2. 使用 "x-api-key" 头传递API密钥
        3. 需要指定 "anthropic-version" 头
        """
        # Claude特有的请求头
        headers = {
            "x-api-key": self.api_key,                    # API密钥
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"             # API版本
        }

        # 转换消息格式
        # Claude需要将system消息单独提取出来
        claude_messages = []
        system_prompt = ""

        for msg in messages:
            if msg["role"] == "system":
                # 系统消息单独保存
                system_prompt = msg["content"]
            else:
                # 用户和助手消息直接添加
                claude_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        # 构建请求体
        data = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": claude_messages
        }

        # 如果有系统提示词，添加到请求体中
        if system_prompt:
            data["system"] = system_prompt

        try:
            # 发送请求到Claude的messages端点
            response = requests.post(
                f"{self.base_url}/messages",
                headers=headers,
                json=data,
                timeout=60
            )
            response.raise_for_status()

            # 解析响应
            result = response.json()

            # Claude的响应格式：{"content": [{"text": "回复内容"}]}
            return result["content"][0]["text"]

        except requests.exceptions.RequestException as e:
            raise Exception(f"Claude API请求失败: {str(e)}")
        except (KeyError, IndexError) as e:
            raise Exception(f"Claude API响应解析失败: {str(e)}")

    def chat_stream(self, messages: List[Dict[str, str]], temperature: float = 0.7,
                    max_tokens: int = 2000):
        """
        Claude流式对话请求

        Claude的流式输出格式与OpenAI不同：
        - 使用 "type" 字段区分事件类型
        - "content_block_delta" 事件包含实际的文本内容
        """
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        claude_messages = []
        system_prompt = ""

        for msg in messages:
            if msg["role"] == "system":
                system_prompt = msg["content"]
            else:
                claude_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        data = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": claude_messages,
            "stream": True
        }

        if system_prompt:
            data["system"] = system_prompt

        try:
            response = requests.post(
                f"{self.base_url}/messages",
                headers=headers,
                json=data,
                stream=True,
                timeout=60
            )
            response.raise_for_status()

            # 处理Claude的流式响应
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')

                    if line.startswith('data: '):
                        line = line[6:]

                        try:
                            event = json.loads(line)

                            # Claude的流式事件类型
                            if event["type"] == "content_block_delta":
                                content = event["delta"].get("text", "")
                                if content:
                                    yield content

                        except json.JSONDecodeError:
                            continue

        except requests.exceptions.RequestException as e:
            raise Exception(f"Claude API流式请求失败: {str(e)}")


# ============================================
# AI服务工厂类
# ============================================

class AIServiceFactory:
    """
    AI服务工厂类

    使用工厂模式，根据用户选择的服务提供商创建对应的AI服务实例。
    这样做的好处是：
    1. 上层代码不需要知道具体的AI服务实现细节
    2. 只需要传入provider名称，就能获得对应的AI服务实例
    3. 添加新的AI服务提供商只需要在这里注册即可

    使用示例：
        service = AIServiceFactory.create_service(
            provider="openai",
            api_key="sk-xxx",
            model="gpt-3.5-turbo"
        )
        result = service.chat([{"role": "user", "content": "你好"}])
    """

    @staticmethod
    def create_service(provider: str, api_key: str, **kwargs) -> BaseAIService:
        """
        创建AI服务实例（静态方法）

        参数：
            provider: 服务提供商名称（不区分大小写）
                - "openai"：OpenAI GPT系列
                - "claude"：Anthropic Claude
                - "deepseek"：深度求索
                - "moonshot"：月之暗面/Kimi
                - "zhipu"：智谱AI GLM系列
                - "qwen"：通义千问
                - "mimo"：小米MiMo（通过硅基流动等平台）
                - "custom"：自定义OpenAI兼容服务
            api_key: API密钥
            **kwargs: 其他可选参数
                - base_url: 自定义API地址
                - model: 模型名称

        返回值：AI服务实例

        异常：ValueError - 如果provider不支持
        """
        # 转换为小写，方便匹配
        provider = provider.lower()

        # 根据provider创建对应的AI服务实例
        if provider == "openai":
            # OpenAI官方服务
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://api.openai.com/v1"),
                model=kwargs.get("model", "gpt-3.5-turbo")
            )

        elif provider == "claude":
            # Anthropic Claude服务
            return ClaudeService(
                api_key=api_key,
                model=kwargs.get("model", "claude-3-sonnet-20240229")
            )

        elif provider == "deepseek":
            # DeepSeek服务（兼容OpenAI格式）
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://api.deepseek.com/v1"),
                model=kwargs.get("model", "deepseek-chat")
            )

        elif provider == "moonshot":
            # Moonshot/Kimi服务（兼容OpenAI格式）
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://api.moonshot.cn/v1"),
                model=kwargs.get("model", "moonshot-v1-8k")
            )

        elif provider == "zhipu":
            # 智谱AI GLM服务（兼容OpenAI格式）
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://open.bigmodel.cn/api/paas/v4"),
                model=kwargs.get("model", "glm-4")
            )

        elif provider == "qwen":
            # 通义千问服务（兼容OpenAI格式）
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
                model=kwargs.get("model", "qwen-turbo")
            )

        elif provider == "mimo":
            # 小米MiMo服务（通过硅基流动等平台调用，兼容OpenAI格式）
            # 支持token-plan计费模式
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://api.siliconflow.cn/v1"),
                model=kwargs.get("model", "MiMo-7B-RL")
            )

        elif provider == "custom":
            # 自定义OpenAI兼容服务
            if "base_url" not in kwargs:
                raise ValueError("自定义服务必须提供base_url参数")
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs["base_url"],
                model=kwargs.get("model", "default")
            )

        else:
            # 不支持的服务提供商
            raise ValueError(f"不支持的服务提供商: {provider}")


# ============================================
# 服务提供商配置信息
# ============================================

# 这个字典存储了所有支持的服务提供商的配置信息
# 用于前端展示服务商列表和默认配置
PROVIDER_CONFIGS = {
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
        "default_model": "gpt-3.5-turbo"
    },
    "claude": {
        "name": "Claude",
        "base_url": "https://api.anthropic.com/v1",
        "models": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
        "default_model": "claude-3-sonnet-20240229"
    },
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "models": ["deepseek-chat", "deepseek-coder"],
        "default_model": "deepseek-chat"
    },
    "moonshot": {
        "name": "Moonshot (Kimi)",
        "base_url": "https://api.moonshot.cn/v1",
        "models": ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
        "default_model": "moonshot-v1-8k"
    },
    "zhipu": {
        "name": "智谱AI (GLM)",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "models": ["glm-4", "glm-4-flash", "glm-3-turbo"],
        "default_model": "glm-4-flash"
    },
    "qwen": {
        "name": "通义千问",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "models": ["qwen-turbo", "qwen-plus", "qwen-max"],
        "default_model": "qwen-turbo"
    },
    "mimo": {
        "name": "小米MiMo (token-plan)",
        "base_url": "https://api.siliconflow.cn/v1",
        "models": ["MiMo-7B-RL", "MiMo-7B-Base"],
        "default_model": "MiMo-7B-RL"
    }
}


def get_provider_list() -> List[Dict[str, Any]]:
    """
    获取支持的服务提供商列表

    返回值：包含所有服务商信息的列表，每个元素包含：
        - id: 服务商ID（如 "openai"）
        - name: 显示名称（如 "OpenAI"）
        - models: 支持的模型列表
        - default_model: 默认模型

    用于前端的服务商选择下拉框
    """
    providers = []
    for key, config in PROVIDER_CONFIGS.items():
        providers.append({
            "id": key,
            "name": config["name"],
            "models": config["models"],
            "default_model": config["default_model"]
        })
    return providers

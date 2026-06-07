"""
通用AI服务接口
支持多种AI服务提供商：OpenAI、Claude、以及其他兼容OpenAI格式的服务
"""

import requests
import json
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod


class BaseAIService(ABC):
    """AI服务基类"""

    def __init__(self, api_key: str, base_url: str, model: str):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model

    @abstractmethod
    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7,
             max_tokens: int = 2000) -> str:
        """发送对话请求"""
        pass

    @abstractmethod
    def chat_stream(self, messages: List[Dict[str, str]], temperature: float = 0.7,
                    max_tokens: int = 2000):
        """流式对话请求"""
        pass


class OpenAIService(BaseAIService):
    """OpenAI兼容服务（支持OpenAI、DeepSeek、Moonshot等）"""

    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1",
                 model: str = "gpt-3.5-turbo"):
        super().__init__(api_key, base_url, model)

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7,
             max_tokens: int = 2000) -> str:
        """发送对话请求"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=60
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except requests.exceptions.RequestException as e:
            raise Exception(f"API请求失败: {str(e)}")
        except (KeyError, IndexError) as e:
            raise Exception(f"API响应解析失败: {str(e)}")

    def chat_stream(self, messages: List[Dict[str, str]], temperature: float = 0.7,
                    max_tokens: int = 2000):
        """流式对话请求"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                stream=True,
                timeout=60
            )
            response.raise_for_status()

            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        line = line[6:]
                        if line.strip() == '[DONE]':
                            break
                        try:
                            chunk = json.loads(line)
                            content = chunk["choices"][0]["delta"].get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
        except requests.exceptions.RequestException as e:
            raise Exception(f"API流式请求失败: {str(e)}")


class ClaudeService(BaseAIService):
    """Claude AI服务"""

    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        super().__init__(api_key, "https://api.anthropic.com/v1", model)

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7,
             max_tokens: int = 2000) -> str:
        """发送对话请求"""
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        # 转换消息格式
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
            "messages": claude_messages
        }

        if system_prompt:
            data["system"] = system_prompt

        try:
            response = requests.post(
                f"{self.base_url}/messages",
                headers=headers,
                json=data,
                timeout=60
            )
            response.raise_for_status()
            result = response.json()
            return result["content"][0]["text"]
        except requests.exceptions.RequestException as e:
            raise Exception(f"Claude API请求失败: {str(e)}")
        except (KeyError, IndexError) as e:
            raise Exception(f"Claude API响应解析失败: {str(e)}")

    def chat_stream(self, messages: List[Dict[str, str]], temperature: float = 0.7,
                    max_tokens: int = 2000):
        """流式对话请求"""
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

            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        line = line[6:]
                        try:
                            event = json.loads(line)
                            if event["type"] == "content_block_delta":
                                content = event["delta"].get("text", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
        except requests.exceptions.RequestException as e:
            raise Exception(f"Claude API流式请求失败: {str(e)}")


class AIServiceFactory:
    """AI服务工厂"""

    @staticmethod
    def create_service(provider: str, api_key: str, **kwargs) -> BaseAIService:
        """
        创建AI服务实例

        Args:
            provider: 服务提供商名称 ('openai', 'claude', 'deepseek', 'moonshot', etc.)
            api_key: API密钥
            **kwargs: 其他参数（base_url, model等）

        Returns:
            AI服务实例
        """
        provider = provider.lower()

        if provider == "openai":
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://api.openai.com/v1"),
                model=kwargs.get("model", "gpt-3.5-turbo")
            )

        elif provider == "claude":
            return ClaudeService(
                api_key=api_key,
                model=kwargs.get("model", "claude-3-sonnet-20240229")
            )

        elif provider == "deepseek":
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://api.deepseek.com/v1"),
                model=kwargs.get("model", "deepseek-chat")
            )

        elif provider == "moonshot":
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://api.moonshot.cn/v1"),
                model=kwargs.get("model", "moonshot-v1-8k")
            )

        elif provider == "zhipu":
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://open.bigmodel.cn/api/paas/v4"),
                model=kwargs.get("model", "glm-4")
            )

        elif provider == "qwen":
            return OpenAIService(
                api_key=api_key,
                base_url=kwargs.get("base_url", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
                model=kwargs.get("model", "qwen-turbo")
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
            raise ValueError(f"不支持的服务提供商: {provider}")


# 预设的服务提供商配置
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
    }
}


def get_provider_list() -> List[Dict[str, Any]]:
    """获取支持的服务提供商列表"""
    providers = []
    for key, config in PROVIDER_CONFIGS.items():
        providers.append({
            "id": key,
            "name": config["name"],
            "models": config["models"],
            "default_model": config["default_model"]
        })
    return providers

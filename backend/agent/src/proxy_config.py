# src/proxy_config.py

import os
import random
import httpx
from typing import Optional, Dict, Any
import logging

# Set up logging
logger = logging.getLogger(__name__)

class WebshareProxyManager:
    """
    Manages webshare rotating residential proxy configuration for API requests.
    """
    
    def __init__(self):
        self.webshare_username = os.getenv("WEBSHARE_USERNAME")
        self.webshare_password = os.getenv("WEBSHARE_PASSWORD")
        self.webshare_endpoint = os.getenv("WEBSHARE_ENDPOINT", "rotating-residential.webshare.io:9000")
        self.proxy_enabled = os.getenv("USE_WEBSHARE_PROXY", "false").lower() == "true"
        
        if self.proxy_enabled and not (self.webshare_username and self.webshare_password):
            logger.warning("Webshare proxy is enabled but credentials are missing. Disabling proxy.")
            self.proxy_enabled = False
    
    def get_proxy_config(self) -> Optional[Dict[str, str]]:
        """
        Returns proxy configuration for httpx client.
        """
        if not self.proxy_enabled:
            return None
        
        proxy_url = f"http://{self.webshare_username}:{self.webshare_password}@{self.webshare_endpoint}"
        
        return {
            "http://": proxy_url,
            "https://": proxy_url
        }
    
    def create_httpx_client(self, **kwargs) -> httpx.Client:
        """
        Creates an httpx client with proxy configuration.
        """
        client_kwargs = kwargs.copy()
        
        if self.proxy_enabled:
            proxy_config = self.get_proxy_config()
            if proxy_config:
                # httpx uses 'proxy' (singular) parameter
                proxy_url = proxy_config["https://"]  # Use https proxy URL
                client_kwargs["proxy"] = proxy_url
                logger.info(f"Creating httpx client with webshare proxy: {self.webshare_endpoint}")
            else:
                logger.warning("Proxy enabled but configuration invalid")
        else:
            logger.info("Creating httpx client without proxy")
        
        # Set default timeout if not provided
        if "timeout" not in client_kwargs:
            client_kwargs["timeout"] = httpx.Timeout(30.0)
        
        return httpx.Client(**client_kwargs)
    
    def create_async_httpx_client(self, **kwargs) -> httpx.AsyncClient:
        """
        Creates an async httpx client with proxy configuration.
        """
        client_kwargs = kwargs.copy()
        
        if self.proxy_enabled:
            proxy_config = self.get_proxy_config()
            if proxy_config:
                # httpx uses 'proxy' (singular) parameter
                proxy_url = proxy_config["https://"]  # Use https proxy URL
                client_kwargs["proxy"] = proxy_url
                logger.info(f"Creating async httpx client with webshare proxy: {self.webshare_endpoint}")
            else:
                logger.warning("Proxy enabled but configuration invalid")
        else:
            logger.info("Creating async httpx client without proxy")
        
        # Set default timeout if not provided
        if "timeout" not in client_kwargs:
            client_kwargs["timeout"] = httpx.Timeout(30.0)
        
        return httpx.AsyncClient(**client_kwargs)

# Global instance
proxy_manager = WebshareProxyManager()

def get_proxy_manager() -> WebshareProxyManager:
    """
    Returns the global proxy manager instance.
    """
    return proxy_manager

def create_groq_compatible_client() -> httpx.Client:
    """
    Creates an httpx client specifically configured for Groq API requests.
    """
    return proxy_manager.create_httpx_client(
        headers={
            "User-Agent": "stella-agent/1.0.0",
        }
    )

def create_requests_session_with_proxy():
    """
    Creates a requests session with webshare proxy configuration.
    Useful for other API calls in the application.
    """
    import requests
    
    session = requests.Session()
    
    if proxy_manager.proxy_enabled:
        proxy_config = proxy_manager.get_proxy_config()
        if proxy_config:
            # Convert httpx proxy format to requests format
            session.proxies = {
                "http": proxy_config["http://"],
                "https": proxy_config["https://"]
            }
            logger.info(f"Created requests session with webshare proxy: {proxy_manager.webshare_endpoint}")
    
    return session

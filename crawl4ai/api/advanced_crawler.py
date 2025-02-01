from playwright.async_api import async_playwright, Browser, Page
from bs4 import BeautifulSoup
import json
import logging
import aiohttp
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedCrawler:
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context = None
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
        ]
        self.current_user_agent = 0

    async def init_browser(self):
        """Initialize the browser with stealth settings"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        self.context = await self.browser.new_context(
            user_agent=self._get_next_user_agent(),
            viewport={'width': 1920, 'height': 1080},
            java_script_enabled=True
        )

    async def close(self):
        """Clean up resources"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()

    def _get_next_user_agent(self) -> str:
        """Rotate through user agents"""
        agent = self.user_agents[self.current_user_agent]
        self.current_user_agent = (self.current_user_agent + 1) % len(self.user_agents)
        return agent

    async def _log_network_requests(self, route):
        """Log and analyze network requests"""
        request = route.request
        if request.resource_type in ['script', 'xhr', 'fetch']:
            logger.info(f"Network request: {request.url}")
        await route.continue_()

    async def _gather_performance_metrics(self, page: Page) -> Dict:
        """Collect page performance metrics"""
        metrics = await page.evaluate("""() => {
            const performance = window.performance;
            const timing = performance.timing;
            return {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
                resourceCount: performance.getEntriesByType('resource').length
            }
        }""")
        return metrics

    async def _analyze_security(self, page: Page) -> Dict:
        """Analyze page security aspects"""
        security_info = await page.evaluate("""() => {
            return {
                thirdPartyScripts: Array.from(document.scripts)
                    .filter(script => script.src)
                    .map(script => script.src),
                forms: Array.from(document.forms)
                    .map(form => ({
                        action: form.action,
                        method: form.method,
                        hasPassword: Boolean(form.querySelector('input[type="password"]'))
                    }))
            }
        }""")
        return security_info

    async def _extract_schema_data(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract Schema.org structured data"""
        schema_tags = soup.find_all('script', type='application/ld+json')
        schemas = []
        for tag in schema_tags:
            try:
                schemas.append(json.loads(tag.string))
            except json.JSONDecodeError:
                logger.warning("Failed to parse schema.org data")
        return schemas

    async def crawl(self, url: str, mode: str, options: Dict = None) -> Dict:
        """Main crawling method with different modes"""
        if not self.context:
            await self.init_browser()

        page = await self.context.new_page()
        await page.route('**/*', self._log_network_requests)

        try:
            response = await page.goto(url, wait_until='networkidle', timeout=30000)
            
            if not response.ok:
                raise Exception(f"Failed to load page: {response.status}")

            result = {
                'url': url,
                'timestamp': datetime.utcnow().isoformat(),
                'status_code': response.status,
                'headers': dict(response.headers)
            }

            if mode == 'headless':
                content = await page.content()
                result.update({
                    'content': content,
                    'screenshot': await page.screenshot(type='jpeg', quality=80),
                    'performance': await self._gather_performance_metrics(page),
                    'security': await self._analyze_security(page)
                })

            elif mode == 'structured':
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                result.update({
                    'schema_org': await self._extract_schema_data(soup),
                    'meta_tags': {
                        tag['name']: tag['content']
                        for tag in soup.find_all('meta', attrs={'name': True, 'content': True})
                    },
                    'open_graph': {
                        tag['property'][3:]: tag['content']
                        for tag in soup.find_all('meta', property=lambda x: x and x.startswith('og:'))
                    }
                })

            elif mode == 'api_discovery':
                # Intercept and analyze network requests
                api_calls = []
                async def handle_request(request):
                    if request.resource_type in ['xhr', 'fetch']:
                        api_calls.append({
                            'url': request.url,
                            'method': request.method,
                            'headers': request.headers
                        })
                    await request.continue_()
                
                await page.route('**/*', handle_request)
                await page.reload(wait_until='networkidle')
                result['api_endpoints'] = api_calls

            return result

        except Exception as e:
            logger.error(f"Crawling error: {str(e)}")
            raise
        finally:
            await page.close()

    async def validate_url(self, url: str) -> bool:
        """Validate URL and check robots.txt"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{url}/robots.txt") as response:
                    if response.status == 200:
                        robots_txt = await response.text()
                        # Basic robots.txt check
                        if 'Disallow: /' in robots_txt:
                            return False
            return True
        except:
            return True  # Assume allowed if robots.txt is not available

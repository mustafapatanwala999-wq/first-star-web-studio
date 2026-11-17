import asyncio,pathlib
from playwright.async_api import async_playwright
async def main():
    root=pathlib.Path(__file__).resolve().parents[1]
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for w,h,n in [(1440,900,'desk'),(390,844,'phone')]:
            pg=await b.new_page(viewport={'width':w,'height':h})
            await pg.goto((root/'index.html').as_uri()); await pg.wait_for_timeout(6500)
            await pg.evaluate("document.querySelector('#ai').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(1500)
            await pg.click('#aiChips button'); await pg.wait_for_timeout(900)
            await pg.screenshot(path=str(root/f'_review/ai-{n}.png'))
        await b.close()
asyncio.run(main())

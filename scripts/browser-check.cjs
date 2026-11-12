// Optional browser checks. See docs/qa.md for setup.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const vm = require('vm');
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  const baseline = {window:{}};vm.runInNewContext(fs.readFileSync('content.js','utf8'),baseline);
  const original = baseline.window.PAPER_TABS;
  fs.mkdirSync('.local', {recursive:true});
  const report = [];
  const sizes = [[1440,900],[1280,720],[768,1024],[390,844],[320,640]];
  for (const size of sizes) {
    const page = await browser.newPage({viewport:{width:size[0],height:size[1]}});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto('http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);
    await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});
    await page.screenshot({path:`.local/default-${size[0]}.png`,fullPage:true});
    const state = await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,projects:document.querySelectorAll('.folder').length,stacked:document.querySelector('.work').classList.contains('stacked'),images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}));
    report.push({scenario:'default',size,state,errors});
    for (const count of [1,2,3,4,6,7,8]) {
      const data=JSON.parse(JSON.stringify(original));
      data.projects=Array.from({length:count},(_,i)=>({...original.projects[i%5],title:original.projects[i%5].title+' '+(i+1)}));
      data.decorations=[];data.socials=[];data.avatar='';data.experience=[];
      if(count===8){ data.projects[0].url='https://example.com/portfolio';data.email='hello@example.com';data.socials=[{label:'My work',url:'https://example.com'}];}
      await page.route('**/content.js',route=>route.fulfill({contentType:'application/javascript',body:'window.PAPER_TABS='+JSON.stringify(data)}));
      await page.reload();await page.waitForTimeout(100);
      report.push({scenario:`${count}-projects-optional-empty`,size,state:await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,projects:document.querySelectorAll('.folder').length,tabs:[...document.querySelectorAll('.project-tab')].map(x=>Math.round(x.getBoundingClientRect().width)),stacked:document.querySelector('.work').classList.contains('stacked')})),errors:[...errors]});
      if(count===8&&size[0]===1440){
        await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
        await page.locator('.project-tab').nth(2).scrollIntoViewIfNeeded(); await page.waitForTimeout(250);
        await page.locator('.project-tab').nth(2).click();
        if(await page.locator('.project-tab').nth(2).getAttribute('aria-pressed')!=='true')throw Error('Selection failed');
        await page.locator('.project-tab').nth(2).press('ArrowRight');
        if(await page.locator('.project-tab').nth(3).getAttribute('aria-pressed')!=='true')throw Error('Arrow selection failed');
        await page.keyboard.press('Escape');
        if(await page.locator('.is-selected').count())throw Error('Escape failed');
        await page.locator('.project-tab').nth(3).click();
        await page.evaluate(()=>window.scrollBy(0,100));await page.waitForTimeout(200);
        if(await page.locator('.is-selected').count())throw Error('Scroll reset failed');
      }
      await page.unroute('**/content.js');
    }
    for(const lang of ['zh','en']) {
      const data=JSON.parse(JSON.stringify(original));
      data.name=lang==='zh'?'一个名字很长的独立设计师':'Alexandra Montgomery';data.nameEn='';
      data.headline=lang==='zh'?'一些持续发生的设计实验':'DESIGN & EXPLORATION';
      data.intro=lang==='zh'?'持续观察生活，并把复杂的想法整理为清晰、友好且有趣的数字体验。'.repeat(5):'I design thoughtful digital experiences, independent publications, and little tools that make everyday life better. '.repeat(5);
      data.projects=data.projects.slice(0,3).map(p=>({...p,title:lang==='zh'?'城市生活与公共空间的长期观察和设计探索':'Designing thoughtful experiences for everyday communities',summary:data.intro,cover:lang==='zh'?p.cover:''}));
      await page.route('**/content.js',route=>route.fulfill({contentType:'application/javascript',body:'window.PAPER_TABS='+JSON.stringify(data)}));await page.reload();await page.waitForTimeout(100);
      const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,stacked:document.querySelector('.work').classList.contains('stacked'),clipped:[...document.querySelectorAll('h1,h3,.project-summary,.project-panel')].filter(e=>e.scrollHeight>e.clientHeight+2 && ['hidden','clip'].includes(getComputedStyle(e).overflowY)).map(e=>e.className)}));
      report.push({scenario:lang+'-long-text',size,state,errors:[...errors]});
      if(size[0]===390)await page.screenshot({path:`.local/long-${lang}-390.png`,fullPage:true});
      await page.unroute('**/content.js');
    }
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(100);report.push({scenario:'reduced-motion',state:await page.locator('.work').getAttribute('class')});
  await page.goto('file://'+process.cwd()+'/index.html');await page.waitForTimeout(100);report.push({scenario:'file-open',projects:await page.locator('.folder').count()});
  fs.writeFileSync('.local/qa-report.json',JSON.stringify(report,null,2));
  const failures=report.filter(r=>r.state?.overflow||r.state?.images?.length||r.state?.clipped?.length||r.errors?.length || (r.scenario.includes('-projects') && r.state.projects !== parseInt(r.scenario)));
  console.log(JSON.stringify({checks:report.length,failures},null,2));await browser.close();if(failures.length)process.exitCode=1;
})();

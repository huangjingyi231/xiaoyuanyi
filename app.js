/* Small DOM renderer; content stays in content.js, appearance in theme.css. */
(() => {
  'use strict';
  const root = document.querySelector('#site');
  const data = window.PAPER_TABS;
  if (!data || !Array.isArray(data.projects) || data.projects.length < 1 || data.projects.length > 8) {
    const message = document.createElement('p');
    message.className = 'fallback';
    message.textContent = '请检查 content.js：projects 需要包含 1–8 个项目。 / Please include 1–8 projects.';
    root.append(message);
    return;
  }
  const l = Object.assign({ home:'Home', work:'Selected work', about:'About & contact', contact:'Contact ↗', browse:'Explore my work', workNote:"a few things I've worked on", workHeading:'SELECTED WORK', projectCount:'projects', open:'View project', concept:'Concept · example', aboutHeading:'LET’S TALK', contactCaption:'say hello ↘', contactEmpty:'A little space for future connections.', resume:'Download portfolio ↓', top:'Back to top ↑', skip:'Skip to content' }, data.labels);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  // Restrict navigation protocols. Text is always inserted through textContent.
  function safeUrl(value, asset = false) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const parsed = new URL(value, location.href);
      const relative = !/^[a-z][a-z0-9+.-]*:|^\/\//i.test(value);
      if (asset && relative) return value;
      if (['https:', 'http:'].includes(parsed.protocol)) return parsed.href;
      if (!asset && parsed.protocol === 'mailto:') return parsed.href;
    } catch { /* An invalid optional URL is omitted. */ }
    return '';
  }
  function link(text, href, className, external = false) {
    const a = el('a', className, text);
    a.href = href;
    if (external && /^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }
  function picture(src, alt, className) {
    const img = el('img', className);
    img.src = src; img.alt = alt || ''; img.decoding = 'async';
    img.addEventListener('error', () => {
      if (className === 'cover') img.parentElement.classList.add('no-cover');
      if (img.parentElement.classList.contains('snapshot')) img.parentElement.hidden = true;
      img.hidden = true;
    });
    return img;
  }
  document.documentElement.lang = data.lang || 'zh-CN';
  document.title = data.title || data.name || 'Paper Tabs';
  document.querySelector('meta[name="description"]').content = data.description || '';
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
  root.append(link(l.skip, '#main', 'skip-link'));
  const header = el('header', 'header');
  const brand = link('', '#main', 'brand');
  const avatar = safeUrl(data.avatar, true);
  const stamp = avatar ? picture(avatar, '', 'avatar') : el('span', 'stamp', '✳');
  stamp.setAttribute('aria-hidden', 'true');
  brand.append(stamp, el('span', '', data.name), el('span', 'brand-en', data.nameEn));
  const nav = el('nav'); nav.setAttribute('aria-label', data.lang === 'zh-CN' ? '主导航' : 'Main navigation');
  nav.append(link(l.home, '#main'), link(l.work, '#work'), link(l.about, '#about'));
  header.append(brand, nav);
  const email = typeof data.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? data.email : '';
  if (email) header.append(link(l.contact, `mailto:${email}`, 'header-email'));
  root.append(header);
  const main = el('main'); main.id = 'main'; main.tabIndex = -1;
  const intro = el('section', 'intro wrap'); intro.setAttribute('aria-labelledby', 'intro-title');
  const collage = el('div', 'hero-collage');
  (data.decorations || []).slice(0, 2).forEach((decoration, i) => {
    const src = safeUrl(decoration.src, true);
    if (!src) return;
    const figure = el('figure', `snapshot${i ? ' snapshot-right' : ''}`); figure.setAttribute('aria-hidden', 'true');
    figure.append(picture(src, ''), el('figcaption', '', decoration.caption)); collage.append(figure);
  });
  const hero = el('div', 'hero-copy');
  const eyebrow = el('p', 'eyebrow', data.eyebrow); eyebrow.append(el('span', '', data.eyebrowEn));
  const title = el('h1'); title.id = 'intro-title';
  const headline = data.headline || 'PROFILE';
  const plate = el('span', `nameplate${headline.length > 9 || /[^\x00-\x7F]/.test(headline) ? ' long' : ''}`, headline);
  for (const corner of ['tl','tr','bl','br']) { const handle = el('span', `handle ${corner}`); handle.setAttribute('aria-hidden', 'true'); plate.append(handle); }
  title.append(plate);
  const labels = el('div', 'hero-labels');
  for (const value of [data.role, data.disciplines]) if (value) labels.append(el('span', '', value));
  const browse = link('', '#work', 'browse'); const down = el('span', '', '↓'); down.setAttribute('aria-hidden', 'true'); browse.append(down, document.createTextNode(l.browse));
  hero.append(eyebrow, title, labels, el('p', 'lead', data.intro), browse);
  collage.append(hero); intro.append(collage); main.append(intro);
  const work = el('section', 'work wrap'); work.id = 'work'; work.setAttribute('aria-labelledby', 'work-title');
  work.style.setProperty('--count', data.projects.length);
  const heading = el('div', 'section-heading'); const headingCopy = el('div');
  headingCopy.append(el('p', 'handwritten', l.workNote));
  const workTitle = el('h2'); workTitle.id = 'work-title';
  workTitle.append(el('span', 'pixel', l.workHeading), el('span', 'section-label', l.work));
  headingCopy.append(workTitle); heading.append(headingCopy, el('span', 'work-count', `${String(data.projects.length).padStart(2,'0')} / ${data.projects.length} ${l.projectCount}`));
  const stack = el('ul', 'stack');
  const colors = ['ink','yellow','blue','mint','lilac','pink','cream'];
  data.projects.forEach((project, i) => {
    const number = String(i + 1).padStart(2, '0');
    const item = el('li', 'stack-item'); item.style.setProperty('--index', i); item.style.setProperty('--layer', i + 1);
    if (i === 0) item.append(heading);
    const folder = el('article', `folder tone-${colors.includes(project.color) ? project.color : colors[i % colors.length]}`);
    folder.setAttribute('aria-labelledby', `project-title-${i}`);
    const button = el('button', 'project-tab'); button.type = 'button';
    button.setAttribute('aria-controls', `project-panel-${i}`); button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${number} · ${project.title}`);
    button.append(el('span', 'project-tab-prefix', 'PROJECT '), document.createTextNode(number));
    const panel = el('div', 'project-panel'); panel.id = `project-panel-${i}`;
    const copy = el('div', 'project-copy');
    const h3 = el('h3', '', project.title); h3.id = `project-title-${i}`;
    copy.append(el('p', 'project-index', `${number} / ${project.category || 'SELECTED WORK'}`), h3, el('p', 'project-summary', project.summary));
    if (Array.isArray(project.tags) && project.tags.length) {
      const tags = el('div', 'project-tags'); project.tags.forEach(tag => tags.append(el('span', '', tag))); copy.append(tags);
    }
    const url = safeUrl(project.url);
    if (url) {
      const open = link(l.open, url, 'project-open', true); const arrow = el('span', '', '↗'); arrow.setAttribute('aria-hidden','true'); open.append(arrow);
      open.setAttribute('aria-label', `${l.open}: ${project.title}`); copy.append(open);
    } else { copy.append(el('p', 'concept', l.concept)); }
    panel.append(copy);
    const cover = safeUrl(project.cover, true);
    if (cover) { const img = picture(cover, project.coverAlt, 'cover'); img.loading = i ? 'lazy' : 'eager'; panel.append(img); }
    else panel.classList.add('no-cover');
    folder.append(button, panel); item.append(folder); stack.append(item);
  });
  work.append(stack); main.append(work);
  const about = el('section', 'about wrap'); about.id = 'about'; about.setAttribute('aria-labelledby','about-title');
  const aboutHeading = el('div', 'section-heading'); const aboutTitle = el('h2'); aboutTitle.id = 'about-title';
  aboutTitle.append(el('span', 'pixel', l.aboutHeading), el('span', 'section-label', l.about)); aboutHeading.append(aboutTitle);
  const columns = el('div', 'about-columns'); const background = el('div'); background.append(el('p', 'about-text', data.about));
  if (Array.isArray(data.experience) && data.experience.length) {
    const experience = el('dl', 'experience');
    data.experience.forEach(row => { const entry = el('div'); const dd = el('dd', '', row.role); dd.append(el('span', '', row.period)); entry.append(el('dt', '', row.place), dd); experience.append(entry); });
    background.append(experience);
  }
  const contact = el('div', 'contact'); contact.id = 'contact';
  contact.append(el('span', 'contact-note', l.contactCaption), el('p', '', data.contactNote));
  if (email) contact.append(link(`${email} ↗`, `mailto:${email}`, 'contact-email'));
  const contactLinks = el('div', 'contact-links');
  for (const social of data.socials || []) { const url = safeUrl(social.url); if (url) contactLinks.append(link(`${social.label} ↗`, url, '', true)); }
  const resume = safeUrl(data.resume, true);
  if (resume) contactLinks.append(link(l.resume, resume));
  if (contactLinks.children.length) contact.append(contactLinks);
  else if (!email) contact.append(el('p', 'contact-empty', l.contactEmpty));
  columns.append(background, contact); about.append(aboutHeading, columns); main.append(about); root.append(main);
  const footer = el('footer', 'footer wrap'); footer.append(el('span', '', data.footer));
  if (data.credit !== false) footer.append(link('Made with Paper Tabs ↗', 'https://github.com/chingz0509/paper-tabs', 'credit', true));
  footer.append(link(l.top, '#main')); root.append(footer);

  // Use the original scroll-stack only when every full panel fits the viewport.
  // Long content, short screens, reduced motion, or narrow tabs get a flowing list.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = null;
  function clearSelection() {
    if (!selected) return;
    selected.classList.remove('is-selected'); selected.querySelector('button').setAttribute('aria-pressed', 'false'); selected = null;
  }
  function select(button) {
    clearSelection(); selected = button.closest('.stack-item'); selected.classList.add('is-selected'); button.setAttribute('aria-pressed', 'true');
  }
  stack.addEventListener('click', event => { const button = event.target.closest('.project-tab'); if (button) select(button); });
  stack.addEventListener('keydown', event => {
    if (event.key === 'Escape') { clearSelection(); return; }
    if (!event.target.matches('.project-tab')) return;
    const buttons = [...stack.querySelectorAll('.project-tab')]; let index = buttons.indexOf(event.target);
    if (event.key === 'ArrowRight') index = (index + 1) % buttons.length;
    else if (event.key === 'ArrowLeft') index = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = buttons.length - 1;
    else return;
    event.preventDefault(); buttons[index].focus({ preventScroll:work.classList.contains('stacked') }); select(buttons[index]);
  });
  window.addEventListener('scroll', clearSelection, { passive:true });
  let frame = 0;
  function scheduleLayout() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const height = Math.ceil(heading.getBoundingClientRect().height);
      work.style.setProperty('--heading-height', `${height}px`);
      const tallest = Math.max(...[...stack.querySelectorAll('.project-panel')].map(panel => panel.getBoundingClientRect().height));
      const top = parseFloat(getComputedStyle(work).getPropertyValue('--sticky-top'));
      const fits = tallest + height + 24 + 44 + top + 24 <= window.innerHeight;
      work.classList.toggle('stacked', fits && !reduced.matches && work.clientWidth / data.projects.length >= 48);
    });
  }
  if ('ResizeObserver' in window) { const observer = new ResizeObserver(scheduleLayout); observer.observe(work); observer.observe(heading); stack.querySelectorAll('.project-panel').forEach(panel => observer.observe(panel)); }
  window.addEventListener('resize', scheduleLayout, { passive:true }); reduced.addEventListener('change', scheduleLayout);
  document.fonts.ready.then(scheduleLayout); scheduleLayout();
})();

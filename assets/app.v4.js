
(function(){
  const qs = new URLSearchParams(location.search);
  const byId = id => document.getElementById(id);
  const el = {
    maps: byId('maps'), grid: byId('grid'), mapTitle: byId('mapTitle'), count: byId('countChip'),
    search: byId('search'), branch: byId('branch'), owner: byId('owner'), repo: byId('repo'),
    loadBtn: byId('loadBtn'), empty: byId('empty')
  };

  function detectRepository(){
    const u = new URL(location.href);
    const hostParts = u.hostname.split('.');
    const pathParts = u.pathname.replace(/^\//,'').split('/');
    let owner = qs.get('owner') || '';
    let repo = qs.get('repo') || '';
    let branch = qs.get('branch') || 'main';

    if(!owner && hostParts.length>=3 && hostParts[1]==='github' && hostParts[2]==='io'){
      owner = hostParts[0];
    }
    if(!repo && pathParts[0]) repo = pathParts[0];

    if (qs.get('owner')) owner = qs.get('owner');
    if (qs.get('repo')) repo = qs.get('repo');
    if (qs.get('branch')) branch = qs.get('branch');

    el.owner.value = owner || '';
    el.repo.value = repo || '';
    el.branch.value = branch;
  }
  detectRepository();

  const IMG_EXT = ['.jpg','.jpeg','.png','.webp','.gif'];
  const state = { maps: [], filesByMap: {}, activeMap: null, flatImages: [], flatIndex: 0 };

  function api(path){
    const owner = el.owner.value.trim();
    const repo = el.repo.value.trim();
    const branch = el.branch.value;
    if(!owner || !repo) throw new Error('Missing owner or repo');
    return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  }

  async function fetchJSON(url){
    const r = await fetch(url, { headers: { 'Accept':'application/vnd.github+json' } });
    if(!r.ok){
      const txt = await r.text();
      throw new Error(`GitHub API error ${r.status}: ${txt}`);
    }
    return r.json();
  }

  async function loadMaps(){
    el.maps.innerHTML = '<div class="hint">Loading maps…</div>';
    state.maps = []; state.filesByMap = {}; state.activeMap = null;
    try{
      const list = await fetchJSON(api('images'));
      const dirs = list.filter(x => x.type==='dir');
      state.maps = dirs.map(d=>d.name).sort((a,b)=>a.localeCompare(b));
      el.maps.innerHTML = '';
      if(state.maps.length===0){
        el.maps.innerHTML = '<div class="hint">No /images/ folders found</div>';
      }
      for (const m of state.maps){
        const btn = document.createElement('button');
        btn.className = 'map-btn';
        btn.innerHTML = `<span>${m}</span><span class="map-count" id="count-${m}">…</span>`;
        btn.addEventListener('click', ()=> selectMap(m));
        el.maps.appendChild(btn);
        fetchJSON(api(`images/${encodeURIComponent(m)}`)).then(files=>{
          const imgs = files.filter(f=>f.type==='file' && IMG_EXT.some(ext=>f.name.toLowerCase().endsWith(ext)));
          state.filesByMap[m] = imgs;
          const c = document.getElementById(`count-${m}`); if(c) c.textContent = String(imgs.length);
          if(!state.activeMap){ selectMap(m); }
        }).catch(()=>{ const c = document.getElementById(`count-${m}`); if(c) c.textContent = '0'; });
      }
    }catch(e){
      el.maps.innerHTML = `<div class="hint">${e.message}</div>`;
    }
  }

  function filterMaps(){
    const q = el.search.value.trim().toLowerCase();
    const buttons = el.maps.querySelectorAll('.map-btn');
    buttons.forEach(btn=>{
      const name = btn.textContent.toLowerCase();
      btn.style.display = name.includes(q) ? '' : 'none';
    });
  }

  function selectMap(name){
    state.activeMap = name;
    for(const b of el.maps.querySelectorAll('.map-btn')) b.classList.remove('active');
    const found = Array.from(el.maps.querySelectorAll('.map-btn')).find(b=>b.textContent.startsWith(name));
    if(found) found.classList.add('active');
    renderGrid();
    history.replaceState(null,'', `#/${encodeURIComponent(name)}`);
  }

  function renderGrid(){
    const files = state.filesByMap[state.activeMap] || [];
    el.mapTitle.textContent = state.activeMap || '';
    el.count.textContent = files.length ? `${files.length} images` : '';
    el.grid.innerHTML = '';
    el.empty.style.display = files.length ? 'none' : '';
    state.flatImages = files.map(f=>({ src: f.download_url, name: f.name }));
    state.flatIndex = 0;
    for(const f of files){
      const item = document.createElement('div');
      item.className = 'thumb';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = f.download_url;
      img.alt = f.name;
      const cap = document.createElement('div');
      cap.className = 'cap';
      cap.textContent = f.name;
      item.appendChild(img); item.appendChild(cap);
      item.addEventListener('click', ()=> openViewer(f.download_url));
      el.grid.appendChild(item);
    }
  }

  const viewer = document.getElementById('viewer');
  const fullImg = document.getElementById('fullImg');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const closeBtn = document.getElementById('closeBtn');

  let wasCollapsedBeforeViewer = null;
  function openViewer(src){
    const idx = state.flatImages.findIndex(x=>x.src===src);
    state.flatIndex = idx>=0 ? idx : 0;
    setViewerImage();
    wasCollapsedBeforeViewer = document.querySelector('.app').classList.contains('collapsed');
    if (typeof window.toggleSidebar === 'function') window.toggleSidebar(true);
    viewer.classList.add('show');
  }
  function setViewerImage(){
    const item = state.flatImages[state.flatIndex];
    if(!item) return; fullImg.src = item.src; fullImg.alt = item.name;
  }
  function nav(delta){
    if(!state.flatImages.length) return;
    state.flatIndex = (state.flatIndex + delta + state.flatImages.length) % state.flatImages.length;
    setViewerImage();
  }

  prevBtn.addEventListener('click', ()=>nav(-1));
  nextBtn.addEventListener('click', ()=>nav(1));
  closeBtn.addEventListener('click', ()=>{
    viewer.classList.remove('show');
    if (typeof window.toggleSidebar === 'function') window.toggleSidebar(!!wasCollapsedBeforeViewer);
    wasCollapsedBeforeViewer = null;
  });
  viewer.addEventListener('click', (e)=>{
    if(e.target===viewer){
      viewer.classList.remove('show');
      if (typeof window.toggleSidebar === 'function') window.toggleSidebar(!!wasCollapsedBeforeViewer);
      wasCollapsedBeforeViewer = null;
    }
  });
  window.addEventListener('keydown', (e)=>{
    if(!viewer.classList.contains('show')){
      if (e.key && e.key.toLowerCase() === 'h') {
        if (typeof window.toggleSidebar === 'function') window.toggleSidebar();
      }
    } else {
      if(e.key==='Escape') viewer.classList.remove('show');
      if(e.key==='ArrowLeft') nav(-1);
      if(e.key==='ArrowRight') nav(1);
    }
  });

  el.search.addEventListener('input', filterMaps);
  el.loadBtn.addEventListener('click', loadMaps);
  el.branch.addEventListener('change', loadMaps);
  el.owner.addEventListener('change', ()=>{ history.replaceState(null,'',`?owner=${encodeURIComponent(el.owner.value)}&repo=${encodeURIComponent(el.repo.value)}&branch=${encodeURIComponent(el.branch.value)}`); });
  el.repo.addEventListener('change', ()=>{ history.replaceState(null,'',`?owner=${encodeURIComponent(el.owner.value)}&repo=${encodeURIComponent(el.repo.value)}&branch=${encodeURIComponent(el.branch.value)}`); });

  window.addEventListener('hashchange', ()=>{
    const m = decodeURIComponent((location.hash.split('/')[1]||'').trim());
    if(m && state.maps.includes(m)){ selectMap(m); }
  });

  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a.help');
    if(a){ e.preventDefault(); document.getElementById('helpPanel')?.classList.toggle('open'); }
  });

  loadMaps();
})();

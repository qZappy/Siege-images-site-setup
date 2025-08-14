
(function(){
  const byId = id => document.getElementById(id);
  const el = {
    maps: byId('maps'), grid: byId('grid'), mapTitle: byId('mapTitle'), count: byId('countChip'),
    search: byId('search'), loadBtn: byId('loadBtn'), empty: byId('empty')
  };

  const state = { manifest:null, maps: [], filesByMap: {}, activeMap: null, flatImages: [], flatIndex: 0 };

  async function loadManifest(){
    try{
      const res = await fetch('images/manifest.json?v=' + Date.now(), { cache: 'no-cache' });
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if(!data || !data.maps) throw new Error('Bad manifest format');
      state.manifest = data;
      state.maps = Object.keys(data.maps).sort((a,b)=>a.localeCompare(b));
      state.filesByMap = data.maps;
      renderMapsList();
      const hashMap = decodeURIComponent((location.hash.split('/')[1]||'').trim());
      if (hashMap && state.maps.includes(hashMap)) selectMap(hashMap); else if (state.maps.length) selectMap(state.maps[0]);
    }catch(e){
      el.maps.innerHTML = '<div class="hint">Missing or invalid <code>/images/manifest.json</code>. Open <a href=\"tools/manifest_helper.html\">Manifest Helper</a> to create one.</div>';
      el.grid.innerHTML = '';
      el.mapTitle.textContent = '';
      el.count.textContent = '';
    }
  }

  function renderMapsList(){
    el.maps.innerHTML = '';
    for (const m of state.maps){
      const btn = document.createElement('button');
      btn.className = 'map-btn';
      const count = state.filesByMap[m]?.length || 0;
      btn.innerHTML = `<span>${m}</span><span class="map-count">${count}</span>`;
      btn.addEventListener('click', ()=> selectMap(m));
      el.maps.appendChild(btn);
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
    state.flatImages = files.map(name=>({ src: `images/${encodeURIComponent(state.activeMap)}/${encodeURIComponent(name)}`, name }));
    state.flatIndex = 0;
    for(const name of files){
      const src = `images/${encodeURIComponent(state.activeMap)}/${encodeURIComponent(name)}`;
      const item = document.createElement('div');
      item.className = 'thumb';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = src;
      img.alt = name;
      const cap = document.createElement('div');
      cap.className = 'cap';
      cap.textContent = name;
      item.appendChild(img); item.appendChild(cap);
      item.addEventListener('click', ()=> openViewer(src, name));
      el.grid.appendChild(item);
    }
  }

  // Viewer
  const viewer = document.getElementById('viewer');
  const fullImg = document.getElementById('fullImg');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const closeBtn = document.getElementById('closeBtn');
  let wasCollapsedBeforeViewer = null;

  function openViewer(src, name){
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
  el.loadBtn.addEventListener('click', loadManifest);

  loadManifest();
})();

const API = 'http://localhost:3000';

const kwEl = document.getElementById('kw');
const urlsList = document.getElementById('urls-list');
const savedList = document.getElementById('saved-list');
const progressBar = document.getElementById('bar');
const contentEl = document.getElementById('content');

function refreshSaved() {
  savedList.innerHTML = '';

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (!key.includes('→')) continue;

    const li = document.createElement('li');
    li.style.marginBottom = '6px';

    const link = document.createElement('span');
    link.textContent = key;
    link.style.cursor = 'pointer';
    link.style.color = 'blue';
    link.onclick = () => {
      contentEl.textContent = localStorage.getItem(key);
    };

    const del = document.createElement('button');
    del.textContent = '🗑️';
    del.style.marginLeft = '10px';
    del.onclick = () => {
      if (confirm(`Удалить "${key}" из localStorage?`)) {
        localStorage.removeItem(key);
        refreshSaved();
      }
    };

    li.appendChild(link);
    li.appendChild(del);
    savedList.appendChild(li);
  }
}
refreshSaved();

document.getElementById('search').onclick = async () => {
  const kw = kwEl.value.trim();
  if (!kw) return alert('Enter keyword');
  urlsList.innerHTML = 'Loading...';
  try {
    const r = await fetch(`${API}/urls?kw=${encodeURIComponent(kw)}`);
    if (!r.ok) throw await r.json();
    const { urls } = await r.json();
    urlsList.innerHTML = '';
    urls.forEach(url => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = url;
      btn.onclick = () => downloadUrl(url, kw);
      li.appendChild(btn);
      urlsList.appendChild(li);
    });
  } catch (e) {
    urlsList.innerHTML = '';
    contentEl.textContent = 'Error: ' + (e.error||e.message);
  }
};

async function downloadUrl(url, kw) {
  progressBar.style.width = '0%';
  contentEl.textContent = '';
  try {
    const r = await fetch(`${API}/download?url=${encodeURIComponent(url)}`);
    if (!r.ok) throw await r.json();

    const total = +r.headers.get('X-Total-Size');
    const reader = r.body.getReader();
    let downloaded = 0;
    let chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      downloaded += value.length;
      if (total) {
        const pct = (downloaded/total*100).toFixed(1);
        progressBar.style.width = pct + '%';
      }
    }
    const blob = new Blob(chunks);
    const text = await blob.text();
    localStorage.setItem(`${kw} → ${url}`, text);
    refreshSaved();
    contentEl.textContent = text;
  } catch (e) {
    contentEl.textContent = 'Error: ' + (e.error||e.message);
  }
}

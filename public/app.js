let config, editingId = null;
const $ = id => document.getElementById(id);
const api = (url, opts = {}) => fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
  .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Request failed'); return j; });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function init() {
  config = await api('/api/config');
  document.title = config.appName;
  $('appName').textContent = config.appName;
  $('tagline').textContent = config.tagline;
  document.documentElement.style.setProperty('--accent', config.accent);
  buildForm();
  $('search').addEventListener('input', load);
  load();
}

function buildForm() {
  $('formTitle').textContent = editingId ? `Edit ${config.itemName}` : `New ${config.itemName}`;
  $('form').innerHTML = config.fields.map(f => {
    const req = f.required ? 'required' : '';
    const input = f.type === 'textarea' ? `<textarea name="${f.name}" rows="3" ${req}></textarea>`
      : f.type === 'select' ? `<select name="${f.name}">${f.options.map(o => `<option>${esc(o)}</option>`).join('')}</select>`
      : `<input name="${f.name}" type="${f.type || 'text'}" ${req}>`;
    return `<label>${esc(f.label)}${input}</label>`;
  }).join('') + `<div class="row"><button type="submit">${editingId ? 'Save changes' : `Add ${esc(config.itemName)}`}</button>${editingId ? '<button type="button" class="ghost" id="cancel">Cancel</button>' : ''}</div>`;
  if ($('cancel')) $('cancel').onclick = () => { editingId = null; buildForm(); };
}

$('form').addEventListener('submit', async e => {
  e.preventDefault();
  $('error').textContent = '';
  const body = Object.fromEntries(new FormData(e.target));
  try {
    await api(editingId ? `/api/items/${editingId}` : '/api/items', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body) });
    editingId = null; buildForm(); load();
  } catch (err) { $('error').textContent = err.message; }
});

async function load() {
  const [items, stats] = await Promise.all([api('/api/items?q=' + encodeURIComponent($('search').value)), api('/api/stats')]);
  $('stats').innerHTML = `<div class="stat"><b>${stats.total}</b><span>Total</span></div>` +
    Object.entries(stats.counts).map(([k, v]) => `<div class="stat"><b>${v}</b><span>${esc(k)}</span></div>`).join('');
  const [titleF, ...rest] = config.fields;
  const bodyF = rest.find(f => f.type === 'textarea');
  const tagFs = rest.filter(f => f !== bodyF);
  $('list').innerHTML = items.length ? items.map(i => `
    <li class="item">
      <h3>${esc(i[titleF.name])}</h3>
      ${bodyF && i[bodyF.name] ? `<p>${esc(i[bodyF.name])}</p>` : ''}
      <div>${tagFs.filter(f => i[f.name]).map(f => `<span class="tag">${esc(i[f.name])}</span>`).join('')}</div>
      <div class="row" style="margin-top:.6rem">
        <button class="ghost" onclick="edit(${i.id})">Edit</button>
        <button class="danger" onclick="del(${i.id})">Delete</button>
      </div>
    </li>`).join('') : `<li class="empty">Nothing here yet. Add your first ${esc(config.itemName.toLowerCase())} above.</li>`;
  window._items = items;
}

window.edit = id => {
  editingId = id; buildForm();
  const item = window._items.find(i => i.id === id);
  config.fields.forEach(f => { $('form').elements[f.name].value = item[f.name] ?? ''; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.del = async id => { if (confirm('Delete this entry?')) { await api(`/api/items/${id}`, { method: 'DELETE' }); load(); } };

init();

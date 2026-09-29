const express = require('express');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const db = new Database(path.join(__dirname, 'app.db'));
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const row = r => ({ id: r.id, created_at: r.created_at, ...JSON.parse(r.data) });
const clean = body => Object.fromEntries(config.fields.map(f => [f.name, String(body[f.name] ?? '').trim()]));
const missing = d => config.fields.find(f => f.required && !d[f.name]);

app.get('/api/config', (_, res) => res.json(config));

app.get('/api/items', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  let items = db.prepare('SELECT * FROM items ORDER BY id DESC').all().map(row);
  if (q) items = items.filter(i => JSON.stringify(i).toLowerCase().includes(q));
  res.json(items);
});

app.post('/api/items', (req, res) => {
  const d = clean(req.body), m = missing(d);
  if (m) return res.status(400).json({ error: `${m.label} is required` });
  const info = db.prepare('INSERT INTO items (data) VALUES (?)').run(JSON.stringify(d));
  res.status(201).json(row(db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid)));
});

app.put('/api/items/:id', (req, res) => {
  const d = clean(req.body), m = missing(d);
  if (m) return res.status(400).json({ error: `${m.label} is required` });
  const info = db.prepare('UPDATE items SET data = ? WHERE id = ?').run(JSON.stringify(d), req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ id: +req.params.id, ...d });
});

app.delete('/api/items/:id', (req, res) => {
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Counts per value of the first select field (drives the stat strip)
app.get('/api/stats', (_, res) => {
  const items = db.prepare('SELECT data FROM items').all().map(r => JSON.parse(r.data));
  const f = config.fields.find(x => x.type === 'select');
  const counts = f ? Object.fromEntries(f.options.map(o => [o, items.filter(i => i[f.name] === o).length])) : {};
  res.json({ total: items.length, field: f?.label, counts });
});

// ---- Add custom routes below ----

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));

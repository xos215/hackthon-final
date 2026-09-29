# Hackathon Template

Express + SQLite + vanilla HTML/CSS/JS. CRUD, search, and stats work out of the box.

## Run
    npm install
    npm start        # http://localhost:3000

## Customise (in this order)
1. `config.json` – app name, tagline, accent colour, and the form fields (types: text, textarea, select, number, email, date, url). The form, list, and stats rebuild themselves.
2. `schema.sql` – add extra tables if the idea needs them.
3. `server.js` – add routes under "Add custom routes below".
4. `public/style.css` – change the `:root` colour tokens.

## Deploy
Render / Railway: build `npm install`, start `npm start`. Note: SQLite file resets on free tiers without a persistent disk.

# 🌌 Maincoon Stellar

A web application for Maine Coon breeders. Manage pet profiles, forecast breeding outcomes, track litters and build pedigrees — all in one place, right in your browser.

---

## Features

### Cattery
- Pet profiles with photos, EMS color codes, and genetic formulas
- Conformation and temperament scoring
- Genetic health tests (HCM, PKD, SMA and others)
- Pedigree up to 5 generations (60 ancestors)
- Titles and tags

### Breeding Forecast
- Predicted offspring color probabilities based on both parents' genetics
- Punnett square for key loci
- Wright's inbreeding coefficient (5 generations)
- Genetic test compatibility analysis

### Journal
- Event calendar: heat cycles, breedings, expected and actual births, notes
- Automatic expected birth date calculation (+63 days from breeding)
- Filtering by pet and event type

### Litters
- Litter records with birth date, dam and sire
- Kitten profiles: color, sex, weight, status (waiting / sold / stays)
- Add a kitten to the cattery with one click

### Generation Map
- Interactive SVG relationship graph for the entire cattery
- Zoom and pan with mouse
- Click a node to open the pet's profile

### Export
- Export data as TXT, Markdown, HTML or ZIP

### Settings
- Three themes: Stellar (starfield), Dark, Light
- Russian and English interface
- Full data reset with triple confirmation

---

## Running Locally

The app is a static site. It requires a local HTTP server (not `file://` — due to JSON file requests).

**Python** (built-in):
```bash
python -m http.server 8080
```
Then open [http://localhost:8080](http://localhost:8080)

**Node.js**:
```bash
npx serve .
```

**VS Code**: install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension and click «Go Live».

---

## Data Storage

All data is saved to your browser's `localStorage` — no registration, no servers, nothing leaves your device. Photos are stored as base64 in the same storage.

> localStorage has a soft limit of ~5 MB. Storing many high-resolution photos may approach this limit.

---

## Deployment

The app is ready to publish on [GitHub Pages](https://pages.github.com/) with no build tools or additional dependencies required.

---

## Stack

- HTML5 + CSS3 + JavaScript (ES6 modules)
- No frameworks, no npm, no bundlers
- Fonts: Cinzel Decorative, Rajdhani, Exo 2 (Google Fonts)

---

## License

[MIT](LICENSE) © 2026 Sonmix

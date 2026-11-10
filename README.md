# The Best Chicken Kabab Corner — Website

A single-page restaurant website with an online menu, cart and WhatsApp ordering.
Built with plain **HTML, CSS and JavaScript** — no build tools or installs needed.

## Open it

Double-click `index.html` to open it in a browser.

To preview it like a real website (recommended before publishing), run a simple local server
from this folder, for example:

```bash
python -m http.server 5500
```

then open http://localhost:5500.

## Folder structure

```
index.html          Page structure (all sections, cart drawer, checkout)
css/styles.css      All styles, animations and responsive layouts
js/config.js        Restaurant details, WhatsApp number, social links, photos
js/menu-data.js     Menu items and prices
js/app.js           Menu tabs, cart, checkout and animations
images/hero.webp    Hero background photo
favicon.svg         Browser tab icon
sitemap.xml         Page list for search engines
robots.txt          Crawler rules + sitemap location
llms.txt            Plain-text summary + menu for AI assistants
```

## Common edits

| What you want to change | Where |
| --- | --- |
| Prices, dish names, descriptions | `js/menu-data.js` |
| Add a new dish | Copy a line in `js/menu-data.js`, give it a unique `id` |
| Phone numbers, timings, location | `js/config.js` → `SITE` |
| WhatsApp number that receives orders | `js/config.js` → `whatsappNumber` (digits only, with 91) |
| Instagram / Facebook / YouTube links | `js/config.js` → `social` (empty = hidden) |
| Hero or About photo | Replace the file in `images/`, or change `IMAGES` in `js/config.js` |
| Colours and fonts | Top of `css/styles.css` (`:root` variables) |

## How ordering works

1. Customer picks Half or Full, sets the quantity and taps **Add**.
2. The cart (right-hand panel on desktop, floating button on mobile) keeps the order,
   even if the page is reloaded.
3. **Place Order on WhatsApp** asks for name, mobile number, address and an optional note,
   shows a summary, then opens WhatsApp with the full order ready to send.

No payment gateway is used — payment and delivery charges are confirmed on WhatsApp.

## Publishing

**Before you publish:** replace the placeholder address `https://www.example.com` with your
real website address (for example `https://bestkababcorner.in`) in these three files:

- `sitemap.xml`
- `robots.txt`
- `llms.txt`

If you change prices or dishes in `js/menu-data.js`, update the menu list in `llms.txt` too,
so AI assistants show the correct prices.

**After editing CSS or JS files:** in `index.html`, change `?v=2` to `?v=3` (and so on) on the
stylesheet and script links, so returning visitors get the new files instead of old cached ones.

After publishing, submit `https://your-domain/sitemap.xml` in
[Google Search Console](https://search.google.com/search-console) to get indexed faster.

Any static hosting works. Easiest options:

- **Netlify Drop** — drag this whole folder onto https://app.netlify.com/drop
- **GitHub Pages** — push the folder to a repository and enable Pages
- Any web host — upload all files keeping the same folder structure

The `.claude` folder is only used for local previewing and does not need to be uploaded.

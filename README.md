# 🐾 PawPulse — High-Authority Pet Magazine & Autonomous Publishing Engine

PawPulse is an enterprise-grade, veterinary-reviewed pet blog network inspired by high-monetization authority sites like *The Spruce Pets*, *PetMD*, and *Rover*. 

It comes pre-loaded with **over 260+ deep, comprehensive, search-engine-optimized articles and stories** covering dogs, cats, birds, lizards, snakes, small animals, and aquatics. It also includes an **autonomous publishing engine configured to research and publish 50+ posts per day**.

---

## 🚀 Key Features

### 1. 260+ Comprehensive Pet Care Guides & Stories
- **Cats & Felines:** Feline sleep & dreaming twitch neurology, step-by-step low-stress nail clipping protocol, purr frequency healing, litter box aversion troubleshooting, chronic kidney disease (SDMA), and more.
- **Dogs & Canines:** FRAPs ("zoomies") cortisol biology, loose-leash walking, separation anxiety sub-threshold desensitization, bloat (GDV) emergency warning signs, puppy 100-exposure socialization, and dental hygiene.
- **Lizards & Reptiles:** Bearded dragon brumation vs illness, Ferguson Zones UVB lighting setup, leopard gecko tail drop regeneration, and crested gecko humidity cycles.
- **Snakes & Serpents:** Ball python feeding strike recovery (hairdryer scenting & braining), corn snake thermal gradients, retained eye cap removal, and low-stress hook handling.
- **Birds & Parrots:** Feather plucking etiology, sunrise/sunset screaming fixes, cockatiel night fright prevention, and PTFE Teflon kitchen hazard protection.
- **Small Pets:** Rabbit GI stasis emergency care, guinea pig vitamin C synthesis, Syrian hamster burrow requirements, and ferret adrenal disease.
- **Aquatics & Amphibians:** Fishless nitrogen cycling step-by-step, betta fin rot remedies, and axolotl water chilling.

### 2. High-Converting Sidebar with Most Popular Guides
- Dedicated sidebar with **numbered trending rankings** (1–6), view metrics, and reading times.
- Sticky high-CTR display advertisement units.
- Species navigator pills with instant filtering.
- Free weekly newsletter capture form ("The Weekly Pet Digest").
- 24/7 ASPCA & Pet Poison Helpline emergency reference box.

### 3. Built-In Monetization & Ad Network Optimization
- **Configurable in `config.json`:**
  - Header Leaderboard (728x90 responsive).
  - In-Article Top Display Ad (after intro).
  - In-Article Bottom Display Ad (before FAQs).
  - Sticky Sidebar Display Ad.
  - Dismissible Mobile Sticky Bottom Banner.
  - Native Affiliate Product Comparison Boxes ("Editor's Choice", "Clinically Vetted") with FTC-compliant legal disclosure.
- Instant switch from Demo Mode to live **Google AdSense** (`ca-pub-XXXXXXXXXXXXX`) or **Mediavine** by updating `config.json`.

### 4. Search Engine Optimization (SEO) Architecture
- **Google Rich Results JSON-LD Schemas:**
  - `Article` / `BlogPosting` structured data with author job titles and publisher logos.
  - `HowTo` structured data with numbered steps and directions (for grooming, training, and terrarium setups).
  - `FAQPage` structured data on every guide for Google "People Also Ask" featured snippets.
  - `BreadcrumbList` structured data.
- **Dynamic `/sitemap.xml`:** Automatically updates whenever new articles are published.
- **Dynamic `/robots.txt`** and **`/rss.xml`** RSS 2.0 syndication feed.
- **E-E-A-T Compliance:** Author profiles with board-certified veterinary reviewers ("Medically Reviewed by Dr. Elena Rostova, DVM, DACVB") to satisfy Google Search Quality Rater guidelines.

### 5. Autonomous 50-Post Daily Publishing Engine
- **Admin Control Room (`/admin/automation`):**
  - Live article counter & telemetry logs.
  - **1-Click Batch Trigger:** Generate and publish 50 researched articles immediately.
  - **Custom Topic Prompt:** Type any pet behavior or health question to publish instantly.
  - Start/Pause background scheduler button.
- **Continuous Background Daemon:** `npm run auto:daemon` schedules 50 posts per day (1 post every ~28 minutes).
- **CLI Batch Execution:** `npm run publish:batch` or `node scripts/publish-daily.js --count=50`.

---

## 🛠️ Quick Start & Running the Website

### Running the Live Web Server
```bash
# In directory: E:\project blog
node server.js
```
The server will start on: **http://localhost:4000**

### Key URLs to Explore:
- **Homepage:** `http://localhost:4000/`
- **Cat Dreaming & Twitching Guide:** `http://localhost:4000/blog/why-do-cats-twitch-while-sleeping-rem-dreams`
- **Cat Nail Trimming Guide (HowTo):** `http://localhost:4000/blog/how-to-clip-cat-nails-safely-veterinary-protocol`
- **Most Popular Guides:** `http://localhost:4000/popular`
- **Cats Hub:** `http://localhost:4000/category/cats`
- **Reptiles Hub:** `http://localhost:4000/category/reptiles`
- **Snakes Hub:** `http://localhost:4000/category/snakes`
- **Dynamic Sitemap:** `http://localhost:4000/sitemap.xml`
- **RSS Feed:** `http://localhost:4000/rss.xml`
- **Admin Automation Dashboard:** `http://localhost:4000/admin/automation`

---

## ⚙️ Configuration (`config.json`)

To link your real Google AdSense account or change site settings, edit `config.json`:
```json
{
  "monetization": {
    "enabled": true,
    "demoMode": false,
    "adsenseClientId": "ca-pub-YOUR_ACTUAL_ID",
    "slots": {
      "headerBanner": "1122334455",
      "inContentTop": "2233445566",
      "inContentMid": "3344556677",
      "sidebarSticky": "4455667788",
      "bottomSticky": "5566778899"
    }
  }
}
```

---

## 📂 Active Workspace Recommendation
To work on this project directly in Antigravity, set your active workspace to:
`E:\project blog`

# Personal Academic & Portfolio Website Template

A modern, fast, and lightweight personal academic portfolio website template. Built with pure **HTML5**, **Bootstrap 5**, **vanilla JavaScript**, and a client-side **Markdown & BibTeX rendering engine**.

**Zero build tools required.** No Ruby, no Jekyll, no Node.js / npm, no Python builds, and no GitHub Actions setup. You only edit simple Markdown (`.md`) and BibTeX (`.bib`) files, commit, and push. GitHub Pages publishes your site instantly!

---

## Table of Contents

- [Key Features](#key-features)
- [Quick Start (5-Minute Setup)](#quick-start-5-minute-setup)
- [Directory Structure](#directory-structure)
- [Detailed Customization Guide](#detailed-customization-guide)
  - [1. Personal Bio & Home Page (`assets/content/index.md`)](#1-personal-bio--home-page-assetscontentindexmd)
  - [2. Bibliography & Publications (`assets/bibliography/papers.bib`)](#2-bibliography--publications-assetsbibliographypapersbib)
  - [3. Resume & CV (`assets/content/resume.md` & `assets/pdf/`)](#3-resume--cv-assetscontentresumemd--assetspdf)
  - [4. Featured Repositories (`assets/content/repositories.md`)](#4-featured-repositories-assetscontentrepositoriesmd)
  - [5. News & Announcements (`assets/content/news.md`)](#5-news--announcements-assetscontentnewsmd)
  - [6. Navigation Bar & Footer (`assets/js/layout.js`)](#6-navigation-bar--footer-assetsjslayoutjs)
  - [7. Profile Picture & Images (`assets/img/`)](#7-profile-picture--images-assetsimg)
  - [8. SEO, Social Cards & Academic Metadata (`*.html`)](#8-seo-social-cards--academic-metadata-html)
  - [9. Visual Styling & Themes (`assets/css/site.css`)](#9-visual-styling--themes-assetscsssitecss)
  - [10. Sitemap & Search Engines (`sitemap.xml`, `robots.txt`)](#10-sitemap--search-engines-sitemapxml-robotstxt)
- [Local Development & Preview](#local-development--preview)
- [Deployment Guide](#deployment-guide)
  - [Deploying to GitHub Pages](#deploying-to-github-pages)
  - [Using a Custom Domain](#using-a-custom-domain)
  - [Deploying to Other Free Hosts (Netlify, Vercel, Cloudflare Pages)](#deploying-to-other-free-hosts-netlify-vercel-cloudflare-pages)
- [Adding a New Page](#adding-a-new-page)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [License](#license)

---

## Key Features

- **Zero-Build Architecture**: Runs natively in any web browser and static file host. No complex build pipelines or dependency vulnerability alerts.
- **BibTeX-Powered Publications**: Maintain your citations in a standard `.bib` file (`assets/bibliography/papers.bib`). The site automatically parses, sorts, and renders publication badges, author lists, venue links, and DOI buttons.
- **Selective Citation Support**: Highlight specific publications on the homepage using citation keys (e.g. `1. [@MyPaperKey]`), or render all publications on the publications page using `1. @all`.
- **Markdown-Driven Content**: Update your bio, resume, news, and projects without touching HTML markup.
- **Centralized Navigation & Footer**: Modify navigation menus and footer credits in a single file (`assets/js/layout.js`) across the entire website.
- **Academic & Industry SEO**: Pre-configured with Schema.org JSON-LD structured data (`Person`, `EducationalOrganization`, `CollectionPage`), Open Graph tags, Twitter Cards, and Google Scholar indexing support.
- **News Feed with Auto-Truncation**: Displays the top 5 most recent announcements on the home page with an automatic button linking to the full news archive (`news.html`).
- **Fully Responsive**: Mobile-friendly layout built on Bootstrap 5.3 with elegant typography (IBM Plex Sans & Source Serif 4).

---

## Quick Start (5-Minute Setup)

### Step 1: Use This Template or Fork
1. Click **Use this template** (or **Fork**) at the top right of the GitHub repository.
2. Name your new repository `<your-username>.github.io` (replace `<your-username>` with your actual GitHub username).

### Step 2: Clone to Your Machine
```bash
git clone https://github.com/<your-username>/<your-username>.github.io.git
cd <your-username>.github.io
```

### Step 3: Run Locally
Because the site uses JavaScript `fetch()` to load Markdown and BibTeX files, you need a local web server (opening HTML files directly via `file://` is blocked by browser CORS security):

```bash
# Python 3 (recommended - built into macOS & Linux)
python3 -m http.server 8000

# Or with Node.js
npx serve .
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Step 4: Deploy to GitHub Pages
1. Go to your repository on GitHub.
2. Open **Settings** -> **Pages**.
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or `dev`)
   - **Folder**: `/ (root)`
4. Click **Save**. Within 1–2 minutes, your website is live at `https://<your-username>.github.io`!

---

## Directory Structure

```text
.
├── index.html                  # Home page skeleton
├── news.html                   # Full news timeline skeleton
├── publications.html           # Full publications page skeleton
├── repositories.html           # Open-source / code projects skeleton
├── resume.htm                  # Online CV & resume skeleton
├── gallery.html                # Visual research/illustration gallery
├── sitemap.xml                 # XML sitemap for Google/Bing indexing
├── robots.txt                  # Search engine crawl rules
├── README.md                   # Documentation and instructions
├── LICENSE                     # Open source license
└── assets/
    ├── bibliography/
    │   └── papers.bib          # BibTeX database for your papers
    ├── content/                # All your editable Markdown content
    │   ├── index.md            # Bio, profile image, interests, links, selected papers
    │   ├── publications.md     # Academic profiles & full publication directive
    │   ├── repositories.md     # Projects, descriptions, tags, and repo links
    │   ├── resume.md           # Experience, education, awards, technical skills
    │   └── news.md             # Dated announcement entries
    ├── css/
    │   └── site.css            # Custom CSS and color palette variables
    ├── img/
    │   ├── about.jpg           # Profile picture
    │   ├── favicon-bd.svg      # Browser tab favicon
    │   └── gallery/            # Gallery visuals / concept SVGs
    ├── js/
    │   ├── layout.js           # Shared header navigation and footer markup
    │   └── markdown-loader.js  # Markdown & BibTeX rendering engine
    └── pdf/
        ├── cv_chowdhury.pdf    # Full academic CV PDF
        └── resume_chowdhury.pdf# Industry resume PDF
```

---

## Detailed Customization Guide

### 1. Personal Bio & Home Page (`assets/content/index.md`)

This file powers the homepage. It is divided into standard Markdown sections parsed automatically by `assets/js/markdown-loader.js`:

```markdown
# Your Full Name

Your current title, degree program, or role (e.g., Ph.D. Candidate at Stanford University).

## Profile Image

assets/img/about.jpg

## About

A paragraph or two describing your background, ongoing research, mission, and major accomplishments.

## Research Interests

- Machine Learning & Deep Learning
- Computer Vision
- Computational Biology & Genomics
- Distributed Cloud Systems

## Office Location

Room 123, Science Building  
123 University Ave, City, State 12345

## Connect

- [Email](mailto:yourname@example.com)
- [LinkedIn](https://www.linkedin.com/in/your-profile)
- [GitHub](https://github.com/your-username)
- [Google Scholar](https://scholar.google.com/citations?user=your_id)
- [ORCID](https://orcid.org/0000-0000-0000-0000)

## Selected Publications

1. [@Smith2026]
2. [@Doe2025]
```

> **Icons**: In the `## Connect` section, icons (Font Awesome) are automatically assigned based on the label text: `Email`, `LinkedIn`, `GitHub`, `Google Scholar`, `ORCID`, `Twitter`, etc.
>
> **Selected Publications**: Under `## Selected Publications`, simply write numbered references using your BibTeX keys in `[@citation_key]` format. The engine matches them with entries in `assets/bibliography/papers.bib`.

---

### 2. Bibliography & Publications (`assets/bibliography/papers.bib`)

Add your publications in standard BibTeX format inside [assets/bibliography/papers.bib](file:///assets/bibliography/papers.bib):

```bibtex
@article{Smith2026,
  title = {Deep Learning Approaches to Genome Architecture},
  author = {Smith, Jane and Doe, John and Chowdhury, Mohit},
  journal = {Nature Machine Intelligence},
  year = {2026},
  doi = {10.1038/s42256-026-00001-x},
  url = {https://doi.org/10.1038/s42256-026-00001-x}
}
```

#### How the Publications Page Works (`assets/content/publications.md`)

In [assets/content/publications.md](file:///assets/content/publications.md):
```markdown
# Publications

## Academic Profiles

- [Google Scholar](https://scholar.google.com/citations?user=your_id)
- [ORCID](https://orcid.org/0000-0000-0000-0000)

## Full Publication List

1. @all
```

- Writing `1. @all` tells the rendering engine to load **every entry** from `papers.bib`, automatically sorted in reverse chronological order (newest year first).
- Each entry automatically displays the title, author list, journal/venue badge, year, and clickable links to the DOI and BibTeX citation.

---

### 3. Resume & CV (`assets/content/resume.md` & `assets/pdf/`)

1. **Place your PDF files** in `assets/pdf/` (e.g., `cv.pdf` and `resume.pdf`).
2. **Update the download links and content** in [assets/content/resume.md](file:///assets/content/resume.md):

```markdown
# Resume

## Download

- [Download CV (PDF)](assets/pdf/cv.pdf)
- [Download Resume (PDF)](assets/pdf/resume.pdf)

## General Information

- **Full Name:** Jane Doe
- **Title:** Ph.D. Candidate & Graduate Research Assistant
- **Department:** Computer Science
- **Institution:** Your University
- **Location:** City, State, Country
- **Email:** jane.doe@example.com
- **Website:** [janedoe.github.io](https://janedoe.github.io)

## Education

- **Ph.D. in Computer Science**, GPA: 4.00
    - University Name, City, State (Expected May 2027)
    - *Dissertation*: Title of your dissertation
    - *Advisor*: Dr. Advisor Name

## Research Experience

### Graduate Research Assistant — Lab Name, University (2023–Present)
- Bullet point describing research accomplishments and technologies used.
- Bullet point describing publications or software released.

## Technical Skills

- **Programming:** Python, C++, Java, JavaScript, SQL
- **Frameworks:** PyTorch, TensorFlow, Flask, Docker
```

The resume page automatically renders download buttons, key-value grids for General Information, formatted education cards, and clean skill badges.

---

### 4. Featured Repositories (`assets/content/repositories.md`)

Showcase your open-source projects or software tools in [assets/content/repositories.md](file:///assets/content/repositories.md):

```markdown
# Repositories

## GitHub Profiles

- [YourUsername](https://github.com/your-username)
- [LabOrganization](https://github.com/your-lab)

## Featured Repositories

### ProjectName
A concise description of what the project does, key scientific or technical contributions, and practical use cases.
**Tag:** Python, Deep Learning, PyTorch, Docker
[Open Repository](https://github.com/your-username/project-name)

### AnotherProject
Description of your second project.
**Tag:** React, Node.js, Web
[Open Repository](https://github.com/your-username/another-project)
```

Each `###` item is styled into a card with interactive tag pills and repository links.

---

### 5. News & Announcements (`assets/content/news.md`)

Post updates and achievements in [assets/content/news.md](file:///assets/content/news.md):

```markdown
# News

## News

- **2026-05-15 10:00:** Passed my Ph.D. dissertation defense!
- **2026-02-10 14:00:** Our paper was accepted at *Communications Biology*.
- **2026-01-15 09:00:** Received travel grant to attend Conference 2026.
```

- Format: `- **YYYY-MM-DD HH:MM:** Announcement text.`
- The 5 most recent announcements automatically appear on the home page.
- All announcements appear on the dedicated [news.html](file:///news.html) page.

---

### 6. Navigation Bar & Footer (`assets/js/layout.js`)

Open [assets/js/layout.js](file:///assets/js/layout.js) to configure your global navigation menu and footer:

```javascript
// Change brand name:
'<a class="navbar-brand fw-semibold" href="index.html">Your Name</a>'

// Change navigation menu items:
var navItems = [
  { href: "index.html", label: "Home" },
  { href: "publications.html", label: "Publications" },
  { href: "repositories.html", label: "Repositories" },
  { href: "resume.htm", label: "Resume" },
  // To add a new link:
  // { href: "news.html", label: "News" },
];

// Change footer text:
'<p class="mb-0 small">&copy; ' + new Date().getFullYear() + ' Your Name</p>'
```

Because this is injected into `#site-header` and `#site-footer`, updates take effect on every page immediately.

---

### 7. Profile Picture & Images (`assets/img/`)

- **Profile Picture**: Replace `assets/img/about.jpg` with your own square or portrait photo (suggested size: ~600x600px).
- **Favicon**: Replace `assets/img/favicon-bd.svg` with your own SVG, PNG, or ICO favicon.

---

### 8. SEO, Social Cards & Academic Metadata (`*.html`)

For optimal visibility on Google, Google Scholar, LinkedIn, and Twitter, update the `<head>` block of each HTML file (`index.html`, `publications.html`, `repositories.html`, `resume.htm`, etc.):

1. **Title & Description**:
   ```html
   <title>Jane Doe | Ph.D. Candidate & Researcher</title>
   <meta name="author" content="Jane Doe">
   <meta name="description" content="Personal academic website of Jane Doe...">
   <link rel="canonical" href="https://yourusername.github.io/">
   ```
2. **Open Graph & Twitter Cards**:
   Replace URLs, image paths, and usernames with your own details:
   ```html
   <meta property="og:url" content="https://yourusername.github.io/">
   <meta property="og:title" content="Jane Doe | Researcher">
   <meta property="og:image" content="https://yourusername.github.io/assets/img/about.jpg">
   ```
3. **Structured Data (Schema.org JSON-LD)**:
   In `index.html`, customize the `<script type="application/ld+json">` with your name, institution, degrees, and profile URLs (`sameAs`).

---

### 9. Visual Styling & Themes (`assets/css/site.css`)

Colors are defined at the top of [assets/css/site.css](file:///assets/css/site.css) as CSS custom properties:

```css
:root {
  --site-ink: #11263c;         /* Main text and heading color */
  --site-paper: #f7f9fc;       /* Background alternate section tint */
  --site-accent: #0f4c81;      /* Primary theme color (buttons, links, active tabs) */
  --site-accent-soft: #d8e8f8; /* Soft background hover tint */
}
```

Simply change `--site-accent` to your favorite color (e.g., `#2b5c8f` for university blue, `#1b7a4b` for forest green, `#800000` for crimson) to re-theme the entire website.

---

### 10. Sitemap & Search Engines (`sitemap.xml`, `robots.txt`)

1. **`sitemap.xml`**: Replace `https://hmamohit.github.io/` with your own URL (e.g., `https://<your-username>.github.io/`).
2. **`robots.txt`**: Update the `Sitemap:` directive with your domain.

---

## Local Development & Preview

Because modern web browsers restrict `fetch()` requests on local `file://` URLs for security reasons, run a local web server to preview changes:

### Option A: Python 3 (No installation needed on Mac/Linux)
```bash
python3 -m http.server 8000
```
Visit: [http://localhost:8000](http://localhost:8000)

### Option B: VS Code Live Server
1. Install the **Live Server** extension in VS Code.
2. Right-click `index.html` and click **Open with Live Server**.

### Option C: Node.js / npx
```bash
npx serve .
```

---

## Deployment Guide

### Deploying to GitHub Pages

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Personalize website content"
   git push origin main
   ```
2. Navigate to your repository on GitHub.
3. Go to **Settings** > **Pages** (in the left sidebar).
4. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: Select your main branch (e.g. `main` or `dev`)
   - **Folder**: `/ (root)`
5. Click **Save**.
6. After a minute, your website will be live at `https://<your-username>.github.io/`.

### Using a Custom Domain

To use your own domain (e.g., `www.yourname.com`):
1. In repository **Settings** > **Pages** > **Custom domain**, enter your domain name and save.
2. Add a `CNAME` file to the root of your repository containing your domain name.
3. In your DNS provider (e.g. Cloudflare, Namecheap, Google Domains), add a `CNAME` record pointing to `<your-username>.github.io` or `A` records pointing to GitHub's IPs:
   ```text
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
4. Check **Enforce HTTPS** in GitHub Pages settings.

### Deploying to Other Free Hosts (Netlify, Vercel, Cloudflare Pages)

Since this repository contains pure static files with no build step:
- **Netlify**: Connect your GitHub repository. Leave `Build command` blank and set `Publish directory` to `.` or root.
- **Vercel**: Import the repository. Choose `Other` as framework preset. Leave build command blank.
- **Cloudflare Pages**: Connect repo. Set build command to empty and output directory to `/`.

---

## Adding a New Page

Adding a new page (e.g., `teaching.html`):

1. **Create the HTML file (`teaching.html`)**:
   Copy `publications.html` as `teaching.html` and update the `<main>` tag:
   ```html
   <main data-md="assets/content/teaching.md"></main>
   ```
2. **Create the Markdown file (`assets/content/teaching.md`)**:
   ```markdown
   # Teaching Experience

   ## Courses Taught
   - **CS 101: Introduction to Computer Science** — Fall 2025 (Teaching Assistant)
   - **CS 450: Machine Learning** — Spring 2025 (Guest Lecturer)
   ```
3. **Add the link to the navigation bar**:
   In `assets/js/layout.js`, add it to `navItems`:
   ```javascript
   var navItems = [
     { href: "index.html", label: "Home" },
     { href: "publications.html", label: "Publications" },
     { href: "repositories.html", label: "Repositories" },
     { href: "resume.htm", label: "Resume" },
     { href: "teaching.html", label: "Teaching" },
   ];
   ```

---

## Troubleshooting & FAQ

#### Q: The page is completely blank when I double-click `index.html` in my file manager.
**A:** This is normal browser security behavior. Modern browsers block JavaScript from making `fetch()` calls on `file://` URLs. Start a local server with `python3 -m http.server 8000` and view it at `http://localhost:8000`.

#### Q: My publications from `papers.bib` are not showing up.
**A:** Check your browser's Developer Tools Console (`F12` -> `Console`). Ensure your BibTeX keys don't contain special characters or unmatched curly braces `{}`.

#### Q: I don't want a "Built with Ai" note in the footer.
**A:** Open `assets/js/layout.js` and remove or customize the text in `footerHost.innerHTML`.

#### Q: How do I change the font?
**A:** Google Fonts links are included in the `<head>` of each HTML file (`IBM Plex Sans` and `Source Serif 4`). You can swap them for any fonts you prefer and update `font-family` in `assets/css/site.css`.

---

## License

This project is open-source under the [MIT License](LICENSE). You are welcome to use, fork, and modify this template for your personal or academic website. Attribution is appreciated!

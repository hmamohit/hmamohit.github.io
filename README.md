# Personal Academic Website (Static)

This repository now uses a plain static website setup:
- `index.html`
- `assets/css/site.css`
- `.nojekyll`

No Jekyll, no build step, and no deployment workflow are required.

## Deploy On GitHub Pages (No Build Tools)

1. Push this repository to GitHub.
2. Open repository **Settings -> Pages**.
3. Under **Build and deployment**, set:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Save.

GitHub Pages will publish the static files directly.

## Edit Content

- Home page (about, interests, selected publications, news): `assets/content/index.md`
- Publications page (all publications): `assets/content/publications.md`
- Repositories page: `assets/content/repositories.md`
- Resume page + PDF download: `resume.htm` and `assets/content/resume.md`
- Visual styles: `assets/css/site.css`
- Profile image: `assets/img/about.jpg`
- Publication source data: `_bibliography/papers.bib`
- Repository source data: `assets/content/repositories.md`
- Resume source data: `assets/content/resume.md`


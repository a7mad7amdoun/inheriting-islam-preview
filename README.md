# Inheriting Islam — design review

[Open the live design preview](https://a7mad7amdoun.github.io/inheriting-islam-preview/)

A public review copy prepared for Hamza. This is a work in progress, separate
from the official Inheriting Islam website. Reading reflections and the Arabic
edition remain subject to editorial review.

The preview includes English and Arabic, daylight and lamplight themes,
responsive artwork layouts, Qur’an learning pages, readings, Apps, About,
Podcast, and Contact. Existing images and app identities belong to their
respective owners; this repository does not grant reuse rights.

## View or edit locally

Clone the repository, then run:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`. HTML, CSS, JavaScript, fonts, and images are
included; no package installation is required.

## Live updates

Every push to `main` runs the **Publish design preview** workflow. Once it
succeeds, the same live link shows the updated version. A local edit must be
committed and pushed before it appears online.

The repository contains the review website, not the private authoring history
or internal project notes. To suggest edits, open an issue or pull request.

## Hosting

`.github/prepare-pages.py` adapts navigation, assets, language links, and
theme-specific logos to the GitHub Pages subpath. It validates local links
before deployment. The review has no custom domain and requests no search
indexing; it is still publicly accessible.

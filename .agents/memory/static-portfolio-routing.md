---
name: Static portfolio routing
description: Vite base-path behavior for static sites served in Replit previews and GitHub Pages project subpaths.
---

For a static Vite portfolio artifact, development requests arrive with the Replit artifact preview prefix, while a published GitHub Pages project site needs paths relative to the repository subpath.

**Why:** A relative base in Vite development made proxied requests fall through to the HTML page instead of serving CSS and JavaScript.

**How to apply:** Use the configured artifact base path in the Vite dev server and `./` for production builds. Verify preview assets under the artifact route and inspect the built HTML for relative asset URLs.

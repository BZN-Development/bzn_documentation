# bzn_documentation

Documentation for [bzn](https://github.com/BZN-Development/bzn_core), a modular,
performance-first FiveM framework. Built with [VitePress](https://vitepress.dev) and
published to GitHub Pages on every push to `main`.

## Working on the docs

```sh
npm install
npm run dev      # local site with live reload
npm run build    # what CI builds
```

Pages are Markdown files in `docs/`. The sidebar is in `docs/.vitepress/config.mts`.

## Writing style

- English, short sentences, examples first.
- Every function lists what it returns and its error strings.
- When code changes in bzn_core, update the page in the same week.

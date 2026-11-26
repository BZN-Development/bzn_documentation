# bzn_documentation

Documentation for [bzn](https://github.com/BZN-Development/bzn_core), a modular,
performance-first FiveM framework. Built with [Fumadocs](https://fumadocs.dev) (Next.js,
static export) and published to GitHub Pages on every push to `main`.

## Working on the docs

```sh
npm install
npm run dev      # http://localhost:3000/bzn_documentation with live reload
npm run build    # what CI builds, into out/
```

## Where things are

| | |
| --- | --- |
| `content/docs/` | the pages, as MDX. A folder is a section; `index.mdx` is its overview |
| `content/docs/**/meta.json` | the title of a section and the order of its pages in the sidebar |
| `app/(home)/page.tsx` | the front page |
| `components/mdx.tsx` | components pages can use (`Callout`, `Cards`, `Tabs`, `Badge`) |
| `app/global.css` | colours |

A new page is a new `.mdx` file with a title, added to the `pages` list of the `meta.json`
next to it:

```mdx
---
title: "Garages"
---

Text, tables and code as in Markdown.
```

## Writing a page

MDX is Markdown that can hold components, so two characters need care outside code:
write `<` as `&lt;` and `{` as `\{`. Inside backticks and code blocks everything is literal.

- Link to other pages with their address: `[Staff roles](/docs/roles)`.
- A heading gets a fixed anchor with `[#name]` at the end: `## Config [#config]`. Keep it
  when you reword a heading, so links to it keep working.
- A note or a warning:

  ```mdx
  <Callout type="warn" title="Do not check command.bzn">
  Text.
  </Callout>
  ```

## Writing style

- English, short sentences.
- Every function has the same four parts in the same order: what it does, the call with
  its arguments and types, what it returns (with every error string), and an example that
  can be copied.
- **Every function and every hook has an example.** An example shows a real use (a shop, a
  police computer, a speed camera), not `foo` and `bar`.
- Explain the why, not only the what: a reader should be able to learn bzn from the docs
  alone.
- When code changes in bzn_core, the page changes in the same commit round.

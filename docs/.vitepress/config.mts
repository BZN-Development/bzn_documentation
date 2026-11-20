import { defineConfig } from 'vitepress'

const section = (text: string, base: string, pages: [string, string][], collapsed = true) => ({
  text,
  collapsed,
  items: pages.map(([label, path]) => ({ text: label, link: `${base}${path}` })),
})

export default defineConfig({
  title: 'bzn',
  description: 'A modular, performance-first FiveM framework',
  // Served from https://bzn-development.github.io/bzn_documentation/
  base: '/bzn_documentation/',
  cleanUrls: true,
  lastUpdated: true,

  markdown: {
    // server.cfg blocks highlight like ini files
    languageAlias: { cfg: 'ini' },
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Core', link: '/characters/' },
      { text: 'Modules', link: '/modules/groups/' },
      {
        text: 'Reference',
        items: [
          { text: 'Hooks', link: '/hooks/' },
          { text: 'Types', link: '/types' },
          { text: 'Commands', link: '/commands' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Configuration', link: '/config' },
          { text: 'Inventory (ox_inventory)', link: '/inventory' },
          { text: 'Commands', link: '/commands' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ],
      },
      section('Using bzn from your resource', '/using-bzn/', [
        ['Overview', ''],
        ['Server side', 'server'],
        ['Client side', 'client'],
      ], false),
      {
        text: 'Core',
        items: [
          section('Players and characters', '/characters/', [
            ['Overview', ''],
            ['Server', 'server'],
            ['Client', 'client'],
          ]),
          { text: 'Spawning and positions', link: '/spawn' },
          { text: 'Staff roles', link: '/roles' },
          { text: 'Saving and the database', link: '/database' },
        ],
      },
      {
        text: 'Modules',
        items: [
          section('Groups', '/modules/groups/', [['Overview', ''], ['Server', 'server'], ['Client', 'client']]),
          section('Accounts', '/modules/accounts/', [['Overview', ''], ['Server', 'server'], ['Client', 'client']]),
          section('Payroll', '/modules/payroll/', [['Overview', ''], ['Server', 'server']]),
          section('Status', '/modules/status/', [['Overview', ''], ['Server', 'server'], ['Client', 'client']]),
          section('Vehicles', '/modules/vehicles/', [['Overview', ''], ['Server', 'server'], ['Client', 'client']]),
          { text: 'Writing a module', link: '/modules/writing-modules' },
        ],
      },
      {
        text: 'Reference',
        items: [
          section('Hooks', '/hooks/', [['Overview', ''], ['Server hooks', 'server'], ['Client hooks', 'client']]),
          { text: 'Types', link: '/types' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/BZN-Development' }],

    search: { provider: 'local' },

    editLink: {
      pattern: 'https://github.com/BZN-Development/bzn_documentation/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    outline: { level: [2, 3] },
  },
})

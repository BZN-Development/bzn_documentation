import { defineConfig } from 'vitepress'

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
      { text: 'Modules', link: '/modules/groups' },
      { text: 'Hooks', link: '/hooks/' },
    ],

    sidebar: [
      {
        text: 'Setting up',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Configuration', link: '/config' },
          { text: 'Inventory (ox_inventory)', link: '/inventory' },
          { text: 'Commands', link: '/commands' },
        ],
      },
      {
        text: 'Using bzn from your resource',
        items: [
          { text: 'Overview', link: '/using-bzn/' },
          { text: 'Server side', link: '/using-bzn/server' },
          { text: 'Client side', link: '/using-bzn/client' },
        ],
      },
      {
        text: 'Hooks',
        items: [
          { text: 'Overview', link: '/hooks/' },
          { text: 'Server hooks', link: '/hooks/server' },
          { text: 'Client hooks', link: '/hooks/client' },
        ],
      },
      {
        text: 'Core',
        items: [
          { text: 'Players and characters', link: '/characters' },
          { text: 'Spawning and positions', link: '/spawn' },
          { text: 'Staff roles', link: '/roles' },
          { text: 'Saving and the database', link: '/database' },
        ],
      },
      {
        text: 'Modules',
        items: [
          { text: 'Groups', link: '/modules/groups' },
          { text: 'Accounts', link: '/modules/accounts' },
          { text: 'Payroll', link: '/modules/payroll' },
          { text: 'Status', link: '/modules/status' },
          { text: 'Writing a module', link: '/modules/writing-modules' },
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

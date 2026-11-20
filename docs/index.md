---
layout: home

hero:
  name: bzn
  text: A modular, performance-first FiveM framework
  tagline: Small core, switchable modules, built on ox_lib and ox_inventory.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Using bzn from your resource
      link: /using-bzn/
    - theme: alt
      text: GitHub
      link: https://github.com/BZN-Development/bzn_core

features:
  - title: No big player object
    details: No PlayerData blob synced on every change. Each module sends its own small piece of data, only to the player it belongs to, only when it changes.
  - title: No polling
    details: Hunger and thirst are anchors the client computes from its own clock. Salary is counted in memory and paid in one transaction per group. Saves are batched and spread over time.
  - title: Money you can trust
    details: Every money operation is one database transaction with its statement line. A balance can never go negative, not even with a hundred requests at the same moment.
  - title: Crash-safe
    details: No position saved before a confirmed spawn, a starter kit claimed before it is given, salary lowered in the database before it is paid.
  - title: Extend without forking
    details: Before-hooks to add rules, after-hooks to react, spawn providers for housing and jail. Config is overrides only, in its own resource.
  - title: One group model
    details: Jobs, gangs and businesses are all groups with grades, permissions, duty and ACE principals, managed in game without restarts.
---

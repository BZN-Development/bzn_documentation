import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: appName },
    githubUrl: 'https://github.com/BZN-Development',
    links: [
      { text: 'Documentation', url: '/docs', active: 'nested-url' },
      { text: 'Commands', url: '/docs/commands' },
      { text: 'Hooks', url: '/docs/hooks' },
    ],
  };
}

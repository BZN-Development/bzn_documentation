import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';

/** A small label after a heading, e.g. `before` on a before-hook. */
function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="ms-2 align-middle rounded-md border border-fd-primary/40 bg-fd-primary/10 px-1.5 py-0.5 text-xs font-medium text-fd-primary">
      {children}
    </span>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Badge,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

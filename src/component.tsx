import React, { useMemo } from 'react';
import type { CompileResult } from './lib/compiler';
import { MDXProvider, mdx } from '@mdx-js/react';

export interface MDXComponentProps {
  /**
   * A object mapping names to React components.
   * The key used will be the name accessible to MDX.
   *
   * @example { ComponentName: Component } // will be accessible in the MDX as `<ComponentName/>`.
   * @default {}
   */
  components?: Record<string, React.ReactNode>;
  /**
   * A object mapping names to MDX Datas.
   * The key used will be the name accessible to MDX in brackets.
   *
   * @example { user: 'My User' } // will be accessible in the MDX as `<User username={user} />`.
   * @default { ...{}, mdx, React }
   */
  scope?: Record<string, unknown>;
  /**
   * The result of compile.
   */
  code: CompileResult;
}

export const MDXComponent: React.FC<MDXComponentProps> = ({
  components = {},
  scope = {},
  code,
}) => {
  const Content = useMemo(() => {
    const scopes = { ...scope, mdx, React };

    const parameters = Object.keys(scopes); // mdx, React,  ...
    const parameterValues = Object.values(scopes); // require('@mdx-js/react').mdx, require('react'),  ...

    // create a function with scopes as parameters like
    // function hydrate(mdx, React, ...) {
    //   ...MDXCompiledCode;
    //   return MDXContent;
    // }
    const returnMdxContentStatement = `${code}; return MDXContent;`;
    const hydrate = new Function(...parameters, returnMdxContentStatement);

    // returns MDXContent React Element.
    const MDXContent = hydrate(...parameterValues);

    return MDXContent;
  }, [scope, code]);

  return (
    <MDXProvider components={components}>
      <Content />
    </MDXProvider>
  );
};

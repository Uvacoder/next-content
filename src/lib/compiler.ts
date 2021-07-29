import MDXCompiler from '@mdx-js/mdx';
import * as swc from '@swc/core';
import type { Compiler, Pluggable } from 'unified';

const swcOptions: swc.Options = {
  jsc: {
    parser: {
      syntax: 'ecmascript',
      jsx: true,
    },
    target: 'es2020',
    loose: true,
  },
  minify: process.env.NODE_ENV === 'production' ? true : false,
};

const mdxOptions = { skipExport: true };

export interface CompileOptions {
  /**
   * These options are passed to the MDX compiler.
   * See [the MDX docs.](https://github.com/mdx-js/mdx/blob/master/packages/mdx/index.js).
   */
  mdxOptions?: {
    remarkPlugins?: Pluggable[];
    rehypePlugins?: Pluggable[];
    hastPlugins?: Pluggable[];
    compilers?: Compiler[];
    filepath?: string;
  };

  swcOptions?: swc.Options;
}

export type CompileOutput = string;

export type Compile = (
  mdxSource: string,
  options?: CompileOptions
) => Promise<CompileOutput>;

export const compile: Compile = async (mdxSource, options) => {
  const mdxCompiledJsx = await MDXCompiler(mdxSource, {
    // can't overwrite the default options
    ...options?.mdxOptions,
    ...mdxOptions,
  });

  const { code } = await swc.transform(mdxCompiledJsx, {
    // can overwrite the default options
    ...swcOptions,
    ...options?.swcOptions,
  });

  return code;
};

import MDXCompiler from "@mdx-js/mdx";
import swc, { Options, Output } from "@swc/core";

const swcOptions: Options = {
  jsc: {
    parser: {
      syntax: "ecmascript",
      jsx: true,
    },
    target: "es2020",
    loose: true,
  },
  minify: process.env.NODE_ENV === "production" ? true : false,
};

const mdxOptions = { skipExport: true };

export interface CompileOptions {
  mdxOptions?: any;
}

export type CompileResult = Output["code"];

export type CompileFunction = (
  mdxSource: string,
  options?: CompileOptions
) => Promise<CompileResult>;

export const compile: CompileFunction = async (mdxSource) => {
  const mdxCompiledJsx = await MDXCompiler(mdxSource, mdxOptions);

  const { code } = await swc.transform(mdxCompiledJsx, swcOptions);

  return code;
};

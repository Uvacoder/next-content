import fg from "fast-glob";
import fs from "fs";
import path from "path";
import { parseMatter } from "./lib/utils";
import { CompileResult, compile } from "./lib/compiler";

export interface NextContentOptions {
  /**
   * path to all content files directory.
   * @example directory: './content' // or 'content'
   */
  directory: string;
}

interface ContentTemplate<F> {
  data: F;
  slug: string;
  content: string;
}

interface FetchResult<F = {}> {
  data: F;
  slug: string;
  code: CompileResult;
}

export type ThisManager = Omit<NextContentManager, "content">;

const extension = "mdx";

export class NextContentManager<F = {}> {
  private directory: NextContentOptions["directory"];
  private cwd: string;
  private currentContents: ContentTemplate<F>[];
  private currentContent: ContentTemplate<F>;
  private base: string;

  constructor(public options: NextContentOptions) {
    this.directory = options.directory;
    this.cwd = process.cwd();
    this.base = path.join(this.cwd, this.directory);
  }

  private path(...paths: string[]) {
    for (const pathname of paths) {
      const index = paths.indexOf(pathname);
      const isLast = index === paths.length - 1;
      console.log(path.join(this.base, pathname));
      if (isLast && fs.statSync(path.join(this.base, pathname)).isFile()) {
        paths[index] = `${pathname}.mdx`;
      }
    }

    return path.join(this.base, ...paths);
  }

  private isExist(...pathname: string[]) {
    const fullPath = this.path(...pathname);
    return {
      exist: fs.existsSync(fullPath),
      pathname: fullPath,
    };
  }

  private slug(fullPath: string) {
    return fullPath.replace(this.base, "");
  }

  private readContent(...file: string[]): ContentTemplate<F> {
    const fullPath = this.path(...file);
    const plainText = fs.readFileSync(fullPath, "utf8");
    const { content, data } = parseMatter(plainText) as {
      content: string;
      data: F;
    };

    return {
      content,
      slug: this.slug(fullPath),
      data,
    };
  }

  private readContents(files: string[]): ContentTemplate<F>[] {
    const contents = [];

    for (const file of files) {
      console.log(files);
      contents.push(this.readContent(file));
    }

    return contents;
  }

  private reset() {
    this.currentContents = null;
    this.currentContent = null;
  }

  /**
   *
   */
  public content(...fileOrDirectory: string[]): ThisManager {
    const { exist, pathname } = this.isExist(...fileOrDirectory);

    if (!exist) throw new Error(`Cannot find directory or file: ${pathname}`);

    const contentPath = this.path(...fileOrDirectory);

    const stats = fs.statSync(contentPath);

    if (stats.isDirectory()) {
      const files = fs.readdirSync(contentPath);

      this.currentContents = this.readContents(files);
    } else {
      this.currentContent = this.readContent(...fileOrDirectory);
    }

    return this;
  }

  /**
   * returns `content Array or content Object`
   * @example
   * const content = NextContent({
   *    directory: "content",
   * });
   *
   * content('articles', 'who-am-i').fetch() // { code: '...', slug: '/articles/who-am-i', data: { ... } }
   */
  public async fetch(): Promise<FetchResult<F>[] | FetchResult<F>> {
    let pass: FetchResult<F> | FetchResult<F>[] = [];

    const toFetchResult = async ({ content, slug, data }: ContentTemplate<F>): Promise<FetchResult<F>> => {
      const code = await compile(content);

      return {
        code,
        slug,
        data,
      };
    };

    if (this.currentContents) {
      for (const contentTemplate of this.currentContents) {
        pass.push(await toFetchResult(contentTemplate));
      }
    } else if (this.currentContent) {
      pass = await toFetchResult(this.currentContent);
    }

    if (!pass) throw new Error("No content to fetch");

    this.reset();
    return pass;
  }
}

export const NextContent = <T>(options: NextContentOptions): NextContentManager["content"] => {
  const nextContentManager = new NextContentManager<T>(options);
  return nextContentManager.content.bind(nextContentManager);
};

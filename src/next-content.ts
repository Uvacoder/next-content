import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import Utils from './lib/utils';
import { QueryServer } from './lib/query-server';

export interface NextContentOptions {
  /**
   * absolute path to directory of content files.
   * @example directory: 'content' // or './content' equal to {cwd}/content
   */
  directory?: string;
}

export interface ContentTemplate<T = Record<string, any>> {
  data: T;
  slug: string;
  content: string;
}

export interface ContentOptions {
  /**
   * @description includes sub directories in specified directory.
   * @default false
   */
  deep?: boolean;
  /**
   * @description returns raw text of content files in text key in fetchResult
   * @default false
   */
  text?: boolean;
  /**
   * @description skips the completion step and doesn't returns code key.
   * @default false
   */
  skipCompile?: boolean;
}

class NextContentManager {
  private directory: NextContentOptions['directory'];
  private cwd: string = process.cwd();
  private base: string;

  constructor(public options: NextContentOptions) {
    this.directory = options.directory;
    this.base = path.join(this.cwd, this.directory);
  }

  private path(
    paths: string[],
    options: { addExtension?: boolean } = { addExtension: true }
  ) {
    // ['articles', 'react',  'what-is-react'] to ['articles', 'react',  'what-is-react.mdx']
    // { addExtension: false } - skip mapping
    if (options.addExtension) {
      paths = paths.map((pathname, index) => {
        const isLast = index === paths.length - 1;
        if (isLast) {
          pathname = `${pathname}.mdx`;
        }

        return pathname;
      });
    }

    // {cwd}/content/articles/react/what-is-react.mdx if { addExtension: true }
    return path.join(this.base, ...paths);
  }

  private isExist(pathname: string[]): { exist: boolean; directory: boolean } {
    // test with no extension
    const isDirectory = fs.existsSync(
      this.path(pathname, { addExtension: false })
    );

    // if it's exist probably it's directory or extension-less file
    if (isDirectory) {
      return {
        exist: true,
        directory: true,
      };
    } else {
      const absolutePathToFile = this.path(pathname);

      return {
        exist: fs.existsSync(absolutePathToFile),
        directory: false,
      };
    }
  }

  private removeBase(fullPath: string) {
    return fullPath.replace(this.base, '');
  }

  private slug(relative: string) {
    return Utils.removeExtension(relative);
  }

  private readContent(relativePath: string): ContentTemplate {
    const fullPath = this.path([relativePath]);

    const plainText = fs.readFileSync(fullPath, 'utf8');
    const { content, data } = Utils.parseMatter(plainText) as Omit<
      ContentTemplate,
      'slug'
    >;

    return {
      content,
      slug: this.slug(relativePath),
      data,
    };
  }

  private readContents(files: string[]): ContentTemplate[] {
    return files.map((relativePath) => {
      return this.readContent(Utils.removeExtension(relativePath));
    });
  }

  // not reusable function.
  private parseContentParams(params: [...string[], ContentOptions | string]) {
    const lastEl = params[params.length - 1];
    const options = typeof lastEl === 'object' ? lastEl : {};

    const fileOrDirectory = (
      Object.keys(options).length ? params.slice(0, -1) : params
    ) as string[];

    return { options, fileOrDirectory };
  }

  public content<T>(...pathOrOptions: [...string[], ContentOptions | string]) {
    const { fileOrDirectory, options } = this.parseContentParams(pathOrOptions);

    const { directory } = this.isExist(fileOrDirectory);

    const contentPath = this.path(fileOrDirectory, {
      addExtension: !directory,
    });

    const stats = fs.statSync(contentPath);

    const contents = [];

    if (stats.isDirectory()) {
      let files;

      if (!options.deep) {
        files = fg.sync('*.mdx', { cwd: contentPath });
      } else {
        files = fg.sync(`**.mdx`, { cwd: contentPath });
      }

      // my-content.mdx to /articles/(sub-dir)?/my-content.mdx
      const fullRelatives = files.map((fileName) => {
        fileName = this.removeBase(path.join(contentPath, fileName));

        return fileName;
      });
      contents.push(...this.readContents(fullRelatives));
    } else {
      const files = fileOrDirectory;

      // select last element and remove .mdx extension.
      const filePath = this.slug(files.join('/'));

      contents.push(this.readContent(filePath));
    }

    return new QueryServer<T>(contents, options);
  }
}

export const NextContent = (
  options: NextContentOptions
): NextContentManager['content'] => {
  const manager = new NextContentManager(options);
  return manager.content.bind(manager);
};

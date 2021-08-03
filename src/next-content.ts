import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import Utils from './lib/utils';
import { QueryServer } from './lib/query-server';
import { CompileOptions } from './lib/serialize';
import { parseToc } from './lib/plugins';

export interface NextContentOptions extends CompileOptions {
  /**
   * absolute path to directory of content files.
   * @example directory: 'content' // or './content' equal to {cwd}/content
   */
  directory?: string;
  /**
   * Allowed content file extensions.
   * @default ['.mdx']
   */
  extensions?: string[];
}

export interface ContentTemplate<T = Record<string, any>> {
  data: Partial<T>;
  path: string;
  dir: string;
  toc: { depth: number; text: string; id: string }[];
  extension: string;
  excerpt?: string;
  slug: string[];
  text: string;
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
}

class NextContentManager {
  private cwd: string = process.cwd();
  private base: string;

  constructor(public options: NextContentOptions) {
    this.options = { extensions: ['.mdx'], ...options };
    this.base = path.join(this.cwd, this.options.directory);
  }

  private makeTree() {
    const pattern = '**';

    // read all files in base directory
    const globs = fg.sync(pattern, { cwd: this.base, onlyFiles: false });

    // filter globs by extensions
    const files = globs.filter((shortPath) => {
      return this.options.extensions.some((ext) => shortPath.endsWith(ext));
    });

    // filter globs that directory
    const dirs = globs.filter((shortPath) => {
      return fs.statSync(this.path(shortPath)).isDirectory();
    });

    return {
      files,
      dirs,
    };
  }

  private path(...paths: string[]) {
    return path.join(this.base, ...paths);
  }

  private withExtension(path: string) {
    const extensions = this.options.extensions;
    let extension: string;

    for (const ext of extensions) {
      const isExist = fs.existsSync(this.path(path + ext));

      // if the file with extension exist, return current ext.
      if (isExist) {
        extension = ext;
        break;
      }
    }

    return path + extension;
  }

  private removeBase(fullPath: string) {
    return fullPath.replace(this.base, '');
  }

  private paths(shortPath: string) {
    if (shortPath.startsWith('/')) shortPath = shortPath.slice(1);

    const noExt = Utils.removeExtension(shortPath);

    return {
      path: `/${noExt}`,
      extension: path.extname(shortPath),
      dir: path.dirname(`/${shortPath}`),
      slug: noExt.split('/'),
    };
  }

  private readContent(shortPath: string): ContentTemplate {
    const fullPath = this.path(shortPath);

    const plainText = fs.readFileSync(fullPath, 'utf8');

    const { content: text, data, excerpt } = Utils.parseMatter(plainText);

    const toc = parseToc(text);

    const paths = this.paths(shortPath);

    return {
      text,
      data,
      toc,
      excerpt: excerpt.length ? excerpt : undefined,
      ...paths,
    };
  }

  private readContents(files: string[]): ContentTemplate[] {
    return files.map((shortPath) => {
      return this.readContent(shortPath);
    });
  }

  // not reusable function.
  private parseContentParams(params: [...string[], ContentOptions | string]) {
    const lastEl = params.pop();
    const options = typeof lastEl === 'object' ? lastEl : undefined;

    const fileOrDirectory = options ? params : params.concat(lastEl);

    return {
      options: options ? options : {},
      fileOrDirectory: fileOrDirectory as string[],
    };
  }

  public content<T>(...pathOrOptions: [...string[], ContentOptions | string]) {
    // read the up-to-date content files
    const tree = this.makeTree();

    const { fileOrDirectory, options } = this.parseContentParams(pathOrOptions);

    const joinPath = path.join(...fileOrDirectory);

    let isDirectory = tree.dirs.includes(joinPath);
    const isFile = !isDirectory
      ? // is filename startswith joinPath
        tree.files.some((n) => n.startsWith(joinPath))
      : false;
    if (joinPath === '.' || joinPath === './') {
      isDirectory = true;
    }
    const contents = [];

    if (isDirectory) {
      const files = tree.files
        .map((name) => {
          // if the deep option is not enabled and the directory length is greater than 1 return null
          if (!options.deep && path.dirname(name).split('/').length > 1)
            return null;

          return this.removeBase(`/${name}`);
        })
        .filter((n) => n !== null);

      contents.push(...this.readContents(files));
    } else if (isFile) {
      // add extension to joinPath
      const file = this.withExtension(joinPath);

      // join paths
      const shortPath = path.join(file);

      contents.push(this.readContent(shortPath));
    } else {
      console.error(`${joinPath} not found in ${this.base}`);
    }

    return new QueryServer<T>(contents, {
      content: options,
      root: this.options,
    });
  }
}

export const NextContent = (
  options: NextContentOptions
): NextContentManager['content'] => {
  const manager = new NextContentManager(options);
  return manager.content.bind(manager);
};

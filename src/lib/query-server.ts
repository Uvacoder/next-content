import {
  ContentTemplate,
  ContentOptions,
  NextContentOptions,
} from '../next-content';
import { SerializeOutput, serialize } from './serialize';
import { Query } from './query';
import Utils from './utils';

export interface FetchResult<T = Record<string, unknown>>
  extends Omit<ContentTemplate<T>, 'text'> {
  compiledContent?: SerializeOutput;
  text?: string;
}

export interface FetchOptions {
  /**
   * @description skips the completion step and doesn't returns compiledContent key.
   * @default false
   */
  skipCompile?: boolean;
  /**
   * @description the result should serialized as json?
   * @default true
   */
  json?: boolean;
}

export class QueryServer<T> extends Query<FetchResult<T>> {
  private options: {
    root: NextContentOptions;
    content: ContentOptions;
  };

  constructor(
    contents: ContentTemplate<T>[],
    options: QueryServer<T>['options']
  ) {
    super(
      contents.map((rest) => ({
        ...rest,
        compiledContent: undefined,
      }))
    );

    this.options = options;
  }

  private async toFetchResult(
    content: FetchResult<T>,
    options: FetchOptions = {}
  ): Promise<FetchResult<T>> {
    const returns: FetchResult<T> = Utils.omit(content, [
      'text',
      'compiledContent',
    ]) as Omit<FetchResult<T>, 'text' | 'compiledContent'>;

    if (!options.skipCompile) {
      returns.compiledContent = await serialize(
        content.text,
        this.options.root
      );
      if (content.excerpt)
        returns.excerpt = await serialize(content.excerpt, this.options.root);
    }

    if (this.options.content.text) returns.text = content.text;
    if (!options.hasOwnProperty('json')) options.json = true;

    // make it json serializable for next.js
    return options.json ? JSON.parse(JSON.stringify(returns)) : returns;
  }

  /**
   * @description Ends the chain sequence and collects data.
   */
  public async fetch(options: FetchOptions = {}): Promise<FetchResult<T>[]> {
    const contents: FetchResult<T>[] = [];
    const filteredContents = this.apply();
    if (filteredContents.length) {
      for (const content of filteredContents) {
        if (content === null) {
          contents.push(null);
          continue;
        }

        contents.push(await this.toFetchResult(content, options));
      }
    }

    return contents;
  }

  public async first(
    options: FetchOptions = {}
  ): Promise<FetchResult<T> | null[]> {
    const firstContent = this.apply()[0];

    if (firstContent === undefined) return Promise.resolve([null]);

    return await this.toFetchResult(firstContent, options);
  }

  public params(): { path: string; slug: string[] }[] {
    return this.only(['path', 'slug']).apply();
  }
}

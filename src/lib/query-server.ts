import {
  ContentTemplate,
  ContentOptions,
  NextContentOptions,
} from '../next-content';
import { CompileOutput, compile, CompileOptions } from './compiler';
import { Query } from './query';

export interface FetchResult<T = Record<string, unknown>>
  extends Omit<ContentTemplate<T>, 'text'> {
  compiledContent?: CompileOutput;
  text?: string;
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
        code: undefined,
      }))
    );

    this.options = options;
  }

  private async toFetchResult(
    content: FetchResult<T>
  ): Promise<FetchResult<T>> {
    const returns: FetchResult<T> = {
      slug: content.slug,
      data: content.data,
      path: content.path,
    };

    const compileOptions: CompileOptions = { ...this.options.root };

    if (!this.options.content.skipCompile)
      returns.compiledContent = await compile(content.text, compileOptions);
    if (this.options.content.text) returns.text = content.text;

    return returns;
  }

  /**
   * @description Ends the chain sequence and collects data.
   */
  public async fetch(): Promise<FetchResult<T>[]> {
    const contents: FetchResult<T>[] = [];
    const filteredContents = this.apply();
    if (filteredContents.length) {
      for (const content of filteredContents) {
        contents.push(await this.toFetchResult(content));
      }
    }

    return contents;
  }

  public async first(): Promise<FetchResult<T>> {
    const firstContent = this.apply()[0];

    return await this.toFetchResult(firstContent);
  }

  public params(): { path: string; slug: string }[] {
    return this.only(['path', 'slug']).apply();
  }
}

import { ContentTemplate, ContentOptions } from '../next-content';
import { CompileResult, compile } from './compiler';
import { Query } from './query';

export interface FetchResult<T> extends Omit<ContentTemplate<T>, 'content'> {
  code?: CompileResult;
  text?: string;
}

export class QueryServer<T> extends Query<FetchResult<T>> {
  private contentOptions: ContentOptions;

  constructor(
    contents: ContentTemplate<T>[],
    contentOptions: ContentOptions = {}
  ) {
    super(
      contents.map(({ data, slug, content }) => ({
        data,
        slug,
        code: undefined,
        text: content,
      }))
    );

    this.contentOptions = contentOptions;
  }

  private async toFetchResult(
    content: FetchResult<T>
  ): Promise<FetchResult<T>> {
    const returns: FetchResult<T> = {
      slug: content.slug,
      data: content.data,
    };

    if (!this.contentOptions.skipCompile)
      returns.code = await compile(content.text);
    if (this.contentOptions.text) returns.text = content.text;

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

  public params(): string[] {
    const filteredContents = this.apply();

    let params;

    if (filteredContents.length) {
      params = filteredContents.map((content) => content.slug);
    } else {
      throw new Error('You must have contents to get params.');
    }

    return params;
  }
}

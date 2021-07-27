import { Query } from './query';
import { FetchResult } from './query-server';

export class QueryClient<T> extends Query<FetchResult<T>> {
  private contents: FetchResult<T>[];

  constructor(contents: FetchResult<T>[]) {
    if (contents.some((content) => !content.text))
      console.error(
        'the text field in content is required, please enable text option in content.'
      );
    super(
      contents.map(({ data, text, slug }) => ({
        data,
        slug,
        text,
        code: undefined,
      }))
    );
    this.contents = contents;
  }

  public fetch() {
    // const contents = this.apply();
    return this.apply();
  }
}

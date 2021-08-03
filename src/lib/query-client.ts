import { Query } from './query';
import { FetchResult } from './query-server';

export class QueryClient<T> extends Query<FetchResult<T>> {
  constructor(contents: FetchResult<T>[]) {
    super(contents);
  }

  public fetch() {
    return this.apply();
  }

  public first() {
    return this.fetch()[0];
  }
}

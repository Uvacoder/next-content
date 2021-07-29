import FlexSearch from 'flexsearch';
import Utils from './utils';

const functions = {
  skip(number, contents) {
    // remove the first n items
    return contents.slice(number);
  },

  limit(number, contents) {
    // get the first n items
    return contents.slice(0, number);
  },

  only(fields, contents) {
    // get only the specified fields
    return contents.map((content) => Utils.pick(content, fields));
  },

  search({ field, search }, contents) {
    const index = new FlexSearch.Index({
      language: 'en',
    });

    for (const content of contents) {
      const i = contents.indexOf(content);

      const fieldValue = Utils.getValue(content, field);

      index.add(i, fieldValue);
    }

    const contentIndexes = index.search(search.trim());

    return contents.reduce((all: unknown[], currentContent, currentIndex) => {
      if (contentIndexes.some((Index) => Index === currentIndex))
        all.push(currentContent);

      return all;
    }, []) as unknown[];
  },

  sortBy({ field, direction }, contents) {
    // order contents by field
    return Utils.orderBy(contents, field, direction);
  },

  without(fields, contents) {
    // exclude specified fields
    return contents.map((content) => Utils.omit(content, fields));
  },

  surround({ path, options: { after, before } }, contents) {
    const findWith = path.startsWith('/') ? 'slug' : 'path';
    const main = contents.findIndex((content) => content[findWith] === path);

    if (main === -1) {
      return new Array(before + after).fill(null, 0);
    }

    const map = (n: 'prev' | 'next') => {
      const isNext = n === 'next';

      return new Array(isNext ? after : before).map((_, i) => {
        i = i + 1;
        const index = isNext ? main + i : main - i;

        return contents[index] ? contents[index] : null;
      });
    };

    const prevs = map('prev');
    const nexts = map('next');

    return [...prevs, ...nexts];
  },
};

export class Query<P> {
  private templates: P[];
  private functions: { type: keyof typeof functions; value: any }[] = [];
  private postprocess: (() => void)[] = [];

  constructor(contents: P[]) {
    this.templates = contents;
  }

  public skip(number: number) {
    this.functions.push({
      type: 'skip',
      value: typeof number === 'string' ? parseInt(number) : number,
    });

    return this;
  }

  public limit(number: number) {
    this.functions.push({
      type: 'limit',
      value: typeof number === 'string' ? parseInt(number) : number,
    });

    return this;
  }

  public only(fields: (keyof P | `data.${keyof P['data']}`)[]) {
    this.functions.push({
      type: 'only',
      value: fields,
    });

    return this;
  }

  /**
   * @description removes specified fields from the contents
   * @returns this instance
   */
  public without(fields: (keyof P | `data.${keyof P['data']}`)[]) {
    this.functions.push({
      type: 'without',
      value: fields,
    });

    return this;
  }
  /**
   * @description searchs a value in a field and includes documents that match
   * @returns this instance
   */
  public search(field: keyof P | `data.${keyof P['data']}`, search: string) {
    this.functions.push({
      type: 'search',
      value: {
        field,
        search,
      },
    });

    return this;
  }
  /**
   * @description sorts contents by field and direction
   * @returns this instance
   */
  public sortBy(
    field: keyof P | `data.${keyof P['data']}`,
    direction: 'asc' | 'desc' = 'asc'
  ) {
    this.functions.push({
      type: 'sortBy',
      value: {
        field,
        direction,
      },
    });

    return this;
  }

  /**
   * @description Get prev and next results around a specific slug or path.
   * @returns this instance
   */
  public surround(
    path: string,
    options: { before: number; after: number } = { before: 1, after: 1 }
  ) {
    this.functions.push({
      type: 'surround',
      value: { path, options },
    });

    this.postprocess.push(() => {
      // if functions includes surround; remove limit, skip, search from functions
      if (this.functions.some((fn) => fn.type === 'surround'))
        this.functions = this.functions.filter((fn) => {
          return !(
            fn.type === 'limit' ||
            fn.type === 'skip' ||
            fn.type === 'search'
          );
        });

      this.functions = this.functions.map((fn) => {
        const fields = fn.value.fields;
        if (fn.type === 'without') {
          const slugIndex = fields.indexOf('slug');
          if (slugIndex > -1) {
            fields.splice(slugIndex, 1);
          }
        } else if (fn.type === 'only') {
          fields.push('slug');
        }

        return fn;
      });
    });

    return this;
  }

  /**
   * @description applies the queries to the contents
   */
  public apply(): P[] {
    // copy the contentTemplates to avoid change contentTemplates
    let contents = [...this.templates];

    // manipulate the this with postprocess functions.
    for (const postprocess of this.postprocess) postprocess();

    // apply queries dynamicly from this.functions
    for (const { type, value } of this.functions) {
      const query = functions[type];

      contents = query(value, contents);
    }

    // reset functions to reuse the query
    this.functions = [];
    return contents;
  }
}

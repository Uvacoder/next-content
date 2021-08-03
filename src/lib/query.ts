//@ts-nocheck
import Filters from './filters';

// ---------------------------------------------------------------------- \\

export class Query<P> {
  private templates: P[];
  private filters: { type: keyof Filters; value: any }[] = [];
  private postprocess: (() => void)[] = [];

  constructor(contents: P[]) {
    this.templates = contents;
  }

  public skip(number: number) {
    this.filters.push({
      type: 'skip',
      value: typeof number === 'string' ? parseInt(number) : number,
    });

    return this;
  }

  public limit(number: number) {
    this.filters.push({
      type: 'limit',
      value: typeof number === 'string' ? parseInt(number) : number,
    });

    return this;
  }

  public only(fields: (keyof P | `data.${keyof P['data']}`)[]) {
    this.filters.push({
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
    this.filters.push({
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
    this.filters.push({
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
    this.filters.push({
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
    this.filters.push({
      type: 'surround',
      value: { path, options },
    });

    this.postprocess.push(() => {
      // if functions includes surround; remove limit, skip, search from functions
      if (this.filters.some((fn) => fn.type === 'surround'))
        this.filters = this.filters.filter((fn) => {
          return !(
            fn.type === 'limit' ||
            fn.type === 'skip' ||
            fn.type === 'search'
          );
        });

      this.filters = this.filters.map((fn) => {
        const fields = fn.value.fields as string[];
        const keys = ['slug', 'path'];

        if (fn.type === 'without') {
          for (const key of keys) {
            const index = fields.indexOf(key);
            if (index > -1) {
              fields.splice(index, 1);
            }
          }
        } else if (fn.type === 'only') {
          fields.push(...keys);
        }

        return fn;
      });
    });

    return this;
  }

  process(
    field:
      | keyof P
      | `data.${keyof P['data']}`
      | ((content: P) => boolean | void | P),
    fn?: (fieldValue: any) => boolean | void | P[keyof P]
  ) {
    this.filters.push({
      type: 'process',
      value: {
        fn: typeof field === 'function' ? field : fn,
        field: typeof field === 'string' ? field : undefined,
      },
    });

    return this;
  }

  /**
   * @description applies the queries to the contents
   */
  public apply(): (P | null)[] {
    // manipulate the this with postprocess functions.
    for (const postprocess of this.postprocess) postprocess();

    // shallow copy the content templates to avoid change this.templates
    const filters = new Filters([...this.templates]);

    // apply queries dynamicly from this.filters
    for (const { type, value } of this.filters)
      (filters[type] as Function)(value);

    // reset functions to reuse the query
    this.filters = [];
    this.postprocess = [];

    return filters.contents as (P | null)[];
  }
}

import unset from 'lodash.unset';

const omit = (object: Record<string, unknown>, blackList: string[]) => {
  const clone = { ...object };

  for (const path of blackList) {
    unset(clone, path);
  }

  return clone;
};

import pick from 'lodash.pick';
import orderBy from 'lodash.orderby';

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
    return contents.map((content) => {
      // pick content fields with lodash.pick - https://lodash.com/docs/4.17.15#pick
      return pick(content, fields);
    });
  },

  sortBy({ field, direction }, contents) {
    // order contents with lodash.orderby - https://lodash.com/docs/4.17.15#orderBy
    return orderBy(contents, [field], [direction]);
  },

  without(fields, contents) {
    return contents.map((content) => {
      // exclude content fields with omit using unset - https://lodash.com/docs/4.17.15#unset
      return omit(content, fields);
    });
  },
};

export class Query<P> {
  private contentTemplates: P[];
  private functions: { type: string; value: any }[] = [];

  constructor(contents: P[]) {
    this.contentTemplates = contents;
  }

  public only(fields: (keyof P | string)[]) {
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
  public without(fields: (keyof P | string)[]) {
    this.functions.push({
      type: 'without',
      value: fields,
    });

    return this;
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

  public sortBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    this.functions.push({
      type: 'sortBy',
      value: {
        field,
        direction,
      },
    });

    return this;
  }

  public apply(): P[] {
    // copy the contentTemplates to avoid change contentTemplates
    let contents = [...this.contentTemplates];

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

import FlexSearch from 'flexsearch';
import Utils from './utils';

class Filters {
  public contents: unknown[];

  constructor(contents: unknown[]) {
    this.contents = contents;
  }

  public skip(number) {
    // remove the first n items

    this.contents = this.contents.slice(number);
  }

  public limit(number) {
    // get the first n items
    this.contents = this.contents.slice(0, number);
  }

  public only(fields) {
    // get only the specified fields
    this.contents = this.contents.map((content) => Utils.pick(content, fields));
  }

  public search({ field, search }) {
    const index = new FlexSearch.Index({
      language: 'en',
    });

    const contents = this.contents;

    for (const content of contents) {
      const i = contents.indexOf(content);

      const fieldValue = Utils.getValue(content, field);

      index.add(i, fieldValue);
    }

    const contentIndexes = index.search(search.trim());

    this.contents = contents.reduce(
      (all: unknown[], currentContent, currentIndex) => {
        if (contentIndexes.some((Index) => Index === currentIndex))
          all.push(currentContent);

        return all;
      },
      []
    ) as unknown[];
  }

  public sortBy({ field, direction }) {
    // order contents by field
    this.contents = Utils.orderBy(this.contents, field, direction);
  }

  public without(fields) {
    // exclude specified fields
    this.contents = this.contents.map((content) => Utils.omit(content, fields));
  }

  public surround({ path, options: { after, before } }) {
    const findWith = path.startsWith('/') ? 'path' : 'slug';

    const main = this.contents.findIndex(
      (content) => content[findWith] === path
    );

    if (main === -1) {
      // create an empty array with before and after
      return new Array(before + after).fill(null, 0);
    }

    const map = (n: 'prev' | 'next') => {
      const isNext = n === 'next';

      // create an array with length after or before then fill it with nulls because map skips undefined values.
      return new Array(isNext ? after : before).fill(null, 0).map((_, i) => {
        i = i + 1;
        const index = isNext ? main + i : main - i;

        return this.contents[index] ? this.contents[index] : null;
      });
    };

    const prevs = map('prev');
    const nexts = map('next');
    const surround = [...prevs, ...nexts];

    this.contents = surround;
  }

  // fn -> function
  // field -> string or undefined
  public process({ fn, field }) {
    // for loop non-null contents
    for (let content of this.contents.filter((c) => c !== null)) {
      let fieldValue;

      // get index of content
      const contentIndex = this.contents.indexOf(content);

      // if field is string so not undefined, get value of content field
      if (typeof field === 'string')
        fieldValue = Utils.getValue(content, field);

      // if fieldValue exist run fn with parameter fieldValue, if not run with content
      const boolOrValue = fn(fieldValue ? fieldValue : content);

      // if returns false remove content from array
      if (boolOrValue === false) {
        this.contents.splice(contentIndex, 1);
        // if doesn't returns boolean and the fieldValue exist update key of field
      } else if (typeof boolOrValue !== 'boolean' && fieldValue) {
        Utils.setKey(content, field, boolOrValue);
        // if the return type object and the field value is undefined replace the new content
      } else if (typeof boolOrValue === 'object' && !fieldValue) {
        // replace position with new content
        this.contents.splice(contentIndex, 1, boolOrValue);
      }
    }
  }
}

export default Filters;

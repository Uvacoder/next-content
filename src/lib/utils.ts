import matter from 'gray-matter';
import set from 'lodash.set';

class Utils {
  public static parseMatter(value: string): {
    content: string;
    data: Record<string, unknown>;
  } {
    return matter(value);
  }

  public static removeExtension(filename: string): string {
    if (!filename.includes('.mdx')) return filename;
    const dotted = filename.split('.');
    dotted.pop();
    return dotted.join('.');
  }

  // manipulates the object and delete specified path
  public static unset(ref: Record<string, any>, path: string) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    for (const key of keys) {
      ref = ref[key];
    }

    delete ref[lastKey];

    return ref;
  }

  private static clone(object: Record<string, any>) {
    return JSON.parse(JSON.stringify(object));
  }

  public static omit(object: Record<string, any>, blackList: string[]) {
    const clone = this.clone(object);

    for (const path of blackList) {
      this.unset(clone, path);
    }

    return clone;
  }

  public static pick(object: Record<string, any>, whiteList: string[]) {
    let clone = this.clone(object);

    const blackList = whiteList.filter((path) => !(path in clone));
    clone = this.omit(clone, blackList);

    return clone;
  }

  public static getValue(object: Record<string, any>, path: string) {
    let clone = this.clone(object);
    const keys = path.split('.');

    for (const key of keys) {
      clone = clone[key];
    }

    return clone;
  }

  // set path to value deeply nested
  public static setKey(
    object: Record<string, any>,
    path: string,
    value: unknown
  ) {
    const copy = this.clone(object);

    set(copy, path, value);

    return copy;
  }

  public static orderBy(array: any[], path: string, order: 'asc' | 'desc') {
    const asc = order === 'asc';

    const comparer = new Intl.Collator('en', {
      numeric: true,
      sensitivity: 'base',
    });
    return array.sort((a, b) => {
      let result = 0;

      const aValue = this.getValue(a, path);
      const bValue = this.getValue(b, path);

      // if a string b is string.
      if (typeof aValue === 'string') {
        const compare = comparer.compare(
          aValue as string,
          bValue as unknown as string
        );

        return asc ? compare : -compare;
      }

      if (aValue > bValue) {
        result = 1;
      } else if (aValue < bValue) {
        result = -1;
      } else if (aValue === bValue) {
        return 0;
      }

      return result * (asc ? 1 : -1);
    });
  }
}

export default Utils;

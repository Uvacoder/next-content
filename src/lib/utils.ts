import matter from 'gray-matter';
import path from 'path';

class Utils {
  public static parseMatter(value: string) {
    return matter(value, {
      excerpt: true,
      excerpt_separator: '<!-- more -->',
    });
  }

  // remove extension from file name
  public static removeExtension(filename: string) {
    const ext = path.extname(filename);

    return filename.replace(ext, '');
  }

  private static set(ref: Record<string, any>, path: string, value: unknown) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    for (const key of keys) {
      ref = ref[key];
    }

    ref[lastKey] = value;
  }

  // manipulates the object and delete specified path
  private static unset(ref: Record<string, any>, path: string) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    for (const key of keys) {
      ref = ref[key];
    }

    delete ref[lastKey];
  }

  // deep clone object resursive
  private static deepClone(object: Record<string, any>) {
    const clone = {};

    for (const key in object) {
      const value = object[key];

      if (typeof value === 'object') {
        clone[key] = this.deepClone(value);
      } else {
        clone[key] = value;
      }
    }

    return clone;
  }

  public static omit(object: Record<string, any>, blackList: string[]) {
    const clone = this.deepClone(object);

    for (const path of blackList) {
      this.unset(clone, path);
    }

    return clone;
  }

  public static pick(object: Record<string, any>, whiteList: string[]) {
    const blackList = whiteList.filter((path) => !(path in object));

    // omit already clones object we don't need to clone it again
    return this.omit(object, blackList);
  }

  public static getValue(object: Record<string, any>, path: string) {
    const keys = path.split('.');

    // we are don't changing value of object don't need clone
    for (const key of keys) {
      object = object[key];
    }

    return object;
  }

  // set path to value deeply nested
  public static setKey(
    object: Record<string, any>,
    path: string,
    value: unknown
  ) {
    this.set(object, path, value);
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

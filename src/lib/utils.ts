import matter from 'gray-matter';

class Utils {
  public static parseMatter(value: string): {
    content: string;
    data: Record<string, any>;
  } {
    return matter(value);
  }

  public static removeExtension(filename: string): string {
    if (!filename.includes('.mdx')) return filename;
    const dotted = filename.split('.');
    dotted.pop();
    return dotted.join('.');
  }
}

export default Utils;

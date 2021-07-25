import matter from "gray-matter";

class Utils {
  public static isArray(value: any): boolean {
    return Array.isArray(value);
  }

  public static isString(value: any): boolean {
    return typeof value === "string";
  }

  public static parseMatter(value: string): { content: string; data: any } {
    return matter(value);
  }
}

export const isArray = Utils.isArray;
export const isString = Utils.isString;
export const parseMatter = Utils.parseMatter;

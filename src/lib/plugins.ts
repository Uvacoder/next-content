import matter from 'gray-matter';

// find all headings and return table of contents with depth, text, and id
export const parseToc = (text: string) => {
  const lines = text.split('\n');
  const toc = [];
  const headings = ['#', '##', '###', '####', '#####', '#######'];

  const isHeading = (line: string) => {
    return headings.some(
      (heading) => line.trim().substring(0, heading.length) === heading
    );
  };

  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }

    if (isHeading(line)) {
      const text = line.replace(/^#+/, '').trim();
      const depth = line.trim().match(/^#+/)[0].length;

      // remove sembolics, toLowerCase and replace spaces with dashes
      const id = text
        .replace(/[^a-zA-Z0-9\-]/g, '')
        .toLowerCase()
        .replace(/\s/g, '-');

      toc.push({
        text,
        depth,
        id,
      });
    }
  }

  return toc;
};

import { NextContent } from '../src/next-content';
import { serialize } from '../src/lib/serialize';

interface ContentFrontmatter {
  title: string;
  description: string;
}

const content = NextContent({
  directory: 'tests/content',
});

describe('fetch', () => {
  test('fetch lorem from articles correctly', async () => {
    const [loremArticle] = await content<ContentFrontmatter>(
      'articles',
      'lorem',
      {
        text: true,
      }
    ).fetch();

    const fronmatter = loremArticle.data;
    const compiled = loremArticle.compiledContent;

    expect(fronmatter.title.trim()).toBe('Lorem ipsum dolor sit amet?');
    expect(fronmatter.description.trim()).toBe(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam aliquam.'
    );

    expect(compiled).toBe(await serialize(loremArticle.text.trim()));
  });

  test('fetch only frontmatters from articles with deep and queries', async () => {
    const articles = await content<ContentFrontmatter>('articles', {
      deep: true,
      text: true,
    })
      .limit(2)
      .sortBy('data.title', 'asc')
      .only(['data', 'text'])
      .without(['data.description'])

      .fetch();

    // test limit
    expect(articles.length).toBe(2);

    // test sortBy
    expect(articles[0].slug).toEqual(['articles', 'lorem']);

    // test only
    expect(articles[0].text).toBeDefined();
    expect(articles[0].data).toBeDefined();

    // test without
    expect(articles[0].data.description).toBeUndefined();
  });

  test('fetch using process and surround', async () => {
    const articles = content<ContentFrontmatter>('articles', {
      deep: true,
      text: true,
    });

    const surroundOfLorem = await articles
      .search('data.title', 'Lorem')
      .surround('lorem')
      .process('data.title', (title) => {
        return title.toLowerCase();
      })
      .process((content) => {
        content.data.description = content.data.description.slice(1);

        return content;
      })
      .fetch();

    // null and react content
    expect(surroundOfLorem.length).toBe(2);

    // react content data.title process
    expect(surroundOfLorem[1].data.title).toBe('What is React?'.toLowerCase());
    expect(surroundOfLorem[1].data.description).toBe(
      "describes React's core concepts and syntax.".slice(1)
    );
  });
});

describe('params', () => {
  test('get params correctly from articles with deep', async () => {
    const params = content('articles', { deep: true }).params();

    expect(params.map((p) => p.slug)).toEqual([
      ['articles', 'lorem'],
      ['articles', 'react', 'what-is-react'],
    ]);
    expect(params.map((p) => p.path)).toStrictEqual([
      '/articles/lorem',
      '/articles/react/what-is-react',
    ]);
  });
});

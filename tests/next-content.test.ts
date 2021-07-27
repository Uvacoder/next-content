import { NextContent } from '../src/next-content';
import { compile } from '../src/lib/compiler';

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
    const code = loremArticle.code;

    expect(fronmatter.title.trim()).toBe('Lorem ipsum dolor sit amet?');
    expect(fronmatter.description.trim()).toBe(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam aliquam.'
    );

    expect(code).toBe(await compile(loremArticle.text.trim()));
  });

  test('fetch only frontmatters from articles with deep and queries', async () => {
    const articles = await content<ContentFrontmatter>('articles', {
      deep: true,
      text: true,
    })
      .sortBy('text', 'asc')
      .only(['data', 'text'])
      .without(['data.description'])
      .limit(2)
      .fetch();

    expect(articles.length).toBe(2);

    expect(articles[0].text).toBeDefined();
    expect(articles[0].data).toBeDefined();

    expect(articles[0].data.description).toBeUndefined();
  });
});

describe('params', () => {
  test('get params correctly from articles with deep', async () => {
    const params = content('articles', { deep: true }).params();

    expect(params).toStrictEqual([
      '/articles/lorem',
      '/articles/react/what-is-react',
    ]);
  });
});

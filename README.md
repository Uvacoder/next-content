# next-content

  <a href="https://github.com/healthpackdev/next-content/actions">
    <img
      src="https://github.com/healthpackdev/next-content/actions/workflows/ci.yml/badge.svg"
    />
  </a>
  <a href="https://npmjs.com/next-content">
    <img src="https://img.shields.io/npm/dm/next-content" />
  </a>
  <a href="https://bundlephobia.com/result?p=next-content">
    <img
      src="https://img.shields.io/bundlephobia/minzip/next-content?label=minzipped%20size"
    />
  </a>
  <a href="https://github.com/healthpackdev/next-content/stargazers">
    <img
      src="https://img.shields.io/github/stars/healthpackdev/next-content"
      alt="Github Stars"
    />
  </a>
  <a href="https://github.com/healthpackdev/next-content/blob/main/LICENSE"
    ><img
      src="https://img.shields.io/github/license/healthpackdev/next-content" /><img
  /></a>

  <a href="https://www.npmjs.com/next-content">
    <img
      src="https://img.shields.io/github/v/release/healthpackdev/next-content?label=latest"
      alt="Github Stable Release"
    />
  </a>
<br>
<br>
A Content manager for Next.js framework.

# Features

- MDX for Markdown
- Powerfull Queries
- Table of Contents generation
- Full-text Search
- Typescript Ready

# Install

Use Node 12 or later.

```
npm install --save next-content
```

`next-content` targets to create and fetch contents,
not fully same as `@nuxt/content` some API changes are happen.

Also currently `next-content` doesn't supports Live Edit and Hot Reload. We need an idea to make it possible.

# Contents

- [Basic Usage](#basic-usage)
  - [Frontmatter](#frontmatter)
- [Server API](#server-api)
  - [`NextContent(options)`](#nextcontent)
    - [`content(...path, options?)`](#content)
- [Client API](#client-api)
  - [`<ContentProvider>`](#contentprovider)
  - [`useContentQuery(Contents?)`](#usecontentquerycontents)
  - [`<MDXComponent>`](#mdxcomponent)
- [Query API](#query-api)
  - [`only(keys)`](#onlykeys)
  - [`without(keys)`](#withoutkeys)
  - [`process(field?, fn)`](#processfield-fn)
  - [`sortBy(key, direction)`](#sortbykey-direction)
  - [`limit(n)`](#limitn)
  - [`skip(n)`](#skipn)
  - [`search(key, value)`](#searchkey-value)
  - [`surround(slugOrPath, options?)`](#surroundslugorpath-options)

# Basic Usage

first of all, you need to initialize `NextContent`

> ⚠️ Note you can initalize NextContent more times but not in getStaticProps just example

```js
import { NextContent } from 'next-content';

export async function getStaticProps() {
  const content = NextContent({
    directory: './content',
  });

  const myContent = await content('my-content').first();

  return {
    props: {
      myContent,
    },
  };
}
```

`myContent` returns a json parsed object.

```js
{
  data: Object;
  path: String;
  dir: String;
  toc: { depth: Number; text: String; id: String }[];
  extension: String;
  excerpt?: String;
  slug: String[];
  compiledContent: String;
  text?: String;
}
```

Then you can render mdx with `MDXComponent` from `next-content/client`

```js
import { MDXComponent } from 'next-content/client';

export default function Page({ myContent }) {
  return (
    <div>
      <h1>{myContent.data.title}</h1>
      <MDXComponent compiledContent={myContent.compiledcontent} />
    </div>
  );
}
```

Wow, your content is ready to use.

## Frontmatter

Create a file under the `content` directory with extension `.mdx`

```mdx
---
title: my content
description: my description
---

# Some MDX
```

Your frontmatter will populates in `myContent.data`.

# Server API

`next-content` No default export. all imported identifiers comes for server-side for the client use `next-content/client`

## `NextContent(options)`

Initialize a content manager that returns a function.

###### `options.directory`

Directory to your content files. `string`

###### Notes

- `options.directory` is relative to the `next` project root

example - `'./content'`

###### `options.extensions`

Allowed extensions for your content files. `string[]`

example - `['.mdx','.md']`

default - `['.mdx']`

##### `options.mdxOptions`

MDX Compile Options. `Object`

- `options.mdxOptions.remarkPlugins` - Remark plugins. `Pluggable[]`

- `options.mdxOptions.rehypePlugins` - Rehype plugins. `Pluggable[]`

- `options.mdxOptions.hastPlugins` - Hast plugins. `Pluggable[]`

- `options.mdxOptions.compilers` - Compilers. `Compiler[]`

##### `options.swcOptions`

see https://swc.rs/docs/configuring-swc;

---

### `content(...path, options?)`

Server only. returns from `NextContent`

returns - [`Server Query API`](#query-api)

<details>
<summary>Example</summary>

```js
const content = NextContent(...);

const articles = content('articles');

const first = articles.first();
const all = articles.fetch();
```

</details>

##### `...path`

Directory or file to your content: `string[]`

example - `content('articles')`<br>
example - `content('articles', 'my-article')`

##### `options`

Options of fetching content. `Object`

##### `options.text`

Includes the original markdown content in a text variable. `boolean`

##### `options.deep`

Fetch files from subdirectories. `boolean`

# Client API

`next-content/client` No default export. all imported identifiers comes for client-side for the server-side use `next-content`

## `<ContentProvider>`

A provider that you can define in `_app.js`.
with `<ContentProvider>` you can use `useContentQuery()` without passing a parameter `Contents`

```jsx
import { ContentProvider } from 'next-content/client';

export default function App({ Component, pageProps }) {
  return (
    <ContentProvider contents={pageProps.contents}>
      <Component {...pageProps} />
    </ContentProvider>
  );
}
```

## `useContentQuery(Contents?)`

use queries in client with `useContentQuery()`

##### `Contents`

Result of fetching contents. `FetchResult[]`

> this example is assumes you have a `<ContentProvider>` in your \_app.js

```jsx
import content from '../lib/content';
import { useContentQuery } from 'next-content/client';

export default function Page() {
  const contents = useContentQuery();
  const myFirstContent = contents.first();

  return <div>{myFirstContent.data.title}</div>;
}

export async function getStaticProps() {
  return {
    props: {
      contents: await content('my-contents').fetch(),
    },
  };
}
```

## `<MDXComponent>`

Render `compiledContent` with MDXComponent;

`props.compiledContent` - value of `compiledContent` from FetchResult. `string`<br>
`props.components` - list of all mdx components. `Object`<br>
`props.scope` - the passed data to MDX. `Object`

<details>
<summary>Example</summary>

```jsx
const components = {
  h1: ({ ...props }) => <h1 {...props} />,
};

function Page({ myContent, myExternalData }) {
  return (
    <MDXComponent
      compiledContent={myContent.compiledContent}
      components={components}
      scope={{ myExternalData }}
    />
  );
}
```

</details>

# Query API

the `content` query api shared by client and server.
with `useContentQuery` and `NextContent`.

###### `useContentQuery(Contents?)`

```js
const content = useContentQuery();

const limit = content.limit(2).fetch();
const search = content.search('data.title', 'hi').fetch();
```

##### `NextContent(options)`

```js
const content = NextContent({
  directory: './content',
});

// the content is reusable
const myContents = content('my-contents');

const limit = myContents.limit(2).fetch();
const search = myContents.search('data.title', 'hi').fetch();
```

##### Differences

- Server api has a `MDX` compilation process so `compiledContent` is undefined.
- Server api has a `FetchOptions` in `first` and `fetch` methods.

##### `only(keys)`

Select a subset of fields.

`keys` - select to keys. `string[]`

<details>
<summary>Example<summary>

```js
// select only `data.title` and `data.description`
myContent.only(['data.title', 'data.description']).fetch();
```

</details>

##### `without(keys)`

Remove a subset of fields.

`keys` - keys to remove. `string[]`

<details>
<summary>Example<summary>

```js
// select without `data.title` and `data.description`
myContent.without(['data.title', 'data.description']).fetch();
```

</details>

##### `process(field?, fn)`

Filter results, manipulate results.

`field` - field to process or function. `string | function`
`fn` - the process function. `function`

<details>
<summary>Example<summary>

```js
// update the `data.title` to `title - my Content`
myContent.process('data.title', (title) => `${title} - My Content`).fetch();
// remove contents that has `archived`
myContent.process('data.archived', (archived) => !archived).fetch();
myContent
  .process((content) => {
    content.data.title = fixTypos(content.data.title);
    content.data.description = fixTypos(content.data.description);
    return content;
  })
  .fetch();
```

</details>

##### `sortBy(key, direction?)`

Sort results by key.

`key` - the key to sort by. `string`<br>
`direction` - the direction to sort by. `'asc' | 'desc'`. default `'asc'`

<details>
<summary>Example<summary>

```js
// sortBy createdAt descending.
myContent.sortBy('createdAt', 'desc').fetch();
```

</details>

##### `limit(n)`

Limit number of results.

`n` - `number | string`

<details>
<summary>Example<summary>

```js
// fetch only first 2 results
myContent.limit(2).fetch();
```

</details>

##### `skip(n)`

Skip results.

`n` - `number | string`

<details>
<summary>Example<summary>

```js
// fetch the next 2 results
myContent.skip(2).limit(2).fetch();
```

</details>

##### `search(key, value)`

full text search with `flexsearch`.

`key` - the key to search. `string`<br>
`value` - the value of the search. `string`

<details>
<summary>Example<summary>

```js
// fetch only includes `hi` in `data.title` field.
myContent.search('data.title', 'hi').fetch();
```

</details>

##### `surround(slugOrPath, options?)`

Get prev and next results around a specific slug or path.

You will always obtain an array of fixed length filled with the maching document or null.

`slugOrPath` - the slug or path to get around. `string`<br>

`options.before` - the number of results to fetch before the current result. `number`. default `1`<br>
`options.after` - the number of results to fetch after the current result. `number`. default `1`

<details>
<summary>Example<summary>

```js
// fetch my-article-1 and my-article-3 as prev and next
myContent.surround('my-article-2').fetch();
```

</details>

###### `fetch(options?)`

Ends the chain sequence and collects data.

returns - `Promise<FetchResult[]>`

`options` - only for server api. `FetchOptions`

`options.skipCompile` - skip compilation. `boolean`. default `false`

`options.json` - serializes the result as json.`boolean`. default `true`

###### `first(options?)`

Ends the chain sequence and collects first data.

returns - `Promise<FetchResult>`

`options` - same as `fetch`

###### `params()`

selects only slug and path from the result.

returns - `FetchResult[]`

# Lisence

MIT

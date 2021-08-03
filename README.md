# next-content

A Content manager for Next.js framework.

# Features

- MDX for Markdown
- Filter files with queries
- Table of Contents generation
- Full-text Search

# Getting started

```
npm install --save next-content
```

`next-content` not fully same as `@nuxt/content` some API changes are happen.

Also currently `next-content` doesn't supports Live Editing and hot reloading. We need an idea to make it possible.

# Documantation

## Writing Content

first of all, create a `lib/content.js` file that includes this:

```js
import { NextContent } from 'next-content';

export const content = new NextContent({
  directory: './content',
});
```

Then create a `my-content.mdx` file under the `content` directory in root.

```mdx
---
title: My Content
description: Description of my content
---

# Hello World
```

last create a page under the `pages` directory in root.

```jsx
import { MDXComponent } from 'next-content';
import { content } from '../lib/content';

export default function MyContentPage({ compiledContent, frontmatter }) {
  return (
    <div>
      <h1>{frontmatter.title}</h1>
      <MDXComponent compiledContent={compiledContent} />
    </div>
  );
}

export async function getStaticProps() {
  const myContent = await content('my-content')
    .only(['compiledContent', 'data'])
    .first();

  return {
    props: {
      compiledContent: myContent.compiledContent,
      frontmatter: myContent.data,
    },
  };
}
```

# Lisence

MIT

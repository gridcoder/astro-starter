<h1 align="center"> Astro Svelte StarterKit</h1>

<br />

<p align="center">
<a href="https://stackblitz.com/github/zankhq/astro-starter">
	<img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" />
</a>
&nbsp;&nbsp;
<a href="https://codesandbox.io/p/sandbox/github/zankhq/astro-starter">
	<img src="https://assets.codesandbox.io/github/button-edit-lime.svg" />
</a>
&nbsp;&nbsp;
<a href="https://codespaces.new/zankhq/astro-starter?devcontainer_path=.devcontainer/blog/devcontainer.json">
	<img src="https://github.com/codespaces/badge.svg" />
</a>
</p>

<br />

### Features:

- ✅ Tailwind CSS
- ✅ Alpine js
- ✅ Typescript
- ✅ Localization (with astro-i18n-aut)
- ✅ Dark/light mode
- ✅ Blog
- ✅ Discussions (thanks to giscus)
- ✅ CMS for editing blog post (thanks to Sveltia CMS)
- ✅ Sitemap (localized)
- ✅ RSS (localized)
- ✅ PWA

### 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command               | Action                                           |
| :-------------------- | :----------------------------------------------- |
| `npm install`         | Installs dependencies                            |
| `npm run dev`         | Starts local dev server at `localhost:4321`      |
| `npm run build`       | Build your production site to `./dist/`          |
| `npm run preview`     | Preview your build locally, before deploying     |
| `npm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm astro -- --help` | Get help using the Astro CLI                     |

### 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```
├── public/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   ├── locales/
│   ├── middleware/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   └── consts.ts/
├── astro.config.mjs
├── README.md
├── package.json
├── .prettierrc
├── tailwind.config.cjs
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page
is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put
any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX
documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and
type-check your frontmatter using an optional schema. See
[Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/)
to learn more.

Any static assets, like images, can be placed in the `public/` directory.

### ✍️ Admin dashboard

You can access the admin dashboard for editing blog post at `/admin`
(https://example.com/admin)

Sveltia cms uses the same configuration as Decap cms, so you can follow the
documentation at https://decapcms.org/docs.

In order to access the admin dashboard to change blog articles content you need
to have access to the github repo, a quick way to test it test would be fork the
repo and than configure sveltia cms accordingly to your cloud provider (netlify,
cloudflare, vercel, etc...).

If you use cloudflare pages you can follow this guide
https://github.com/i40west/netlify-cms-cloudflare-pages.

If you use netlify it's actually easier, you will need to change in the file
`astro.config.mjs` NetlifyCMS config `config.backend.name` to git-gateway. (See
https://decapcms.org/docs/git-gateway-backend/#git-gateway-with-netlify for more
info)

### 🛠️ Configuration Notes

#### Sitemap Configuration

To ensure that search engines can properly index your site, you need to update
the `robots.txt` file with the correct sitemap URL. Open the `robots.txt` file
and update the `Sitemap` directive (make sure to uncomment) to point to your
site's sitemap URL:

```txt
User-agent: *
Allow: /
Sitemap: https://yourdomain.com/sitemap-index.xml
```

Replace `https://yourdomain.com` with your actual domain.

#### OpenGraph Images

For OpenGraph images, place your images in the `public/meta/` directory. This
ensures that the images are correctly referenced in your site's metadata. For
example, you can place an image named `opengraph.png` in the `public/meta/`
directory:

```
public/
└── meta/
    └── opengraph.png
```

This image will then be used for OpenGraph metadata, as configured in the
`BaseHead` component.

#### Configuration in `consts.ts`

To ensure your site is properly configured, you need to update the `consts.ts`
file located in the `src/` directory. This file contains important constants
used throughout your project.

1. Open the `src/consts.ts` file.
2. Update the following constants with your site's information:

```ts
export const SITE_TITLE: string = "Your Site Title";
export const SITE_DESCRIPTION: string = "A brief description of your site.";
export const SITE_URL: string = "https://yourdomain.com";
export const DEFAULT_LOCALE: string = "en";
export const LOCALES: string = ["en", "it"];
export const TWITTER_CREATOR: string = "@yourtwitterhandle";
export const LIGHT_THEME: string = "day";
export const DARK_THEME: string = "night";
export const PAGES: Page[] = [
  {
    title: "home",
    href: "/",
  },
];
```

Replace the placeholder values with your actual site information. This ensures
that your site metadata, localization, and other configurations are correctly
set up.

#### Logo and Image Generation

The only image you need to manually place in the `public/` directory is
`logo.svg`. When you run `npm run build`, the rest of the images in the
`public/` directory will be automatically generated. Ensure that `logo.svg` is
present in the `public/` directory before building your project:

```
public/
└── logo.svg
```

This will ensure that all necessary images are available for your site.

### 👀 Want to learn more?

Check out [Astro documentation](https://docs.astro.build) or jump into Astro
[Discord server](https://astro.build/chat).

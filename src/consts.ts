// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

// Website metadata
export const SITE_URL: string = "https://thecodegrid.com";
export const SITE_TITLE: string = "Astro Svelte StarterKit";
export const SITE_DESCRIPTION: string = "Welcome to my website!";
export const LIGHT_THEME: string = "day";
export const DARK_THEME: string = "night";

// SEO metadata
export const TWITTER_CREATOR: string = "@xxx";

// Navigation
type Page = {
	title: string;
	href: string;
	children?: Page[];
};

export const PAGES: Page[] = [
	{
		title: "home",
		href: "/",
	},
	{
		title: "menu",
		href: "",
		children: [
			{
				title: "Link 1",
				href: "/link1",
			},
			{
				title: "Link 2",
				href: "/link2",
			},
			{
				title: "Link 3",
				href: "/link3",
			},
		],
	},
	{
		title: "blog",
		href: "/blog",
	},
	{
		title: "about",
		href: "/about",
	},
];

// i18n
export const DEFAULT_LOCALE = "en";
export const LOCALES = {
	en: "en", // the `defaultLocale` value must present in `locales` keys
	nl: "nl",
};

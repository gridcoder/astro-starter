// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

// Website metadata
// export const SITE_URL: string = "https://corpgov.aw";
export const SITE_URL: string = "https://corpgov.netlify.app";
export const SITE_TITLE: string = "Corpgov.aw";
export const SITE_DESCRIPTION: string = "Welcome to the corporate covernance website!";
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
				title: "Wetgeving & documenten",
				href: "/wetgeving-documenten",
			},
			{
				title: "Voor wie geldt de Landsverordening corporate governance?",
				href: "/landsverordening-corporate-governance",
			},
			{
				title: "Op welke entiteiten is de Code van toepassing?",
				href: "/code-toepassing",
			},
			{
				title: "Implementatie van de Code",
				href: "/implementatie-code",
			},
			{
				title: "Modellen en templates",
				href: "/modellen-templates",
			},
			{
				title: "Best practices en praktijkvoorbeelden",
				href: "/best-practices",
			},
			{
				title: "E-learning Corporate Governance Code Aruba",
				href: "/e-learning",
			},
			{
				title: "Opleidingen & trainingen",
				href: "/opleidingen-trainingen",
			},
			{
				title: "Vacatures RvT/RVC/RvB/besturen",
				href: "/vacatures",
			},
			{
				title: "Veel gestelde vragen",
				href: "/faq",
			},
			{
				title: "Autoriteit Corporate Governance",
				href: "/autoriteit",
			},
			{
				title: "Contact",
				href: "/contact",
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
export const DEFAULT_LOCALE = "nl";
export const LOCALES = {
	en: "en", // the `defaultLocale` value must present in `locales` keys
	nl: "nl",
};

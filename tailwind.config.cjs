const { LIGHT_THEME, DARK_THEME } = require("./src/consts");
/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");
module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {
			fontFamily: {
				/** Change here the font family */
				heading: ["Raleway Variable", "Raleway", ...defaultTheme.fontFamily.sans],
				body: ["Metrophobic", ...defaultTheme.fontFamily.sans],
			},
			fontVariant: {
				'small-caps': 'small-caps',
			},
			colors: {
				/** Override here your primary colors */
				// primary: {
				// 	50: "#fef1f7",
				// 	100: "#fee5f0",
				// 	200: "#fecce3",
				// 	300: "#ffa2cb",
				// 	400: "#fe68a7",
				// 	500: "#f83c86",
				// 	600: "#e91f64",
				// 	700: "#ca0c47",
				// 	800: "#a70d3b",
				// 	900: "#8b1034",
				// 	950: "#55021a",
				// },
				// secondary: {
				// 	50: "#f4f7f7",
				// 	100: "#e2ebeb",
				// 	200: "#c8d9d8",
				// 	300: "#a1bfbf",
				// 	400: "#739c9d",
				// 	500: "#588182",
				// 	600: "#4c6c6e",
				// 	700: "#425a5c",
				// 	800: "#3b4d4f",
				// 	900: "#354244",
				// 	950: "#222d2f",
				// },
			},
			screens: {
				'xs': '478px',
				'sm': '700px',
				// 'md': '768px',
				// 'lg': '1024px',
				// 'xl': '1280px',
				// '2xl': '1536px',
				// Add custom breakpoints here
				// 'tablet': '640px',
				// 'laptop': '1024px',
				// 'desktop': '1280px',
			},
		},
	},
	plugins: [
		require('daisyui'),
		function ({ addUtilities }) {
			const newUtilities = {
				'.small-caps': {
				fontVariant: 'small-caps',
				},
			}
			addUtilities(newUtilities, ['responsive', 'hover'])
		},
	],
	daisyui: {
		themes: [
			{
				[LIGHT_THEME]: {
					// "primary": "#a991f7",
					"primary": "#003f73", // Regal Blue
					"secondary": "#3e92db", // Celestial Blue
					"secondary-light": "#49aafe", // Picton Blue
					"accent": "#f11f44", // Crayola Red
					"neutral": "#94a3b8",
					"base-100": "#fafaf9", //stone-50
				},
				[DARK_THEME]: {
					"primary": "#fafaf9",
					"secondary": "#3e92db",
					"accent": "#37cdbe",
					"neutral": "#94a3b8",
					"base-100": "#003f73", //stone-800
				},
			},
			"nord"
		], // false: only light + dark | true: all themes | array: specific themes like this ["light", "dark", "cupcake"]
		darkTheme: "dark", // name of one of the included themes for dark mode
		base: false, // applies background color and foreground color for root element by default
		styled: true, // include daisyUI colors and design decisions for all components
		utils: true, // adds responsive and modifier utility classes
		prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
		logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
		themeRoot: ":root", // The element that receives theme color CSS variables
	},
	overrides: [
		{
			files: "*.astro",
			options: {
				parser: "astro",
			},
		},
	],
	darkMode: ['class', `[data-theme="${DARK_THEME}"]`]
};

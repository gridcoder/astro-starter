<script>
  import { onMount } from "svelte"
  import { PAGES, SITE_TITLE, DEFAULT_LOCALE } from "@src/consts"
  import { localizePath, tFn } from "@utils/t"
  import { getLocale, getUrlWithoutLocale } from "astro-i18n-aut"

  export let url

  const translation = tFn(url)

  let isMenuOpen = false
  let isMobile = false

  function toggleMenu() {
    isMenuOpen = !isMenuOpen
  }

  onMount(() => {
    const handleResize = () => {
      isMobile = window.innerWidth < 768
      isMenuOpen = !isMobile
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  })

  function HeaderLink(href) {
    const localeUrlPrefix = getLocale(url) === DEFAULT_LOCALE ? "" : getLocale(url)
    const fullHref = `${localeUrlPrefix ? "/" : ""}${localeUrlPrefix}${href}${href.endsWith("/") ? "" : "/"}`
    const isActive = fullHref === url.pathname || fullHref === url.pathname.replace(/\/$/, "")

    return {
      href: fullHref,
      class: `inline-block no-underline hover:text-gray-700 dark:hover:text-gray-300 ${isActive ? "font-bold underline" : ""}`
    }
  }
</script>

<header class="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-4">
  <button class="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" on:click={toggleMenu}>
    Menu
  </button>

  {#if isMenuOpen || !isMobile}
    <nav class="mt-4 md:mt-0">
      <ul class="flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
        {#each PAGES as item}
          <li>
            {#if item.children && item.children.length}
              <details class="group">
                <summary class="list-none cursor-pointer">
                  <span class="font-medium group-open:font-bold">{item.title}</span>
                  <svg
                    class="inline-block ml-1 w-4 h-4 group-open:rotate-180 transition-transform"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd" />
                  </svg>
                </summary>
                <ul class="pl-4 mt-2 space-y-2">
                  {#each item.children as subitem}
                    <li>
                      <a {...HeaderLink(subitem.href)}>{subitem.title}</a>
                    </li>
                  {/each}
                </ul>
              </details>
            {:else}
              <a {...HeaderLink(item.href)}>{translation(item.title)}</a>
            {/if}
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</header>

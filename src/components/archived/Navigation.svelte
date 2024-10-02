<!-- components/Navigation.svelte -->
<script>
  import { onMount } from "svelte"
  import { DEFAULT_LOCALE } from "@src/consts"
  import { tFn } from "@utils/t"
  import { getLocale } from "astro-i18n-aut"

  export let url
  export let data

  const translation = tFn(url)
  const localeUrlPrefix = getLocale(url) === DEFAULT_LOCALE ? "" : getLocale(url)

  let isMobile = false
  let isLinkActive = false
  let fullHref = ""
  let setClass = ""
  let isOpen = false
  let clickedOnMenu = false

  $: setClass = isOpen ? "dropdown-open" : ""

  onMount(() => {
    const handleResize = () => {
      isMobile = window.innerWidth < 700
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  })

  function formatLink(href) {
    fullHref = `${localeUrlPrefix ? "/" : ""}${localeUrlPrefix}${href}${href.endsWith("/") ? "" : "/"}`

    return fullHref
  }

  function setActive() {
    isLinkActive = fullHref === url.pathname || fullHref === url.pathname.replace(/\/$/, "")
    return `${isLinkActive ? "font-bold underline" : ""}`
  }

  function toggleMobileMenu(element) {
    // console.log("toggleMobileMenu")
    isOpen = !isOpen
    // console.log("isOpen: ", isOpen)
    !isOpen ? element.blur() : ""
  }

  function handleMenuClick() {
    setTimeout(() => {
      // console.log("clickedOnMenu: ", clickedOnMenu)
      if (!clickedOnMenu) {
        isOpen = false
      }
    }, 200)
  }
</script>

<header class="">
  <nav class={isMobile ? `dropdown dropdown-end ${setClass}` : ""}>
    <!-- Mobile menu button -->
    <button
      tabindex="0"
      id="mobile-menu-button"
      class="btn btn-ghost sm:hidden"
      on:click={(event) => toggleMobileMenu(event.currentTarget)}
      on:blur={handleMenuClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"
        ></path>
      </svg>
    </button>

    <!-- Menu -->
    <ul
      on:click={() => (clickedOnMenu = true)}
      on:blur={() => {
        clickedOnMenu = false
        handleMenuClick()
      }}
      tabindex="0"
      id="mobile-menu"
      class="menu sm:menu-horizontal sm:flex sm:items-center sm:p-0 {isMobile
        ? 'dropdown-content bg-base-100 border rounded-lg shadow-lg'
        : ''}"
    >
      {#each data as item}
        <!-- Drop-down submenus -->
        {#if item.children && item.children.length}
          <li>
            <details open={isMobile}>
              <summary
                tabindex="0"
                on:blur={(event) => event.currentTarget.closest("details").removeAttribute("open")}
                >{translation(item.title)}</summary
              >
              <ul class="flex flex-col gap-2 p-2 sm:border min-w-96 z-10">
                {#each item.children as subitem}
                  <li class="link">
                    <a href={formatLink(subitem.href)} class="{setActive()} hover:text-gray-700">
                      {subitem.title}
                    </a>
                  </li>
                {/each}
              </ul>
            </details>
          </li>
          <!-- Regular menu items -->
        {:else}
          <li>
            <a href={formatLink(item.href)} class={setActive()}>{translation(item.title)}</a>
          </li>
        {/if}
      {/each}
      <!-- Optional slot for other components -->
      <slot />
    </ul>
  </nav>
</header>

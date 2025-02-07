<script>
  import { DEFAULT_LOCALE } from "@src/consts"
  import { tFn } from "@utils/t"
  import { getLocale } from "astro-i18n-aut"
  import { slide } from "svelte/transition"
  import { onMount } from "svelte"
  import translations from "@utils/t.ts"

  export let url
  export let data

  const translate = tFn(url)
  const t = translations(url)
  const localeUrlPrefix = getLocale(url) === DEFAULT_LOCALE ? "" : getLocale(url)

  let isMobile = false
  let isOpen = false
  let openSubmenu = null

  // Watch for changes to isOpen and update body class
  $: isOpen ? document.body.classList.add("touch-none") : document.body.classList.remove("touch-none")

  onMount(() => {
    const handleOutsideClick = (event) => {
      if (openSubmenu !== null && !event.target.closest(".submenu-container")) {
        openSubmenu = null
      }
    }

    document.addEventListener("click", handleOutsideClick)

    return () => {
      document.removeEventListener("click", handleOutsideClick)
    }
  })

  function clickOutside(node, excludeSelector = "") {
    const handleClick = (event) => {
      if (
        !node.contains(event.target) &&
        (excludeSelector === "" || !event.target.closest(excludeSelector))
      ) {
        node.dispatchEvent(
          new CustomEvent("outclick", {
            detail: { target: event.target }
          })
        )
      }
    }

    document.addEventListener("click", handleClick, true)

    return {
      destroy() {
        document.removeEventListener("click", handleClick, true)
      }
    }
  }

  function handleResize(node, callback) {
    const handleResize = () => callback()

    window.addEventListener("resize", handleResize)

    callback()

    return {
      destroy() {
        window.removeEventListener("resize", handleResize)
      }
    }
  }

  function closeDropdownOutclick(event) {
    // openSubmenu = null
    console.log("openSubmenu: ", openSubmenu)
  }

  function formatLink(href) {
    if(href === "") return href = null
    return `${localeUrlPrefix ? "/" : ""}${localeUrlPrefix}${href}${href.endsWith("/") ? "" : "/"}`
  }

  function setActive(fullHref) {
    const isLinkActive = fullHref === url.pathname || fullHref === url.pathname.replace(/\/$/, "")
    return isLinkActive ? "btn-active" : ""
  }

  function toggleSubmenu(index, event) {
    event.stopPropagation()
    openSubmenu = openSubmenu === index ? null : index
  }
</script>

<nav use:handleResize={() => (isMobile = window.innerWidth < 700)}>
  {#if isMobile}
    <!-- Mobile Navigation -->
    <button
      id="mobile-menu-button"
      class="btn btn-outline {isOpen ? 'btn-active' : ''}"
      on:click={() => (isOpen = !isOpen)}
    >
      <p class="hidden xs:block">{t["nav-mobile-menu"]}</p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    </button>

    {#if isOpen}
      <div
        use:clickOutside={"#mobile-menu-button"}
        on:outclick={() => (isOpen = false)}
        id="mobile-menu"
        class="absolute top-full left-0 p-4 w-full"
        transition:slide={{ duration: 300, delay: 0, easing: (x) => Math.sqrt(1 - --x * x) }}
      >
        <ul
          class="flex flex-col gap-2 w-full max-h-[calc(100vh-200px)] p-5 text-lg bg-base-100 text-primary border rounded-lg shadow-lg overflow-y-auto z-40"
        >
          {#each data as item}
            {#if item.children && item.children.length}
              <li>
                <details open>
                  <summary class="btn text-left justify-start w-full"
                    >{translate(item.title)}</summary
                  >
                  <ul class="ml-4 p-2 space-y-2 text-lg">
                    {#each item.children as subitem}
                      <li>
                        <a on:click={() => (isOpen = false)} href={formatLink(subitem.href)}>
                          <button class="text-left justify-start w-full {setActive(formatLink(subitem.href))}">
                            {subitem.title}
                          </button>
                        </a>
                      </li>
                    {/each}
                  </ul>
                </details>
              </li>
            {:else}
              <li>
                <a on:click={() => (isOpen = false)} href={formatLink(item.href)}>
                  <button onclick={item.onclick} class="text-left justify-start w-full {setActive(formatLink(item.href))}">
                    {translate(item.title)}
                  </button>
                </a>
              </li>
            {/if}
          {/each}
          <slot />
        </ul>
      </div>
    {/if}
  {:else}
    <!-- Desktop Navigation -->
    <ul class="flex flex-row items-center gap-4">
      {#each data as item, index}
        {#if item.children && item.children.length}
          <li class="relative">
            <button on:click={() => toggleSubmenu(index, event)}>
              {translate(item.title)}
              <svg
                class="w-5 h-5 transform transition-transform duration-300 ease-in-out {openSubmenu === index
                  ? 'rotate-180'
                  : ''}"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ><path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4z" /></svg
              >
            </button>
            {#if openSubmenu === index}
              <div
                transition:slide={{ duration: 300 }}
                class="absolute left-0 mt-4 bg-base-100 border rounded shadow-lg z-10"
              >
                <ul class="p-4 space-y-2 w-80">
                  {#each item.children as subitem}
                    <li>
                      <a href={formatLink(subitem.href)}>
                        <button class="text-left justify-start w-full {setActive(formatLink(subitem.href))}">
                          {subitem.title}
                        </button>
                      </a>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </li>
        {:else}
          <li>
            <a href={formatLink(item.href)}>
              <button onclick={item.onclick} class="{setActive(formatLink(item.href))}">
                {translate(item.title)}
              </button>
            </a>
          </li>
        {/if}
      {/each}
      <slot />
    </ul>
  {/if}
</nav>

<script>
  import { DEFAULT_LOCALE } from "@src/consts"
  import { tFn } from "@utils/t"
  import { getLocale } from "astro-i18n-aut"
  import { slide, fade } from "svelte/transition"

  export let url
  export let data

  const translation = tFn(url)
  const localeUrlPrefix = getLocale(url) === DEFAULT_LOCALE ? "" : getLocale(url)

  let isMobile = false
  let isOpen = true

  $: setClass = isOpen ? "dropdown-open" : ""

  // Watch for changes to isOpen and update body class
  $: isOpen ? document.body.classList.add("touch-none") : document.body.classList.remove("touch-none")

  /**
   * A Svelte action that detects clicks outside of an element.
   *
   * @param {HTMLElement} node - The element to monitor for outside clicks.
   * @param {string} [excludeSelector=''] - A CSS selector for elements to exclude from triggering the outclick event.
   * This is useful for toggle buttons that are outside the main element but should not trigger the outclick.
   *
   * @returns {object} An object with a `destroy` method for cleanup.
   *
   * @fires {CustomEvent} outclick - Dispatched when a click occurs outside the element and not on an excluded element.
   *
   * @example
   * <div use:clickOutside={'#toggle-button'} on:outclick={() => isOpen = false}>
   *   <!-- Content -->
   * </div>
   * <button id="toggle-button" on:click={() => isOpen = !isOpen}>Toggle</button>
   */
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

  // Svelte action for handling window resize
  function handleResize(node, callback) {
    const handleResize = () => callback()

    window.addEventListener("resize", handleResize)

    // Call once to set initial size
    callback()

    return {
      destroy() {
        window.removeEventListener("resize", handleResize)
      }
    }
  }

  function closeDropdownOutclick(event) {
    if (!isMobile) {
      const details = event.target.closest("details")
      if (details) {
        details.removeAttribute("open")
      }
    }
  }

  function formatLink(href) {
    return `${localeUrlPrefix ? "/" : ""}${localeUrlPrefix}${href}${href.endsWith("/") ? "" : "/"}`
  }

  function setActive(fullHref) {
    const isLinkActive = fullHref === url.pathname || fullHref === url.pathname.replace(/\/$/, "")
    return isLinkActive ? "font-bold underline" : ""
  }
</script>

<nav class={isMobile ? `${setClass}` : ""} use:handleResize={() => (isMobile = window.innerWidth < 700)}>
  <!-- Mobile menu button -->
  <button
    id="mobile-menu-button"
    class="btn btn-ghost sm:hidden {isOpen ? 'bg-primary text-base-100' : ''}"
    on:click={() => (isOpen = !isOpen)}
  >
    MENU
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

  <!-- Menu -->
  {#if isOpen}
    <div
      use:clickOutside={"#mobile-menu-button"}
      on:outclick={() => (isOpen = false)}
      id="mobile-menu"
      class="absolute top-full left-0 p-4 w-full"
      transition:slide={{ duration: 300, delay: 0, easing: (x) => Math.sqrt(1 - --x * x) }}
    >
      <ul
        class="flex flex-col gap-2 sm:flex-row sm:items-center w-full max-h-[calc(100vh-200px)] p-5 sm:p-0 text-lg bg-base-100 text-primary border rounded-lg shadow-lg overflow-y-auto z-40"
      >
        {#each data as item}
          <!-- Drop-down submenus -->
          {#if item.children && item.children.length}
            <li>
              <details open use:clickOutside on:outclick={closeDropdownOutclick}>
                <summary>{translation(item.title)}</summary>
                <ul class="flex flex-col gap-2 ml-4 p-2 sm:border z-10 text-lg">
                  {#each item.children as subitem}
                    <li on:click={() => (isOpen = !isOpen)} class="link">
                      <a
                        href={formatLink(subitem.href)}
                        class="{setActive(formatLink(subitem.href))} hover:text-base-100 hover:bg-primary"
                      >
                        {subitem.title}
                      </a>
                    </li>
                  {/each}
                </ul>
              </details>
            </li>
            <!-- Regular menu items -->
          {:else}
            <li on:click={() => (isOpen = !isOpen)} class="link">
              <a href={formatLink(item.href)} class={setActive(formatLink(item.href))}
                >{translation(item.title)}</a
              >
            </li>
          {/if}
        {/each}
        <slot />
      </ul>
    </div>
  {/if}
</nav>

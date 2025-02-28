<script>
  import { onMount } from "svelte"
  import { LIGHT_THEME, DARK_THEME } from "@src/consts"

  export let className = ""

  // Set initial state before component renders
  let checked = false
  let mounted = false

  if (typeof window !== "undefined" && window.themeHandler) {
    checked = window.themeHandler.getStoredTheme() === DARK_THEME
  }

  onMount(() => {
    // Ensure the checked state is correct after mount
    checked = window.themeHandler.getStoredTheme() === DARK_THEME
    mounted = true
  })

  function updateTheme() {
    const theme = checked ? DARK_THEME : LIGHT_THEME
    window.themeHandler.setTheme(theme)
  }
</script>

{#if mounted}
  <label class="grid cursor-pointer place-items-center {className}">
    <input
      id="theme-toggle"
      type="checkbox"
      bind:checked
      on:change={updateTheme}
      class="toggle theme-controller rounded-md bg-primary border-primary col-span-2 col-start-1 row-start-1 hover:bg-primary pointer-events-none"
    />
    <!-- Sun -->
    <svg
      class="stroke-base-100 fill-base-100 dark:stroke-primary dark:fill-primary col-start-1 row-start-1"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <path
        d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
      />
    </svg>
    <!-- Moon -->
    <svg
      class="stroke-primary fill-base-100 col-start-2 row-start-1"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </label>
{/if}

<script>
  import { onMount } from "svelte"

  let theme = "system"
  let isMounted = false

  function getInitialTheme() {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("theme") || "system"
    }
    return "system"
  }

  function updateDocumentClassTheme() {
    if (!isMounted) return

    const isDark =
      theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  function switchTheme(newValue) {
    if (!isMounted) return

    theme = newValue
    if (newValue === "system") {
      localStorage.removeItem("theme")
    } else {
      localStorage.setItem("theme", newValue)
    }
    updateDocumentClassTheme()
  }

  onMount(() => {
    isMounted = true
    theme = getInitialTheme()
    updateDocumentClassTheme()
  })

  $: if (isMounted) switchTheme(theme)
</script>

<select
  bind:value={theme}
  aria-label="Theme selector"
  name="theme-selector"
  id="theme-selector"
  class="dark:stone-50 cursor-pointer focus-visible:outline-none dark:bg-stone-800">
  <option value="system">System</option>
  <option value="dark">Dark</option>
  <option value="light">Light</option>
</select>

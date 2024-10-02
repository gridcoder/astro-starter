<script>
  import { onMount } from "svelte"
  import { navigate } from "astro:transitions/client"
  import { getLocale, getUrlWithoutLocale } from "astro-i18n-aut"
  import { LOCALES, DEFAULT_LOCALE } from "@src/consts"

  let currentLocale
  let urlWithoutLocalePrefix

  onMount(() => {
    currentLocale = getLocale(window.location.pathname) ?? DEFAULT_LOCALE
    urlWithoutLocalePrefix = getUrlWithoutLocale(window.location.pathname)
  })

  const locales = Object.values(LOCALES)

  function changePage(event) {
    const newLocaleUrl = event.target.value
    navigate(newLocaleUrl)
  }
</script>

<select
  aria-label="Change language"
  class="cursor-pointer focus-visible:outline-none dark:bg-stone-800 dark:text-stone-50"
  on:change={changePage}>
  {#each locales as locale}
    <option value={`/${locale}${urlWithoutLocalePrefix}`} selected={locale === currentLocale}>
      {locale}
    </option>
  {/each}
</select>

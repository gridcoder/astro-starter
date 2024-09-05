<script>
  import { onMount } from "svelte"
  import { navigate } from "astro:transitions/client"
  import { getLocale, getUrlWithoutLocale } from "astro-i18n-aut"
  import { LOCALES, DEFAULT_LOCALE } from "@src/consts"

  let className = ""
  let currentLocale
  let urlWithoutLocalePrefix

  export { className as class }

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

<div class={className} {...$$restProps}>
  <select
    aria-label="Change language"
    class="select select-sm select-bordered border-primary font-bold text-lg cursor-pointer focus-visible:outline-none"
    on:change={changePage}
  >
    {#each locales as locale}
      <option value={`/${locale}${urlWithoutLocalePrefix}`} selected={locale === currentLocale}>
        {locale}
      </option>
    {/each}
  </select>
</div>

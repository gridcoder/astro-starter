<script>
  import { onMount } from "svelte"
  import { fly, slide } from "svelte/transition"
  import { cubicOut } from "svelte/easing"
  import { ChevronDown } from "lucide-svelte"

  export let toc

  let isFloating = false
  let isVisible = false
  let isMobileMenuOpen = false
  let tocElement
  let windowWidth
  let activeSection = toc[0]?.id || null
  let activeItem = toc[0]?.items[0]?.id || null
  let isTransitioning = false
  let debug = false

  $: isDesktop = windowWidth >= 1600
  $: currentSectionTitle = {
    section: toc.find(s => s.id === activeSection)?.title || "",
    item: toc.find(s => s.id === activeSection)?.items.find(i => i.id === activeItem)?.title || ""
  }

  function createSectionObserver(options, callback) {
    return new IntersectionObserver(callback, options)
  }

  function handleSectionIntersection(entry, isDesktopView) {
    if (!entry.isIntersecting) return

    const targetId = entry.target.id
    const targetSection = entry.target.getAttribute("data-section")

    if (targetSection) {
      activeSection = targetSection
      activeItem = null
    } else {
      toc.forEach(section => {
        if (section.items.some(item => item.id === targetId)) {
          activeSection = section.id
          activeItem = targetId
        }
      })
    }
  }

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    isMobileMenuOpen = false
  }

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen
  }

  function setupObservers() {
    const floatingObserver = createSectionObserver(
      { threshold: 0, rootMargin: "-100px 0px 0px 0px" },
      entries => {
        entries.forEach(entry => {
          isFloating = !entry.isIntersecting
          isVisible = !entry.isIntersecting && entry.boundingClientRect.top < 0
        })
      }
    )

    const mobileOptions = { threshold: [0], rootMargin: "-50px 0px -65% 0px" }
    const desktopOptions = { threshold: [0], rootMargin: "-10% 0px -85% 0px" }

    const mobileObserver = createSectionObserver(
      mobileOptions,
      entries => !isDesktop && entries.forEach(entry => handleSectionIntersection(entry, false))
    )

    const desktopObserver = createSectionObserver(
      desktopOptions,
      entries => isDesktop && entries.forEach(entry => handleSectionIntersection(entry, true))
    )

    return { floatingObserver, mobileObserver, desktopObserver }
  }

  onMount(() => {
    const { floatingObserver, mobileObserver, desktopObserver } = setupObservers()

    if (tocElement) {
      floatingObserver.observe(tocElement)
    }

    toc.forEach(section => {
      const sectionEl = document.getElementById(section.id)
      if (sectionEl) {
        sectionEl.setAttribute("data-section", section.id)
        mobileObserver.observe(sectionEl)
        desktopObserver.observe(sectionEl)
      }

      section.items.forEach(item => {
        const itemEl = document.getElementById(item.id)
        if (itemEl) {
          mobileObserver.observe(itemEl)
          desktopObserver.observe(itemEl)
          itemEl.setAttribute("data-item-id", item.id)
          itemEl.setAttribute("data-parent-section", section.id)
        }
      })
    })

    return () => {
      [floatingObserver, mobileObserver, desktopObserver].forEach(observer => observer.disconnect())
    }
  })
</script>

<svelte:window bind:innerWidth={windowWidth} />

<!-- Original grid that stays in place -->
<div id="toc" class="relative mt-10" bind:this={tocElement}>
  <div class="flex flex-col gap-3">
    {#each toc as section}
      <div class="p-4 rounded bg-secondary hover:bg-primary dark:hover:bg-base-100 dark:hover:outline dark:hover:outline-1 transition-colors duration-200">
        <a class="" href="#{section.id}" on:click|preventDefault={() => scrollToSection(section.id)}>
          <h2 class="text-2xl hover:underline font-heading font-semibold text-base-100 dark:text-primary">{section.title}</h2>
        </a>
        <ul class="space-y-1">
          {#each section.items as item}
            <li class="flex items-start text-base-100 dark:text-primary">
              <span class="inline-block w-1 h-1 mt-2 mr-3 rounded-full bg-current shrink-0"></span>
              <a
                href="#{item.id}"
                class="{activeItem === item.id
                  ? 'underline'
                  : 'no-underline'} text-base-100 dark:text-primary hover:underline transition-colors duration-200 block"
                on:click|preventDefault={() => scrollToSection(item.id)}
              >
                {item.title}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</div>

<!-- Mobile floating bar -->
{#if isVisible && !isDesktop}
  <div id="toc" class="relative flex justify-center">
    <div
      class="fixed top-[85px] lg:top-2 w-11/12 rounded-t lg:max-w-screen-xs bg-secondary shadow-md z-15 cursor-pointer"
      class:rounded-b={!isMobileMenuOpen && !isTransitioning}
      transition:slide={{ duration: 300 }}
    >
      <button class="w-full text-left text-base-100 dark:text-primary" on:click={toggleMobileMenu}>
        <div class="flex items-center justify-between px-5 py-3">
          <div class="flex-1 truncate flex flex-col">
            <h4 class="font-heading font-semibold">{currentSectionTitle.section}</h4>
            <ul class="flex items-start" class:hidden={!currentSectionTitle.item}>
              <span class="inline-block w-1 h-1 mt-2 mr-3 rounded-full bg-current shrink-0"></span>
              <li class="text-base">{currentSectionTitle.item}</li>
            </ul>
          </div>
          <ChevronDown
            size={24}
            class="transform transition-transform duration-200 {isMobileMenuOpen ? 'rotate-180' : ''}"
          />
        </div>
      </button>

      <!-- The menu -->
      {#if isMobileMenuOpen}
        <div
          class="absolute top-full left-0 right-0 bg-secondary rounded-b border-t shadow-lg"
          transition:slide={{ duration: 300 }}
          on:outrostart={() => (isTransitioning = true)}
          on:outroend={() => (isTransitioning = false)}
        >
          <div class="max-h-full overflow-y-auto">
            {#each toc as section}
              <div class="{activeSection === section.id ? 'bg-primary dark:bg-base-100 dark:border' : ''} px-5 py-2 hover:bg-primary dark:hover:bg-base-100">
                <a href="#{section.id}" on:click|preventDefault={() => scrollToSection(section.id)}>
                  <h2 class="text-xl text-base-100 dark:text-primary font-heading font-semibold hover:underline">
                    {section.title}
                  </h2>
                </a>
                <ul class="space-y-1 mt-2 text-base-100 dark:text-primary">
                  {#each section.items as item}
                    <li class="flex items-start">
                      <span class="inline-block w-1 h-1 mt-2 mr-3 rounded-full shrink-0"></span>
                      <a
                        href="#{item.id}"
                        class="no-underline hover:underline transition-colors duration-200 block font-normal"
                        on:click|preventDefault={() => scrollToSection(item.id)}
                      >
                        {item.title}
                      </a>
                    </li>
                  {/each}
                </ul>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Desktop floating version -->
{#if isVisible && isDesktop}
  <div id="toc" transition:fly={{ x: 300, duration: 500, easing: cubicOut }} class="fixed top-4 right-4 w-[300px]">
    <div class="grid grid-cols-1 gap-1">
      {#each toc as section}
        <div
          class="{activeSection === section.id
            ? 'bg-primary dark:bg-base-100 dark:outline dark:outline-1'
            : 'bg-secondary'} p-2 rounded hover:bg-primary dark:hover:bg-base-100 dark:hover:outline dark:hover:outline-1"
        >
          <a href="#{section.id}" on:click|preventDefault={() => scrollToSection(section.id)}>
            <h2
              class="{activeSection === section.id && !activeItem
                ? 'underline'
                : 'no-underline'} text-2xl text-base-100 dark:text-primary font-heading font-semibold hover:underline"
            >
              {section.title}
            </h2>
          </a>
          <ul class="space-y-1 text-base-100">
            {#each section.items as item}
              <li class="flex items-start text-base-100 dark:text-primary">
                <span class="inline-block w-1 h-1 mt-2 mr-3 rounded-full bg-current shrink-0"></span>
                <a
                  href="#{item.id}"
                  class="{activeItem === item.id
                    ? 'underline'
                    : 'no-underline'} hover:underline transition-colors duration-200 block font-normal"
                  on:click|preventDefault={() => scrollToSection(item.id)}
                >
                  {item.title}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- {#if debug}
  <div class="fixed bottom-4 right-4 bg-black text-white p-2 rounded">
    Floating: {isFloating} | Visible: {isVisible} | Desktop: {isDesktop}
  </div>
{/if} -->

{#if debug}
  <div class="fixed bottom-4 right-4 bg-black text-white p-2 rounded">
    Floating: {isFloating} | Visible: {isVisible} | Desktop: {isDesktop}
    <br />
    isTransitioning: {isTransitioning}
  </div>
{/if}

<style>
  h2 {
    @apply text-base;
  }
</style>
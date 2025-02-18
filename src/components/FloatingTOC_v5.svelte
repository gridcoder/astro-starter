<script>
  import { onMount, tick } from "svelte"
  import { fly, slide } from "svelte/transition"
  import { cubicOut } from "svelte/easing"
  import { ChevronDown } from "lucide-svelte"

  export let toc
  
  const observerMargins = {
    desktop: { top: 10, bottom: 85 },    // percentages
    mobile: { top: 12, bottom: 78 }      // percentages
  }

  const scrollOffsets = {
    desktop: 90,  // pixels from top in desktop mode
    mobile: 170   // pixels from top in mobile mode
  }

  let isFloating = false
  let isVisible = false
  let isMobileMenuOpen = false
  let tocElement
  let windowWidth
  let activeSection = toc[0]?.id || null
  let activeItem = toc[0]?.items[0]?.id || null
  let isTransitioning = false
  let debug = false
  let debugOverlay

  $: isDesktop = windowWidth >= 1600
  $: currentSectionTitle = {
    section: toc.find(s => s.id === activeSection)?.title || "",
    item: toc.find(s => s.id === activeSection)?.items.find(i => i.id === activeItem)?.title || ""
  }

  $: if (debug && debugOverlay) {
    const vh = window.innerHeight
    const margins = isDesktop 
      ? observerMargins.desktop
      : observerMargins.mobile
    
    debugOverlay.style.top = `${(margins.top / 100) * vh}px`
    debugOverlay.style.height = `${vh - ((margins.top + margins.bottom) / 100) * vh}px`
  }

  function createSectionObserver(options, callback) {
    return new IntersectionObserver(callback, options)
  }

  function handleSectionIntersection(entry) {
    const targetId = entry.target.id
    const targetSection = entry.target.getAttribute("data-section")
    const targetItem = entry.target.getAttribute("data-item-id")

    if (targetItem) {
      activeSection = entry.target.getAttribute("data-parent-section")
      activeItem = targetItem
    } else if (targetSection) {
      activeSection = targetSection
      activeItem = null
    } else if (targetId) {
      toc.forEach(section => {
        if (section.items.some(item => item.id === targetId)) {
          activeSection = section.id
          activeItem = targetId
        }
      })
    }
  }

  function scrollToSection(id) {
    const element = document.getElementById(id)
    if (!element) return
    
    const offset = isDesktop ? scrollOffsets.desktop : scrollOffsets.mobile
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.scrollY - offset
    
    // Add a check to ensure we're scrolling to a valid position
    if (offsetPosition >= 0) {
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
    
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

    const margins = isDesktop ? observerMargins.desktop : observerMargins.mobile

    const commonOptions = {
      threshold: [0, 0.1],
      rootMargin: `-${margins.top}% 0px -${margins.bottom}% 0px`
    }

    const observer = createSectionObserver(
      commonOptions,
      entries => {
        entries.forEach(entry => {
          // Only process entries that are at least 10% visible
          if (entry.intersectionRatio >= 0.1) {
            handleSectionIntersection(entry)
          }
        })
      }
    )

    return { floatingObserver, observer }
  }

  function findLastContentElement(startEl) {
    let lastContent = null;
    let currentEl = startEl.nextElementSibling;
    
    // Keep going until we hit the next header or run out of siblings
    while (currentEl && !currentEl.tagName.match(/^H[1-6]$/)) {
      lastContent = currentEl;
      currentEl = currentEl.nextElementSibling;
    }
    
    return lastContent;
  }

  function checkInitialVisibility() {
    const vh = window.innerHeight
    const scrollTop = window.scrollY
    const offset = vh * (isDesktop ? 0.1 : 0.15)  // Match our detection area margins

    // Find all headers and content
    const elements = document.querySelectorAll('[data-section], [data-item-id]')
    let bestMatch = null
    let bestDistance = Infinity

    elements.forEach(el => {
      const rect = el.getBoundingClientRect()
      const absoluteTop = rect.top + scrollTop

      // Consider elements that are both in view and just above the viewport
      // Calculate distance from our detection area
      const distance = Math.abs(absoluteTop - (scrollTop + offset))
      
      if (distance < bestDistance) {
        bestMatch = el
        bestDistance = distance
      }
    })

    if (bestMatch) {
      const targetId = bestMatch.id
      const targetSection = bestMatch.getAttribute("data-section")
      const targetItem = bestMatch.getAttribute("data-item-id")

      if (targetItem) {
        activeSection = bestMatch.getAttribute("data-parent-section")
        activeItem = targetItem
      } else if (targetSection) {
        activeSection = targetSection
        activeItem = null
      } else if (targetId) {
        toc.forEach(section => {
          if (section.items.some(item => item.id === targetId)) {
            activeSection = section.id
            activeItem = targetId
          }
        })
      }
    }
  }

  onMount(async () => {
    const { floatingObserver, observer } = setupObservers()

    if (tocElement) {
      floatingObserver.observe(tocElement)
    }

    toc.forEach(section => {
      const sectionEl = document.getElementById(section.id)
      if (sectionEl) {
        sectionEl.setAttribute("data-section", section.id)
        observer.observe(sectionEl)

        // Observe the last content element before the next header
        const contentEl = findLastContentElement(sectionEl)
        if (contentEl) {
          contentEl.setAttribute("data-content", "true")
          contentEl.setAttribute("data-section", section.id)
          observer.observe(contentEl)
        }
      }

      section.items.forEach(item => {
        const itemEl = document.getElementById(item.id)
        if (itemEl) {
          observer.observe(itemEl)
          itemEl.setAttribute("data-item-id", item.id)
          itemEl.setAttribute("data-parent-section", section.id)

          const contentEl = findLastContentElement(itemEl)
          if (contentEl) {
            contentEl.setAttribute("data-content", "true")
            contentEl.setAttribute("data-item-id", item.id)
            contentEl.setAttribute("data-parent-section", section.id)
            observer.observe(contentEl)
          }
        }
      })
    })

    await tick()
    checkInitialVisibility()

    return () => {
      [floatingObserver, observer].forEach(obs => obs.disconnect())
    }
  })
</script>

<svelte:window bind:innerWidth={windowWidth} />

<!-- Original grid that stays in place -->
<div id="toc-static" class="toc relative" bind:this={tocElement}>
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
  <div id="toc-mobile" class="toc relative flex justify-center">
    <div
      class="fixed top-[85px] 3xl:top-2 w-11/12 rounded-t lg:max-w-screen-md bg-secondary shadow-md z-10 cursor-pointer"
      class:rounded-b={!isMobileMenuOpen && !isTransitioning}
      transition:slide={{ duration: 300 }}
    >
      <div class="w-full text-left text-base-100 dark:text-primary" on:click={toggleMobileMenu}>
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
      </div>

      <!-- The menu -->
      {#if isMobileMenuOpen}
        <div
          class="absolute top-full left-0 right-0 bg-secondary rounded-b border-t shadow-lg"
          transition:slide={{ duration: 300 }}
          on:outrostart={() => (isTransitioning = true)}
          on:outroend={() => (isTransitioning = false)}
        >
          <div class="max-h-[80vh] overflow-y-scroll scrollbar-thin scrollbar-track-secondary scrollbar-thumb-primary">
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
  <div id="toc-desktop" transition:fly={{ x: 300, duration: 500, easing: cubicOut }} class="toc fixed top-4 right-4 w-[300px]">
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
  <div class="fixed bottom-4 right-4 bg-black text-white p-2 rounded z-50">
    Floating: {isFloating} | Visible: {isVisible} | Desktop: {isDesktop}
    <br />
    isTransitioning: {isTransitioning}
  </div>

  <!-- Detection area visualization -->
  <div
    bind:this={debugOverlay}
    class="fixed inset-x-0 pointer-events-none border-y-2 border-red-500 bg-red-500/10 z-40"
  >
    <div class="absolute -top-6 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm">
      Detection Area
    </div>
  </div>
{/if}

<style>
  h2 {
    @apply text-base;
  }
</style>
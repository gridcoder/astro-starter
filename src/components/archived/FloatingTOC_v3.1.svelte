<script>
  import { onMount } from "svelte"
  import { fly, slide } from "svelte/transition"
  import { cubicOut } from "svelte/easing"
  import { ChevronDown } from "lucide-svelte"

  const sections = [
    {
      title: "Introductie",
      id: "introductie",
      items: []
    },
    {
      title: "De landsverordening corporate governance (landsverordening)",
      id: "de-landsverordening-corporate-governance-landsverordening",
      items: []
    },
    {
      title: "De code corporate governance (code)",
      id: "de-code-corporate-governance-code",
      items: []
    },
    {
      title: "Publiekrechtelijke rechtspersonen",
      id: "publiekrechtelijke-rechtspersonen",
      items: []
    },
    {
      title: "Overheidsvennootschappen",
      id: "overheidsvennootschappen",
      items: []
    }
  ]

  let isFloating = false
  let isVisible = false
  let isMobileMenuOpen = false
  let tocElement
  let observer
  let windowWidth
  let activeSection = null
  let activeItem = null
  let debug = false
  let mobileSectionObserver
  let desktopSectionObserver

  $: isDesktop = windowWidth >= 1600
  $: currentSectionTitle = getCurrentSectionTitle(activeSection, activeItem)

  function getCurrentSectionTitle(sectionId, itemId) {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return { section: "", item: "" }

    // If we have an active item, use that
    if (itemId) {
      const item = section.items.find((i) => i.id === itemId)
      return {
        section: section.title,
        item: item ? item.title : ""
      }
    }

    // If no active item but we have a section, show the first item in that section
    if (section.items.length > 0) {
      return {
        section: section.title,
        item: section.items[0].title
      }
    }

    // Fallback
    return {
      section: section.title,
      item: ""
    }
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    isMobileMenuOpen = false
  }

  const toggleMobileMenu = () => {
    isMobileMenuOpen = !isMobileMenuOpen
  }

  onMount(() => {
    // Observer for floating behavior
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isFloating = !entry.isIntersecting
          isVisible = !entry.isIntersecting && entry.boundingClientRect.top < 0
        })
      },
      {
        threshold: 0,
        rootMargin: "-100px 0px 0px 0px"
      }
    )

    if (tocElement) {
      observer.observe(tocElement)
    }

    // Mobile section observer
    mobileSectionObserver = new IntersectionObserver(
      (entries) => {
        if (isDesktop) return // Skip if in desktop mode

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targetId = entry.target.id
            const targetSection = entry.target.getAttribute("data-section")

            if (targetSection) {
              activeSection = targetSection
              const section = sections.find((s) => s.id === targetSection)
              if (section && section.items.length > 0) {
                activeItem = section.items[0].id
              }
            } else {
              sections.forEach((s) => {
                if (s.items.some((item) => item.id === targetId)) {
                  activeSection = s.id
                  activeItem = targetId
                }
              })
            }
          }
        })
      },
      {
        threshold: [0],
        rootMargin: "-50px 0px -65% 0px" // 240px = 60 * 4 (assuming 1rem = 4px)
      }
    )

    // Desktop section observer
    desktopSectionObserver = new IntersectionObserver(
      (entries) => {
        if (!isDesktop) return // Skip if in mobile mode

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targetId = entry.target.id
            const targetSection = entry.target.getAttribute("data-section")

            if (targetSection) {
              activeSection = targetSection
              const section = sections.find((s) => s.id === targetSection)
              if (section && section.items.length > 0) {
                activeItem = section.items[0].id
              }
            } else {
              sections.forEach((s) => {
                if (s.items.some((item) => item.id === targetId)) {
                  activeSection = s.id
                  activeItem = targetId
                }
              })
            }
          }
        })
      },
      {
        threshold: [0],
        rootMargin: "-10% 0px -85% 0px" // Keep original desktop behavior
      }
    )

    // Update how sections and items are observed
    // Replace the existing section observation code with this:
    sections.forEach((section) => {
      const sectionEl = document.querySelector(`[data-section="${section.id}"]`)
      if (sectionEl) {
        mobileSectionObserver.observe(sectionEl)
        desktopSectionObserver.observe(sectionEl)
      }

      section.items.forEach((item) => {
        const itemEl = document.getElementById(item.id)
        if (itemEl) {
          mobileSectionObserver.observe(itemEl)
          desktopSectionObserver.observe(itemEl)
          itemEl.setAttribute("data-item-id", item.id)
          itemEl.setAttribute("data-parent-section", section.id)
        }
      })
    })

    return () => {
      if (observer) observer.disconnect()
      if (mobileSectionObserver) mobileSectionObserver.disconnect()
      if (desktopSectionObserver) desktopSectionObserver.disconnect()
    }
  })

  $: getSectionClass = (sectionId) => {
    return activeSection === sectionId
      ? "bg-primary text-base-100 outline outline-accent"
      : "bg-primary text-base-100"
  }

  $: getItemClass = (itemId) => {
    return activeItem === itemId ? "text-accent" : ""
  }
</script>

<svelte:window bind:innerWidth={windowWidth} />

<!-- Original grid that stays in place -->
<div class="relative mt-10" bind:this={tocElement}>
  <div class="flex flex-col gap-3">
    {#each sections as section}
      <div class="p-4 bg-secondary rounded hover:bg-primary transition-colors duration-200">
        <a href="#{section.id}">
          <h2 class="pt-0 text-2xl font-heading text-base-100">{section.title}</h2>
        </a>
        <!-- <ul class="space-y-1">
          {#each section.items as item}
            <li class="flex items-start">
              <span class="inline-block w-1 h-1 mt-2 mr-3 rounded-full bg-current shrink-0"></span>
              <a
                href="#{item.id}"
                class="no-underline hover:text-accent transition-colors duration-200 block font-normal {getItemClass(
                  item.id
                )}"
                on:click|preventDefault={() => scrollToSection(item.id)}
              >
                {item.title}
              </a>
            </li>
          {/each}
        </ul> -->
      </div>
    {/each}
  </div>
</div>

<!-- Mobile floating bar -->
{#if isVisible && !isDesktop}
  <div class="relative flex justify-center">
    <div
      class="fixed top-12 lg:top-2 w-full lg:max-w-screen-xs bg-secondary text-base-100 shadow-lg z-50 cursor-pointer"
      transition:slide={{ duration: 300 }}
    >
      <button class="w-full text-left" on:click={toggleMobileMenu}>
        <div class="flex items-center justify-between px-5 py-3">
          <div class="flex-1 truncate flex flex-col">
            <h4 class="font-bold font-serif">{currentSectionTitle.section}</h4>
            <ul class="flex items-start">
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
          class="absolute top-full left-0 right-0 bg-base-100 shadow-lg"
          transition:slide={{ duration: 300 }}
        >
          <div class="max-h-full overflow-y-auto">
            {#each sections as section}
              <div class="{getSectionClass(section.id)} px-5 py-2">
                <h2 class="text-xl font-bold font-serif">{section.title}</h2>
                <ul class="space-y-1 mt-2">
                  {#each section.items as item}
                    <li class="flex items-start">
                      <span class="inline-block w-1 h-1 mt-2 mr-3 rounded-full bg-current shrink-0"></span>
                      <a
                        href="#{item.id}"
                        class="no-underline hover:text-accent transition-colors duration-200 block font-normal {getItemClass(
                          item.id
                        )}"
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
  <div
    transition:fly={{ x: 300, duration: 500, easing: cubicOut }}
    class="fixed top-4 right-4"
    style="width: 300px;"
  >
    <div class="grid grid-cols-1 gap-4">
      {#each sections as section}
        <div
          class="{getSectionClass(
            section.id
          )} p-4 rounded bg-secondary hover:bg-primary transition-colors duration-200"
        >
          <a href="#{section.id}">
            <h2 class="pt-0 text-base-100 text-2xl font-heading">{section.title}</h2>
          </a>
          <ul class="space-y-1">
            {#each section.items as item}
              <li class="flex items-start">
                <span class="inline-block w-1 h-1 mt-2 mr-3 rounded-full bg-current shrink-0"></span>
                <a
                  href="#{item.id}"
                  class="no-underline hover:text-accent transition-colors duration-200 block font-normal {getItemClass(
                    item.id
                  )}"
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

{#if debug}
  <div class="fixed bottom-4 right-4 bg-black text-white p-2 rounded">
    Floating: {isFloating} | Visible: {isVisible} | Desktop: {isDesktop}
  </div>
{/if}

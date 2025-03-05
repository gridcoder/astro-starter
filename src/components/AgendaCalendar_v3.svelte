<script>
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import agendaData from '../data/agenda.json';

  // Props
  export let mobileVisibleCount = 1;
  export let desktopVisibleCount = 3;

  let expanded = false;
  let currentIndex = 0;
  let sortedFutureEvents = [];
  let isMobile = false;
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  // Handle responsive behavior
  function handleResize() {
    isMobile = window.innerWidth < 768; // md breakpoint in Tailwind
  }

  function nextSlide() {
    if (!sortedFutureEvents.length) return;
    const maxVisibleCount = isMobile ? mobileVisibleCount : desktopVisibleCount;
    // Prevent going beyond the end of the list
    if (currentIndex + maxVisibleCount < sortedFutureEvents.length) {
      currentIndex += 1;
    }
  }

  function prevSlide() {
    if (!sortedFutureEvents.length) return;
    // Prevent going before the start of the list
    if (currentIndex > 0) {
      currentIndex -= 1;
    }
  }

  onMount(() => {
    // Add window resize listener
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    // Sort events by date
    const sortedEvents = [...agendaData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Only show future events
    const currentDate = new Date();
    sortedFutureEvents = sortedEvents.filter(event => new Date(event.date) >= currentDate);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  function toggleExpanded() {
    expanded = !expanded;
  }

  $: visibleSlides = isMobile 
    ? sortedFutureEvents.slice(currentIndex, currentIndex + mobileVisibleCount)
    : sortedFutureEvents.slice(currentIndex, currentIndex + desktopVisibleCount);
  
  // Track whether we're at the start or end to disable nav buttons
  $: isAtStart = currentIndex === 0;
  $: isAtEnd = currentIndex + (isMobile ? mobileVisibleCount : desktopVisibleCount) >= sortedFutureEvents.length;

</script>

<div class="w-full font-heading relative">
  <div class="card bg-base-100 shadow-lg rounded-lg">
    <h2 class="pt-4 text-lg md:text-xl text-center">Aankomende Trainingen</h2>
    <div class="card-body p-0 pb-2 md:p-4">
      <!-- Always show the carousel/initial items, regardless of expanded state -->
      {#if sortedFutureEvents.length > 0}
        <div class="relative">
          <!-- Only show navigation buttons when not expanded -->
          {#if !expanded}
            <!-- Previous button -->
            <button
              on:click={prevSlide}
              class="absolute top-1/2 left-0 -translate-y-1/2 -ml-4 z-10 btn btn-circle btn-sm bg-base-100 shadow-md hover:bg-secondary hover:text-base-100 {isAtStart ? 'opacity-50 cursor-not-allowed' : ''}"
              aria-label="Previous slide"
              disabled={isAtStart}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <!-- Next button -->
            <button
              on:click={nextSlide}
              class="absolute top-1/2 right-0 -translate-y-1/2 -mr-4 z-10 btn btn-circle btn-sm bg-base-100 shadow-md hover:bg-secondary hover:text-base-100 {isAtEnd ? 'opacity-50 cursor-not-allowed' : ''}"
              aria-label="Next slide"
              disabled={isAtEnd}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          {/if}

          <!-- Slides container - always visible -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
            {#each expanded ? sortedFutureEvents.slice(0, isMobile ? mobileVisibleCount : desktopVisibleCount) : visibleSlides as event, i (event.date + event.location)}
              <div 
                in:fade={{ duration: 200, delay: i * 100 }}
                class="flex flex-col h-fit bg-primary/5 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div class="flex flex-wrap items-center gap-1 mb-2">
                  <span class="text-secondary font-semibold">{formatDate(event.date)}</span>
                  <span class="badge badge-secondary ml-2 text-base-100 text-xs md:text-sm">{event.location}</span>
                </div>
                {#each event.events as session}
                  <div class="mb-2 border-l-2 border-secondary-light pl-3">
                    <p class="text-sm text-neutral">{session.time}</p>
                    <p class="font-medium">{session.title}</p>
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="text-center py-6">
          <p class="text-neutral">Geen aankomende trainingen gevonden</p>
        </div>
      {/if}
      
      <!-- Expanded view showing additional events -->
      {#if expanded && sortedFutureEvents.length > (isMobile ? mobileVisibleCount : desktopVisibleCount)}
        <div transition:slide={{ duration: 300 }} class="mt-6 grid grid-cols-1 md:grid-cols-3 px-4 gap-4">
          {#each sortedFutureEvents.slice(isMobile ? mobileVisibleCount : desktopVisibleCount) as event}
            <div class="flex flex-col h-fit bg-primary/5 rounded-lg p-4 hover:shadow-md transition-all">
              <div class="flex flex-wrap items-center gap-1 mb-2">
                <span class="text-secondary font-semibold">{formatDate(event.date)}</span>
                <span class="badge badge-secondary ml-2 text-base-100 text-xs md:text-sm">{event.location}</span>
              </div>
              {#each event.events as session}
                <div class="mb-2 border-l-2 border-secondary-light pl-3">
                  <p class="text-sm text-neutral">{session.time}</p>
                  <p class="font-medium">{session.title}</p>
                </div>
              {/each}
            </div>
          {/each}
        </div>
      {/if}

      {#if sortedFutureEvents.length > (isMobile ? mobileVisibleCount : desktopVisibleCount)}
        <div class="text-center md:mt-4">
          <button 
            on:click={toggleExpanded} 
            class="btn btn-sm btn-outline !border-secondary !text-secondary hover:!bg-secondary hover:!text-base-100 transition-all"
            aria-label={expanded ? "Verbergen" : "Alles tonen"}
          >
            <span class="mr-1">{expanded ? "Verbergen" : "Alles tonen"}</span>
            <svg class={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      {/if}

      <!-- <div class="flex justify-end mt-4">
        <a href="/opleidingen" class="link text-secondary inline-flex items-center">
          <span>Bekijk alle opleidingen</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div> -->
    </div>
  </div>
</div>

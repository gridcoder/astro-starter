<script>
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import agendaData from '../data/agenda.json';

  let expanded = false;
  let visibleEvents = [];
  let hiddenEvents = [];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  onMount(() => {
    // Sort events by date
    const sortedEvents = [...agendaData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Only show future events
    const currentDate = new Date();
    const futureEvents = sortedEvents.filter(event => new Date(event.date) >= currentDate);
    
    // Split into visible and hidden events
    visibleEvents = futureEvents.slice(0, 3);
    hiddenEvents = futureEvents.slice(3);
  });

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<div class="w-full font-heading relative">
  <div class="card bg-base-100 shadow-xl border">
    <h2 class="pt-4 text-center">Aankomende Trainingen</h2>
    <div class="card-body p-4 overflow-hidden">
      {#if visibleEvents.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each visibleEvents as event}
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
      {:else}
        <div class="text-center py-6">
          <p class="text-neutral">Geen aankomende trainingen gevonden</p>
        </div>
      {/if}
      
      {#if expanded && hiddenEvents.length > 0}
        <div transition:slide={{ duration: 300 }} class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each hiddenEvents as event}
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

      {#if hiddenEvents.length > 0}
        <div class="text-center mt-4">
          <button 
            on:click={toggleExpanded} 
            class="btn btn-sm btn-outline !border-secondary !text-secondary hover:!bg-secondary hover:!text-base-100 transition-all"
            aria-label={expanded ? "Minder tonen" : "Meer tonen"}
          >
            <span class="mr-1">{expanded ? "Minder tonen" : "Meer tonen"}</span>
            <svg class={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      {/if}

      <div class="flex justify-end mt-4">
        <a href="/opleidingen" class="link text-secondary inline-flex items-center">
          <span>Bekijk alle opleidingen</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</div>

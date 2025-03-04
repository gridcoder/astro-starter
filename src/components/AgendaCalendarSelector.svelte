<script>
  import { onMount } from 'svelte';
  import AgendaCalendar from './AgendaCalendar.svelte';
  import AgendaCalendar_v2 from './AgendaCalendar_v2.svelte';
  import AgendaCalendar_v3 from './AgendaCalendar_v3.svelte';

  // Props
  export let mobileVisibleCount = 1;
  export let desktopVisibleCount = 3;

  // Selected version
  let selectedVersion = 'v1';

  const versions = [
    { value: 'v1', label: 'Versie 1 (Basis)' },
    { value: 'v2', label: 'Versie 2 (Duplicate)' },
    { value: 'v3', label: 'Versie 3 (Carousel)' }
  ];

  function handleVersionChange(event) {
    selectedVersion = event.target.value;
  }
</script>

<div class="w-full font-heading relative my-12">
  <div class="mb-4 p-4 bg-base-100 shadow-sm border rounded-lg">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <label class="text-sm font-medium text-primary">
        Kies een agenda stijl:
      </label>
      <select 
        bind:value={selectedVersion}
        on:change={handleVersionChange}
        class="select select-bordered w-full sm:w-auto"
      >
        {#each versions as version}
          <option value={version.value}>{version.label}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="mt-2">
    {#if selectedVersion === 'v1'}
      <AgendaCalendar {mobileVisibleCount} {desktopVisibleCount} />
    {:else if selectedVersion === 'v2'}
      <AgendaCalendar_v2 {mobileVisibleCount} {desktopVisibleCount} />
    {:else if selectedVersion === 'v3'}
      <AgendaCalendar_v3 {mobileVisibleCount} {desktopVisibleCount} />
    {/if}
  </div>
</div>

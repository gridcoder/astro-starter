<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  
  export let tabs: string[] = [];
  export let activeTab: number = 0;
  
  let tabsContainer: HTMLDivElement;
  let indicatorWidth = 0;
  let indicatorLeft = 0;

  // Custom event for communicating with TabPanels
  const notifyTabChange = (index: number) => {
    // Create and dispatch a custom event
    const event = new CustomEvent('tabchange', {
      detail: { activeTab: index },
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  function updateIndicator(index: number) {
    const tabElements = tabsContainer?.children;
    if (tabElements) {
      const activeTabElement = tabElements[index] as HTMLElement;
      indicatorWidth = activeTabElement.offsetWidth;
      indicatorLeft = activeTabElement.offsetLeft;
    }
  }
  
  function selectTab(index: number) {
    activeTab = index;
    updateIndicator(index);
    notifyTabChange(index);
  }
  
  onMount(() => {
    if (tabsContainer) {
      updateIndicator(activeTab);
      // Notify of initial active tab
      notifyTabChange(activeTab);
    }
    
    // Also listen for requests from TabPanels about the current state
    const handleActiveTabRequest = () => {
      notifyTabChange(activeTab);
    };
    
    document.addEventListener('requestActiveTab', handleActiveTabRequest);
    
    return () => {
      document.removeEventListener('requestActiveTab', handleActiveTabRequest);
    };
  });
  
  afterUpdate(() => {
    // Ensure indicator is updated when component re-renders
    if (tabsContainer) {
      updateIndicator(activeTab);
    }
  });
  
  $: if (activeTab !== undefined && tabsContainer) {
    updateIndicator(activeTab);
  }
</script>

<div class="space-y-6 w-full">
  <div class="relative flex justify-center">
    <div
      bind:this={tabsContainer}
      class="relative flex bg-base-200/80 rounded-full p-1 gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
    >
      {#each tabs as tab, i}
        <div
          on:click={() => selectTab(i)}
          class="relative z-10 px-6 py-2 text-lg font-medium transition-all duration-300 cursor-pointer
            {activeTab === i
              ? 'text-primary'
              : 'text-secondary hover:text-primary/90 hover:bg-primary/10 rounded-full'}"
        >
          {tab}
        </div>
      {/each}
      <div
        class="absolute top-1 left-0 h-[calc(100%-8px)] rounded-full transition-all duration-300 ease-out
          bg-base-100
          shadow-[0_2px_3px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1)]"
        style="width: {indicatorWidth}px; transform: translateX({indicatorLeft}px)"
      />
    </div>
  </div>
  
  <div class="w-full">
    <slot />
  </div>
</div>
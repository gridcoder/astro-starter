<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  
  export let index: number;
  let isActive = false;
  
  // Handler for tab change events
  const handleTabChange = (event: CustomEvent) => {
    if (event.detail && typeof event.detail.activeTab === 'number') {
      isActive = event.detail.activeTab === index;
    }
  };
  
  onMount(() => {
    // Listen for tab change events
    document.addEventListener('tabchange', handleTabChange as EventListener);
    
    // Check if there's an initial active tab
    const checkInitialState = () => {
      const event = new CustomEvent('requestActiveTab', { bubbles: true });
      document.dispatchEvent(event);
    };
    
    // Small delay to ensure tabs component is ready
    setTimeout(checkInitialState, 0);
  });
  
  onDestroy(() => {
    document.removeEventListener('tabchange', handleTabChange as EventListener);
  });
</script>

<div class="w-full" class:hidden={!isActive}>
  {#if isActive}
    <div transition:fade={{ duration: 300 }}>
      <slot />
    </div>
  {/if}
</div>
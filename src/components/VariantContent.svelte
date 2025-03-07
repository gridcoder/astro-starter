<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  
  export let name: string;
  let isActive = false;
  
  // Handler for variant change events
  const handleVariantChange = (event: CustomEvent) => {
    if (event.detail && typeof event.detail.activeVariant === 'string') {
      isActive = event.detail.activeVariant === name;
    }
  };
  
  onMount(() => {
    // Listen for variant change events
    document.addEventListener('variantchange', handleVariantChange as EventListener);
    
    // Check if there's an initial active variant
    const checkInitialState = () => {
      const event = new CustomEvent('requestActiveVariant', { bubbles: true });
      document.dispatchEvent(event);
    };
    
    // Small delay to ensure variant selector component is ready
    setTimeout(checkInitialState, 0);
  });
  
  onDestroy(() => {
    document.removeEventListener('variantchange', handleVariantChange as EventListener);
  });
</script>

<div class="w-full" class:hidden={!isActive}>
  {#if isActive}
    <div transition:fade={{ duration: 300 }}>
      <slot />
    </div>
  {/if}
</div>

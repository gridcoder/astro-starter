<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { fade } from 'svelte/transition';
  
  export let options = [];
  export let defaultOption = options[0]?.value || '';
  export let position = 'left'; // 'left', 'right', 'top', 'bottom'
  
  // Selected option
  let selectedOption = defaultOption;
  let isOpen = false;
  let selectorEl;

  // Custom event for communicating with VariantContent
  const notifyVariantChange = (value: string) => {
    // Create and dispatch a custom event
    const event = new CustomEvent('variantchange', {
      detail: { activeVariant: value },
      bubbles: true
    });
    document.dispatchEvent(event);
  };
  
  function selectOption(value) {
    selectedOption = value;
    isOpen = false;
    notifyVariantChange(selectedOption);
  }

  function toggleDropdown(event) {
    event.stopPropagation();
    isOpen = !isOpen;
  }
  
  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    if (selectorEl && !selectorEl.contains(event.target) && isOpen) {
      isOpen = false;
    }
  }
  
  onMount(() => {
    // Notify of initial active variant
    notifyVariantChange(selectedOption);
    
    // Add click outside handler
    document.addEventListener('mousedown', handleClickOutside);
    
    // Listen for requests from VariantContent about the current state
    const handleActiveVariantRequest = () => {
      notifyVariantChange(selectedOption);
    };
    
    document.addEventListener('requestActiveVariant', handleActiveVariantRequest);
    
    return () => {
      document.removeEventListener('requestActiveVariant', handleActiveVariantRequest);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });

  // Positioning classes
  $: positionClasses = {
    'left': 'left-0 -ml-10 md:-ml-40 top-1/2 -translate-y-1/2',
    'right': 'right-0 -mr-10 top-1/2 -translate-y-1/2',
    'top': 'top-0 -mt-12 left-1/2 -translate-x-1/2',
    'bottom': 'bottom-0 -mb-12 left-1/2 -translate-x-1/2',
  }[position] || 'left-0 -ml-12 top-1/2 -translate-y-1/2';
</script>

<div class="relative group">
  <!-- Selector button -->
  <div
    bind:this={selectorEl} 
    class="absolute z-50 {positionClasses}"
  >
    <button
      class="bg-base-100/80 backdrop-blur-sm hover:bg-base-100 border shadow-sm 
             rounded-md p-1 cursor-pointer transition-all duration-200 flex items-center
             opacity-50 group-hover:opacity-100 hover:opacity-100
             md:scale-100 scale-75 print:hidden"
      on:click={toggleDropdown}
      type="button"
      aria-expanded={isOpen}
      aria-controls="variant-dropdown"
    >
      <span class="text-xs font-mono text-secondary px-1.5 py-0.5">v{options.findIndex(o => o.value === selectedOption) + 1}</span>
      <svg class="w-3.5 h-3.5 text-secondary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Dropdown -->
    {#if isOpen}
      <div 
        id="variant-dropdown"
        class="absolute z-50 p-1 bg-base-100 border shadow-md rounded-md min-w-[80px] 
               {position === 'left' ? 'left-0' : position === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'}"
        transition:fade={{ duration: 100 }}
      >
        {#each options as option, i}
          <button 
            class="w-full text-left py-1 px-2 text-xs rounded hover:bg-secondary/10 
                   {selectedOption === option.value ? 'bg-secondary/20 text-primary' : 'text-neutral'}"
            on:click|stopPropagation={() => selectOption(option.value)}
            type="button"
          >
            v{i + 1}: {option.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Content container -->
  <div class="w-full">
    <slot />
  </div>
</div>

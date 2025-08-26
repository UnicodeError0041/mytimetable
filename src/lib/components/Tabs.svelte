<script lang="ts">
	import type { MaybeGetter } from "melt";
  import { Tabs } from "melt/builders";
	import type { Snippet } from "svelte";

  type Props = {
    tabIds: string[],
    tabIdValue: MaybeGetter<string>,
    selectedContent: Snippet<[string]>
    tabContent: Snippet<[string]>
    onTabChange?: (active: string) => void 
  }

  const {tabIds, tabIdValue, selectedContent, tabContent, onTabChange}: Props = $props();

  const tabs = new Tabs<string>(
    {
        value: tabIdValue,
        onValueChange: onTabChange,
    }
);
</script>

<div class="tabs">
    <div class="tabs__triggers" {...tabs.triggerList}>
      {#each tabIds as id}
        <div class="tabs__trigger" {...tabs.getTrigger(id)}>
          <div class={tabs.value === id ? "" : "--pulse-on-hover"}>
              {@render tabContent(id)}
          </div>
        </div>
      {/each}
    </div>
    
    <div class="tabs__body">
        {#each tabIds as id}
          <div class="tabs__content" {...tabs.getContent(id)}>
            {@render selectedContent(id)}
          </div>
        {/each}
    </div>
</div>
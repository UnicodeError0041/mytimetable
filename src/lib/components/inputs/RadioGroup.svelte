<script lang="ts">
    import { RadioGroup, type RadioGroupProps } from "melt/builders";
	import type { Snippet } from "svelte";

    type Props = {
        items: string[],
        label?: string,
        classes?: string,
        options?: RadioGroupProps,
        value: string,
        valueSnippet?: Snippet<[string]> 
    }

    let {items, label, classes, options, value=$bindable(), valueSnippet}: Props = $props();

    const optionProps: RadioGroupProps = $derived({value, onValueChange: active => value = active, ...options})

    const group = $derived(new RadioGroup(optionProps));

</script>

<div class="radio-group {classes ?? ""}" {...group.root}>
    {#if label}
        <label class="radio-group__label label" {...group.label}>{label}</label> 
    {/if}
    <div class="radio-group__items">
        {#each items as i}
            {@const item = group.getItem(i)}
            <div class="radio-group__item --pulse-on-hover" {...item.attrs}>
                {#if valueSnippet}
                    {@render valueSnippet(item.value)}
                {:else}
                    {item.value}
                {/if}
            </div>
        {/each}
    </div>
    
    <input {...group.hiddenInput} />
</div>
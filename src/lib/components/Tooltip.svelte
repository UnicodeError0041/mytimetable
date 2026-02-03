<script lang="ts">
    import { mergeAttrs } from "melt";
    import { Tooltip, type TooltipProps } from "melt/builders";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

    type Props = {
        content: string | Snippet,
        children: Snippet,
        config?: TooltipProps,
        triggerType?: "hover" | "dragover" | "both" | "none",
        classes?: string,
        attrs?: HTMLAttributes<HTMLElement>
    }

    const {content, children, config, triggerType = "hover", classes="", attrs={}}: Props = $props();

    let shouldBeOpen = $state(false);

    const open = $derived(triggerType === "none" ? false : shouldBeOpen);

    let dragTriggered = false;

    const tooltipProps: TooltipProps = {...config, open: () => open, onOpenChange: value => {

        if (!value){
            shouldBeOpen = value;
            return;
        }

        if ((triggerType === "hover" && dragTriggered) || (triggerType === "dragover" && !dragTriggered)){
            return;
        }
        shouldBeOpen = value;
    }}
    

    const tooltip = new Tooltip(tooltipProps);

    let trigger: EventTarget | null = null;

    let openId: NodeJS.Timeout | null = null;
    let closeId: NodeJS.Timeout | null = null;

    const handleDragEnter = (e: DragEvent) => {
        if (triggerType == "hover"){
            return;
        }

        trigger = e.target;

        e.stopPropagation();
        e.preventDefault();

        if(closeId != null){
            clearTimeout(closeId);
        }

        openId = setTimeout(() => {
            dragTriggered = true; 
            tooltip.open = true; 
            dragTriggered = false;
        }, tooltip.openDelay);
    }

    const handleDragLeave = (e: DragEvent) => {
        if (triggerType === "hover" || trigger !== e.target){
            return;
        }

        e.stopPropagation();
        e.preventDefault();

        if(openId!= null){
            clearTimeout(openId);
        }

        closeId = setTimeout(() => {
            tooltip.open = false;
        }, tooltip.open ? tooltip.closeDelay : tooltip.openDelay);
 
    }
</script>

{#if triggerType === "none"}
<div class="tooltip__trigger {classes}" {...attrs}>
    {@render children()}
</div>
{:else}
    <div class="tooltip__trigger {classes}" {...mergeAttrs(tooltip.trigger, {ondragenter: handleDragEnter, ondragleave: handleDragLeave, ondrop: handleDragLeave}, attrs)}>
        {@render children()}
    </div>
    <div class="tooltip" {...tooltip.content}>
        <div class="tooltip__arrow" {...tooltip.arrow}></div>
        <p class="tooltip__content">
            {#if typeof content === "string"}
                {content}
            {:else}
                {@render content()}
            {/if}
            
        </p>
    </div>
{/if}
<script lang="ts">
	import { Collapsible } from "melt/builders";
	import type { Snippet } from "svelte";

    type Props = {
        headerSnippet: Snippet<[]>,
        children: Snippet<[]>,

        collapsibleClasses?: string,
        headerClasses?: string,
        contentClasses?: string,
        contentHolderClasses?: string,
    };

    const {headerSnippet, children, headerClasses="", contentClasses="", contentHolderClasses="", collapsibleClasses=""} : Props = $props();

    const collapsible = new Collapsible();
</script>
<div class="collpasible {collapsibleClasses}">
    <div class="collapsible__header {headerClasses}">
        {@render headerSnippet()}
        <div class="collapsible__chevron button button--icon --pulse-on-hover --fs-h4" {...collapsible.trigger}><span class="ix--chevron-{collapsible.open ? "up" : "down"}-small"></span></div>
    </div>
    <div class="collapsible__content-holder {contentHolderClasses}" {...collapsible.content}>
        <div class="collapsible__content {contentClasses}">
            {@render children()}
        </div>
    </div>
</div>
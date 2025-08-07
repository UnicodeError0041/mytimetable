<script lang="ts" generics="T">
    import { Combobox } from "melt/builders";

    type Props = {
        options: T[],
        selected: T,
        optionText: (option: T) => string,
        label: string,
        classes?: string,
        required?: boolean,
    }
    
    let {options, optionText, label, selected=$bindable(), classes="", required=false}: Props = $props();

    const combobox = new Combobox<T>({
        onValueChange: value => value !== undefined ? selected = value : "",
        value:selected,

    });

    const filtered = $derived.by(() => {
        if (!combobox.touched) return options;
            return options.filter((o) =>
                optionText(o).toLowerCase().includes(combobox.inputValue.trim().toLowerCase()),
        );
    });
</script>

<div class="combobox {classes}">
    <label class="combobox__label label" {...combobox.label}>{#if required}<span class="--required">*</span>{/if} {label}</label>
    <div class="combobox__holder">
        <input class="combobox__input text-input text-input--secondary" {...combobox.input} value={combobox.value === undefined ? "" : optionText(combobox.value)} />
        <button class="combobox__button button button--icon --fs-h5" {...combobox.trigger}>
            <span class="ix--chevron-{combobox.open ? "up" : "down"}-small"></span>
        </button>
    </div>
    
    <div class="combobox__content" {...combobox.content}>
      {#each filtered as option (option)}
        <div class="combobox__option icon-text --pulse-on-hover" {...combobox.getOption(option)}>
          <p>{optionText(option)}</p>
          {#if combobox.isSelected(option)}
            <span class="ix--single-check icon"></span>
          {/if}
        </div>
      {:else}
        <p class="combobox__no-results">Nincs ilyen opció</p>
      {/each}
    </div>
</div>
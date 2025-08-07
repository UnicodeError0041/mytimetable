<script lang="ts">
	import { timeToString, type Time } from "$lib/lessons/types";
    import { PinInput } from "melt/builders";

    type Props = {
        time: Time | undefined,
        label: string,
        classes?: string,
        required?: boolean,
    }

    let {time=$bindable(), label, classes="", required=false}:Props = $props();

    const isTimeValid = (time: Time) => (0 <= time.hour && time.hour <= 23 && 0 <= time.minute && time.minute <= 59);

    let isValid = $state(time === undefined || isTimeValid(time));

    const value = time === undefined ? undefined : timeToString(time).substring(0,2) + timeToString(time).substring(3,5);

    const pinInput = new PinInput({
        type:"numeric",
        value,
        onValueChange: val => {
            if(val.length !== 4){
                time = undefined;
                isValid = false;
                return;
            }

            const newTime = {hour: Number(val.substring(0, 2)), minute: Number(val.substring(2, 4))};

            if (!isTimeValid(newTime)){
                isValid = false;
                return;
            }

            time = newTime;
            isValid = true;
        },
    });

</script>

<div class={classes}>
    <p class="label">{#if required}<span class="--required">*</span>{/if} {label}</p>
    <div {...pinInput.root}>
        <input class="text-input text-input--digit text-input--secondary" {...pinInput.inputs[0]} value={value === undefined ? undefined : value[0]} />
        <input class="text-input text-input--digit text-input--secondary" {...pinInput.inputs[1]} value={value === undefined ? undefined : value[1]}/>
        <span>:</span>
        <input class="text-input text-input--digit text-input--secondary" {...pinInput.inputs[2]} value={value === undefined ? undefined : value[2]}/>
        <input class="text-input text-input--digit text-input--secondary" {...pinInput.inputs[3]} value={value === undefined ? undefined : value[3]}/>
    </div>
    {#if !isValid}
        <p class="--fs-small --error">Invalid idő</p>
    {/if}
</div>
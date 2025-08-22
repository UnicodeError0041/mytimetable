<script lang="ts">
	import { dayOfWeekToString, semesterToString, timeToString, type Lesson, type LessonData } from "$lib/lessons/types";
	import type { HTMLAttributes } from "svelte/elements";
	import Tooltip from "../Tooltip.svelte";
	import type { TooltipProps } from "melt/builders";
	import type { Snippet } from "svelte";

    type Props = {
        lesson: Lesson
        isEdited?: boolean
        classes? : string
        attrs?: HTMLAttributes<HTMLElement>
        triggerType?: "hover" | "dragover" | "both" | "none"
        extraTooltipElement?: string | Snippet
    }

    const {lesson, isEdited=false, classes = "", attrs = {}, triggerType = "hover", extraTooltipElement}:Props = $props();


    const config: TooltipProps = {
        openDelay: 0,
        closeDelay: 0,
        // closeOnPointerDown: false, 
        floatingConfig: {
            computePosition: {
                placement: "top",
            }
        }
    };

    let textCopied = $state("");

    let startedTimeout: NodeJS.Timeout;

    const handleCopyClick = (text: string) => {
        navigator.clipboard.writeText(text);

        clearTimeout(startedTimeout);
        textCopied = text;
        startedTimeout = setTimeout(() => textCopied = "", 1000);
    }

</script>

{#snippet lessonDataValue(text: string, tooltip: string)}
    <div class="lesson__tooltip-data-value lesson__tooltip-data-value--with-button">
        <p>{text}</p>
        {#if text !== ""}
            <Tooltip content={tooltip}>
                <button
                    aria-label={tooltip}
                    class="button button--icon lesson__tooltip-data-button --secondary --pulse-on-hover --fs-h5"
                    onclick={() => handleCopyClick(text)}
                >
                    <span class={textCopied === text ? "ix--single-check --bounce-in" :"ix--copy"}></span>
                </button>
            </Tooltip>
        {/if}
        
    </div>
{/snippet}

{#snippet tooltipContent()}
    <div class="lesson__tooltip-content">
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Tárgynév: </div>
            {@render lessonDataValue(lesson.subjectName, "Tárgynév másolása")}
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Tárgykód: </div>
            {@render lessonDataValue(lesson.subjectCode, "Tárgykód másolása")}
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Kurzuskód: </div>
            {@render lessonDataValue(lesson.courseCode, "Kurzuskód másolása")}
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Kurzus típus: </div>
            <div class="lesson__tooltip-data-value">{lesson.courseType}</div>
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Tanár/megjegyzés: </div>
            {@render lessonDataValue(lesson.teacherAndComment, "Tanár/megjegyzés másolása")}
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Helyszín: </div>
            {@render lessonDataValue(lesson.location, "Helyszín másolása")}
        </div>
        {#if (lesson.detailedTime == null || isEdited) && lesson.day !== null}
            <div class="lesson__tooltip-data">
                <div class="lesson__tooltip-data-name">Nap: </div>
                <div class="lesson__tooltip-data-value --capitalize">{dayOfWeekToString(lesson.day)}</div>
            </div>
        {/if}
        {#if (lesson.detailedTime == null || isEdited) && lesson.startTime !== null}
            <div class="lesson__tooltip-data">
                <div class="lesson__tooltip-data-name">Kezdés idő: </div>
                <div class="lesson__tooltip-data-value">{timeToString(lesson.startTime)}</div>
            </div>
        {/if}
        {#if (lesson.detailedTime == null || isEdited) && lesson.endTime !== null}
            <div class="lesson__tooltip-data">
                <div class="lesson__tooltip-data-name">Befejezés idő: </div>
                <div class="lesson__tooltip-data-value">{timeToString(lesson.endTime)}</div>
            </div>
        {/if}
        {#if lesson.detailedTime !== null}
             <div class="lesson__tooltip-data">
                <div class="lesson__tooltip-data-name">{isEdited ? "Eredeti idő" : "Idő"}:</div>
                {@render lessonDataValue(lesson.detailedTime, "Részletes idő másolása")}
            </div>
        {/if}
        {#if lesson.semester !== null}
            <div class="lesson__tooltip-data">
                <div class="lesson__tooltip-data-name">Szemeszter: </div>
                <div class="lesson__tooltip-data-value">{semesterToString(lesson.semester)}</div>
            </div>
        {/if}
        {#if extraTooltipElement !== undefined}
            <div class="lesson__tooltip-extra-content">
                {#if typeof extraTooltipElement === "string"}
                    <p class="--fs-small">{extraTooltipElement}</p>
                {:else}
                    {@render extraTooltipElement()}
                {/if}
            </div>
        {/if}
    </div>
{/snippet}

<Tooltip classes="lesson {classes}" content={tooltipContent} {triggerType} {config} {attrs}>
    <div>
        <p class="lesson__subject">
            <span class="lesson__course-code">{lesson.courseCode}</span> {lesson.subjectName}
        </p>
        <p class="lesson__teacher">
            {lesson.teacherAndComment}
        </p>
        <p class="lesson__location">
            {lesson.location}
        </p>
        <p class="lesson__course-type">
            {lesson.courseType}
        </p>
    </div>
    {#if isEdited}
        <div class="icon lesson__edited-icon">
            <span class="ix--edit-document"></span>
        </div>
    {/if}
</Tooltip>

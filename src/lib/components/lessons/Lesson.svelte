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
        triggerType?: "hover" | "dragover" | "both"
        extraTooltipElement?: string | Snippet
    }

    const {lesson, isEdited=false, classes = "", attrs = {}, triggerType = "hover", extraTooltipElement}:Props = $props();


    const config: TooltipProps = {
        openDelay: 400,
        closeDelay: 100,
        // closeOnPointerDown: false, 
        floatingConfig: {
            computePosition: {
                placement: "top",
            }
        }
    };

</script>

{#snippet tooltipContent()}
    <div class="lesson__tooltip-content">
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Tárgynév: </div>
            <div class="lesson__tooltip-data-value">{lesson.subjectName}</div>
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Tárgykód: </div>
            <div class="lesson__tooltip-data-value">{lesson.subjectCode}</div>
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Kurzuskód: </div>
            <div class="lesson__tooltip-data-value">{lesson.courseCode}</div>
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Kurzus típus: </div>
            <div class="lesson__tooltip-data-value">{lesson.courseType}</div>
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Tanár/megjegyzés: </div>
            <div class="lesson__tooltip-data-value">{lesson.teacherAndComment}</div>
        </div>
        <div class="lesson__tooltip-data">
            <div class="lesson__tooltip-data-name">Helyszín: </div>
            <div class="lesson__tooltip-data-value">{lesson.location}</div>
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
                <div class="lesson__tooltip-data-value">{lesson.detailedTime}</div>
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

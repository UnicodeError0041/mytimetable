<script lang="ts">
	import { dayOfWeekToString, semesterToString, timeToString, type DayOfWeek, type Lesson, type LessonData, type Semester, type Time } from "$lib/lessons/types";
	import type { HTMLAttributes } from "svelte/elements";
	import Tooltip from "../Tooltip.svelte";
	import type { TooltipProps } from "melt/builders";
	import { getContext, type Snippet } from "svelte";
	import { SYMBOL_LESSONS_QUERY, type QueryData, type QueryMode } from "$lib/lessons/query";
	import { mode } from "mode-watcher";

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
        openDelay: 300,
        closeDelay: 0,
        // closeOnPointerDown: false, 
        floatingConfig: {
            computePosition: {
                placement: "top",
            }
        }
    };

    let textCopied = $state("");

    let textSearched = $state("");

    let startedTimeout: NodeJS.Timeout;

    const handleCopyClick = (text: string) => {
        navigator.clipboard.writeText(text);

        clearTimeout(startedTimeout);
        textCopied = text;
        startedTimeout = setTimeout(() => textCopied = "", 1000);
    }

    const handleSearchClick = (mode: QueryMode, keyword: string) => {
        queryCtx.queryAction?.(mode, keyword);

        clearTimeout(startedTimeout);
        textSearched = keyword;
        startedTimeout = setTimeout(() => textSearched = "", 1000);
    }

    const displayedTime = $derived(`${dayOfWeekToString(lesson.day as DayOfWeek)} ${timeToString(lesson.startTime as Time)}-${timeToString(lesson.endTime as Time)}`);

    const detailedTime = $derived(
        (lesson.detailedTime == null ? "" : `Eredeti, részletes idő: ${lesson.detailedTime} `)
        +
        (lesson.semester == null ? "" : `Szemeszter: ${semesterToString(lesson.semester)}`)
        );

    const queryCtx = getContext<QueryData>(SYMBOL_LESSONS_QUERY);
</script>

{#snippet lessonDataValue(text: string, tooltip: string, search_config?: {mode: QueryMode, keyword: string, tooltip: string})}
    <div class="lesson__tooltip-data-value lesson__tooltip-data-value--with-button">
        <p>{text}</p>

        
            {#if search_config}
                <Tooltip content={search_config.tooltip}>
                    <button
                        aria-label={search_config.tooltip}
                        class="button button--icon lesson__tooltip-data-button --primary --pulse-on-hover --fs-h5"
                        onclick={() => handleSearchClick(search_config.mode, search_config.keyword)}
                    >
                        <span class={textSearched === search_config.keyword ? "ix--single-check --bounce-in" :"ix--search"}></span>
                    </button>
                </Tooltip>
            {/if}
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

{#snippet lessonDataIcon(iconClasses: string, tooltip: string)}
    <div class="lesson__tooltip-data-name">
        <Tooltip content={tooltip} config={{openDelay: 300, floatingConfig: {computePosition: {placement: "top"}}}}>
            <span class="icon {iconClasses} --fs-h5"></span>
        </Tooltip>
    </div>
{/snippet}

{#snippet tooltipContent()}
    <div class="lesson__tooltip">
        <div class="lesson__tooltip-content">
            <div class="lesson__tooltip-data-header">
                <span class="lesson__course-code">{lesson.courseCode}</span>-es kurzus kódú {lesson.courseType}
            </div>
            <div class="lesson__tooltip-data">
                {@render lessonDataIcon("ix--book", "Tárgynév")}
                {@render lessonDataValue(lesson.subjectName, "Tárgynév másolása", {mode: "keresnevre", keyword: lesson.subjectName, tooltip: "Keresés tárgynévre"})}
            </div>
            <div class="lesson__tooltip-data">
                {@render lessonDataIcon("ix--id", "Tárgykód")}
                {@render lessonDataValue(lesson.subjectCode, "Tárgykód másolása", {mode: "keres_kod_azon", keyword: lesson.subjectCode, tooltip: "Keresés tárgykódra"})}
            </div>
            <div class="lesson__tooltip-data">
                {@render lessonDataIcon("ix--user", "Tanár/megjegyzés")}
                {@render lessonDataValue(lesson.teacherAndComment, "Tanár/megjegyzés másolása", {mode: "keres_okt", keyword: lesson.teacherAndComment, tooltip: "Keresés tanárra"})}
            </div>
            <div class="lesson__tooltip-data">
                {@render lessonDataIcon("ix--location", "Helyszin")}
                {@render lessonDataValue(lesson.location, "Helyszín másolása")}
            </div>
            <div class="lesson__tooltip-data">
                {@render lessonDataIcon("ix--clock", "Idő")}
                <div class="lesson__tooltip-data-value lesson__tooltip-data-value--with-button">
                    <p>{displayedTime}</p>
                    <Tooltip content={detailedTime} config={{openDelay: 300, floatingConfig: {computePosition: {placement: "top"}}}}>
                        <div class="button button--icon lesson__tooltip-data-button --background --fs-h5">
                            <span class="icon ix--info"></span>
                        </div>
                    </Tooltip>
                </div>
            </div>
        </div>
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

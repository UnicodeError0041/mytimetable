<script lang="ts">
	import { createLessonsQuery, SYMBOL_LESSONS_QUERY, type QueryData, type QueryMode } from "$lib/lessons/query";
	import { getContext } from "svelte";
	import SearchModeRadioGroup from "./inputs/SearchModeRadioGroup.svelte";
	import SemesterRadioGroup from "./inputs/SemesterRadioGroup.svelte";
	import { dayOfWeekToString, hasTimetableData, semesterFromString, type DayOfWeek, type LessonData, type Semester } from "$lib/lessons/types";
    import { debounced } from '$lib/utility.svelte';
	import type { CreateQueryResult } from "@tanstack/svelte-query";
	import Tooltip from "./Tooltip.svelte";
	import Collapsible from "./Collapsible.svelte";
	import { derived } from "svelte/store";

    type QueryArgs = [
        Semester,
        string,
        QueryMode,
    ]

    let semester = $state("2024-2025-2");
    let mode: QueryMode = $state("keresnevre");
    let keyword = $state("");

    let queryArgs: QueryArgs = $state([semesterFromString(semester), keyword.trim(), mode]);

    const debouncedQueryArgs = debounced(() => queryArgs, 500);

    const createQueryResult: CreateQueryResult<LessonData[], Error> | null = $derived.by( () =>
        debouncedQueryArgs()[1] !== "" ? createLessonsQuery(...debouncedQueryArgs()) : null
    );
    
    const query = $derived($createQueryResult);

    const allQueriedLessons = $derived(query?.data ?? []);

    const validQueriedLessons = $derived(allQueriedLessons.filter(data => hasTimetableData(data.lesson)));
    
    const ctx = getContext<QueryData>(SYMBOL_LESSONS_QUERY);

    const subjects = $derived.by(() => {
        let subjectCodes = new Set<string>();
        
        validQueriedLessons.forEach(l => {
            subjectCodes.add(l.lesson.subjectCode);
        });

        let returned: {code: string, name: string}[] = [];

        subjectCodes.forEach(code => {
            returned.push(
                {
                    code,
                    name: validQueriedLessons.find(l => l.lesson.subjectCode === code)
                    ?.lesson.subjectName ?? "Tárgy"
                }
            );
        });

        return returned.sort((a, b) => a.code.localeCompare(b.code, "hu", {numeric: true}));
    });

    const teachers = $derived.by(() => {
        return Array.from(new Set(validQueriedLessons.map(l => l.lesson.teacherAndComment))).sort((a, b) => a.localeCompare(b, "hu", {numeric: true}));
    });

    const courseTypes = $derived.by(() => {
        return Array.from(new Set(validQueriedLessons.map(l => l.lesson.courseType))).sort((a, b) => a.localeCompare(b, "hu", {numeric: true}));
    });

    const days = $derived.by(() => {
        const order = ["h", "k", "s", "c", "p"];
        return Array.from(new Set(validQueriedLessons.map(l => l.lesson.day as DayOfWeek))).sort((a, b) => order.findIndex(d => d === a) - order.findIndex(d => d === b));
    });

    let excludedSubjectCodes: string[] = $state([]);
    let excludedTeachers: string[] = $state([]);
    let excludedCourseTypes: string[] = $state([]);
    let excludedDays: DayOfWeek[] = $state([]);

    const getSubjectCount = $derived((code: string) => 
        validQueriedLessons.filter(l =>
            l.lesson.subjectCode === code && 
            !excludedTeachers.includes(l.lesson.teacherAndComment) &&
            !excludedCourseTypes.includes(l.lesson.courseType) &&
            !excludedDays.includes(l.lesson.day as DayOfWeek)
        ).length
    );

    const getTeacherCount = $derived((teacher: string) => 
        validQueriedLessons.filter(l => 
            !excludedSubjectCodes.includes(l.lesson.subjectCode) &&
            l.lesson.teacherAndComment === teacher &&
            !excludedCourseTypes.includes(l.lesson.courseType) &&
            !excludedDays.includes(l.lesson.day as DayOfWeek)
        ).length
    );

    const getCourseTypeCount = $derived((type: string) => 
        validQueriedLessons.filter(l => 
            !excludedSubjectCodes.includes(l.lesson.subjectCode) &&
            !excludedTeachers.includes(l.lesson.teacherAndComment) &&
            l.lesson.courseType === type &&
            !excludedDays.includes(l.lesson.day as DayOfWeek)
        ).length
    );

    const getDayCount = $derived((day: DayOfWeek) => 
        validQueriedLessons.filter(l => 
            !excludedSubjectCodes.includes(l.lesson.subjectCode) &&
            !excludedTeachers.includes(l.lesson.teacherAndComment) &&
            !excludedCourseTypes.includes(l.lesson.courseType) &&
            l.lesson.day === day
        ).length
    );

    const filteredLessons = $derived(validQueriedLessons.filter(l => 
        !excludedSubjectCodes.includes(l.lesson.subjectCode) &&
        !excludedTeachers.includes(l.lesson.teacherAndComment) &&
        !excludedCourseTypes.includes(l.lesson.courseType) &&
        !excludedDays.includes(l.lesson.day as DayOfWeek)
    ))

    const clearFilters = () => {
        excludedSubjectCodes = [];
        excludedTeachers = [];
        excludedCourseTypes = [];
        excludedDays = [];
    }

    const clearFiltersClickHandler = (e: MouseEvent) => {
        clearFilters();
    }


    $effect(() => {
        ctx.queriedLessons =  filteredLessons;
    })

    const onSubmit = (e: SubmitEvent) => {
        e.preventDefault();

        clearFilters();
        queryArgs = [semesterFromString(semester), keyword.trim(), mode];
    }
</script>
<form class="search" onsubmit={onSubmit}>
    <input class="text-input" type="search" name="name" bind:value={keyword} 
        placeholder="pl: {
            mode === "keres_kod_azon" ? 
                "IP-UL0S3T" 
            : mode === "keresnevre" ?
                "Analízis"
            :
                "Gyenge Pisti"
        }" 
    >
    <SemesterRadioGroup semesterCount={4} label="Félévek" options={{orientation: "horizontal"}} bind:value={semester}/>
    <SearchModeRadioGroup label="Keresés mód" options={{orientation: "horizontal"}} bind:value={mode}/>
    <button class="icon-text button --pulse-on-hover button--primary-filled --fs-h5" type="submit" disabled={query?.isLoading}>
        <span class={query?.isLoading ? "ix--draw-circle-arc --spinning" : "ix--search"}></span>
        <p>Keresés</p>
    </button>

    {#if query?.isLoading}
        <p>Keresés...</p>
    {:else if query?.isFetched}
        {#if validQueriedLessons.length !== 0}
            {#snippet collapsibleHeader()}
                <div class="search__filter-icon-holder">
                    {#if filteredLessons.length !== validQueriedLessons.length}
                        <Tooltip content="Szűrő viszzaállítása">
                            <button aria-label="szűrő viszzaállítása" class="button button--icon button--primary-filled --pulse-on-hover --fs-h4"
                                onclick={clearFiltersClickHandler}
                            >
                                <div class="ix--clear-filter"></div>
                            </button>
                        </Tooltip>
                    {:else}
                        <div class="search__filter-icon">
                            <div class="icon --fs-h4"><span class="ix--filter"></span></div>
                        </div>
                    {/if}
                </div>
                <div>Szűrés</div>
            {/snippet}

            <Collapsible 
                headerSnippet={collapsibleHeader}
                collapsibleClasses="search__filter"
                headerClasses="search__filter-header --fs-h5"
                contentHolderClasses="search__filter-content-holder"
                contentClasses="search__filter-content"
            >
                <div>
                    {#snippet subjectHeader()}
                        <label class="label--inline --fs-h5">
                            <input type="checkbox"
                                name="összes tárgy szűrése"
                                checked={excludedSubjectCodes.length === 0}
                                class="checkbox"

                                onchange={e => {
                                    e.stopPropagation();
                                    
                                    return excludedSubjectCodes.length === 0 ? 
                                        excludedSubjectCodes = subjects.map(s => s.code)
                                    : 
                                        excludedSubjectCodes = []
                                }
                                    
                                }
                            >
                            <span>Tárgyak: 
                                <span class="--fs-small --half-transparent">{subjects.length - excludedSubjectCodes.length}/{subjects.length}</span>
                            </span>
                        </label>
                    {/snippet}
                    
                    <Collapsible headerSnippet={subjectHeader}>
                        <div class="search__filter-category">
                            {#each subjects as subject}
                                <div>
                                    <label class="label--inline">
                                        <input type="checkbox"
                                            name="{subject.code} ({subject.name})"
                                            checked={!excludedSubjectCodes.includes(subject.code)}
                                            class="checkbox"

                                            onchange={() =>
                                                excludedSubjectCodes.includes(subject.code) ?
                                                    excludedSubjectCodes = excludedSubjectCodes.filter(c => c !== subject.code)
                                                :
                                                    excludedSubjectCodes.push(subject.code)
                                            }
                                        >
                                        <span>{subject.code} <span class="--fs-small">({subject.name})</span></span>
                                    </label>
                                    <p class="--fs-small --half-transparent">{getSubjectCount(subject.code)}db</p>
                                </div>
                            {/each}
                        </div>
                    </Collapsible>
                    
                </div>
                <div>
                    {#snippet courseHeader()}
                        <label class="label--inline --fs-h5">
                            <input type="checkbox" 
                                name="összes kurzus típus szűrése" 
                                checked={excludedCourseTypes.length === 0}
                                class="checkbox"

                                onchange={() => 
                                    excludedCourseTypes.length === 0 ? 
                                        excludedCourseTypes = courseTypes.map(s => s)
                                    : 
                                        excludedCourseTypes = []
                                }
                            >
                            <span>Kurzus típus: 
                                <span class="--fs-small --half-transparent">{courseTypes.length - excludedCourseTypes.length}/{courseTypes.length}</span>
                            </span>
                        </label>
                    {/snippet}
                    
                    <Collapsible headerSnippet={courseHeader}>
                        <div class="search__filter-category">
                            {#each courseTypes as type}
                                <div>
                                    <label class="label--inline">
                                        <input type="checkbox" name="{type}"
                                            checked={!excludedCourseTypes.includes(type)}
                                            class="checkbox"

                                            onchange={() =>
                                                excludedCourseTypes.includes(type) ?
                                                    excludedCourseTypes = excludedCourseTypes.filter(c => c !== type)
                                                :
                                                    excludedCourseTypes.push(type)
                                            }
                                        >
                                        <span>{type}</span>
                                    </label>
                                    <p class="--fs-small --half-transparent">
                                        {getCourseTypeCount(type)}db
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </Collapsible>
                </div>
                <div>
                    {#snippet teacherHeader()}
                        <label class="label--inline --fs-h5">
                            <input type="checkbox" 
                                name="összes tanár szűrése" 
                                checked={excludedTeachers.length === 0}
                                class="checkbox"

                                onchange={() => 
                                    excludedTeachers.length === 0 ? 
                                        excludedTeachers = teachers
                                    : 
                                        excludedTeachers = []
                                }
                            >
                            <span>Tanárok/Kommentek: 
                                <span class="--fs-small --half-transparent">{teachers.length - excludedTeachers.length}/{teachers.length}</span>
                            </span>
                        </label>
                    {/snippet}
                    
                    <Collapsible headerSnippet={teacherHeader}>
                        <div class="search__filter-category">
                            {#each teachers as teacher}
                                <div>
                                    <label class="label--inline">
                                        <input type="checkbox" name="{teacher}"
                                            checked={!excludedTeachers.includes(teacher)}
                                            class="checkbox"

                                            onchange={() =>
                                                excludedTeachers.includes(teacher) ?
                                                    excludedTeachers = excludedTeachers.filter(c => c !== teacher)
                                                :
                                                    excludedTeachers.push(teacher)
                                            }
                                        >
                                        <span>{teacher}</span>
                                    </label>
                                    <p class="--fs-small --half-transparent">
                                        {getTeacherCount(teacher)}db
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </Collapsible>
                </div>
                <div>
                    {#snippet dayHeader()}
                        <label class="label--inline --fs-h5">
                            <input type="checkbox" 
                                name="összes nap szűrése" 
                                checked={excludedDays.length === 0}
                                class="checkbox"

                                onchange={() => 
                                    excludedDays.length === 0 ? 
                                        excludedDays = days.map(s => s)
                                    : 
                                        excludedDays = []
                                }
                            >
                            <span>Napok: 
                                <span class="--fs-small --half-transparent">{days.length - excludedDays.length}/{days.length}</span>
                            </span>
                        </label>
                    {/snippet}
                    
                    <Collapsible headerSnippet={dayHeader}>
                        <div class="search__filter-category">
                            {#each days as day}
                                <div>
                                    <label class="label--inline">
                                        <input type="checkbox" name="{dayOfWeekToString(day)}"
                                            checked={!excludedDays.includes(day)}
                                            class="checkbox"

                                            onchange={() =>
                                                excludedDays.includes(day) ?
                                                    excludedDays = excludedDays.filter(c => c !== day)
                                                :
                                                    excludedDays.push(day)
                                            }
                                        >
                                        <span>{dayOfWeekToString(day)}</span>
                                    </label>
                                    <p class="--fs-small --half-transparent">
                                        {getDayCount(day)}db
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </Collapsible>
                </div>
            </Collapsible>
        {/if}
        <p>{allQueriedLessons.length} találatból {filteredLessons.length} megjelenítve</p>
        {#if allQueriedLessons.length !== validQueriedLessons.length}
            <div class="--warning icon-text">
                <span class="ix--warning"></span>
                <p>{allQueriedLessons.length - validQueriedLessons.length}db órához nincs elég időpont-információ a megjelenítéshez</p>
            </div>
        {/if}
    {/if}
</form>
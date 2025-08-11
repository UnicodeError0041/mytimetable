<script lang="ts">
	import { browser } from '$app/environment';
	import { page }  from '$app/state';
	import {replaceState} from '$app/navigation';

	import Editor from '$lib/components/Editor.svelte';
	import Search from '$lib/components/Search.svelte';
	import { createLessonAlternatives, SYMBOL_LESSON_ALTERNATIVES, type LessonAlternatives } from '$lib/lessons/lessonAlternatives.svelte';
	import { SYMBOL_SAVED_LESSONS} from '$lib/lessons/lessonManager.svelte';
	import { SYMBOL_LESSONS_QUERY, type QueryData } from '$lib/lessons/query';
	import { loadSavedLessonsFromLocalStorage, type SavedLessons } from '$lib/lessons/savedLessons.svelte';
	import {setContext } from 'svelte';
	import {decodeURI} from "$lib/lessons/encode"

	const savedLessons = loadSavedLessonsFromLocalStorage();
    
    setContext<SavedLessons>(SYMBOL_SAVED_LESSONS, savedLessons);

    let query: QueryData = $state({queriedLessons: null});
    
    setContext<QueryData>(SYMBOL_LESSONS_QUERY, query);

	setContext<LessonAlternatives>(SYMBOL_LESSON_ALTERNATIVES, createLessonAlternatives());

	if(browser){
    	const param = page.url.searchParams.get('data');

		if (param){
			const lessonSave = decodeURI(param);

			const id = savedLessons.createSave(`Velem megosztott: ${lessonSave.saveName}`, lessonSave.lessons);

			if (id) savedLessons.switchSave(id);

			page.url.searchParams.delete('data');

			setTimeout(() => replaceState(page.url, {}), 0);
		}

	}
</script>

<svelte:head>
	<title>Easy Timetable</title>
</svelte:head>

<Search/>
<Editor/>


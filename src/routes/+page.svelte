<script lang="ts">
	import Editor from '$lib/components/Editor.svelte';
	import LessonInput from '$lib/components/inputs/LessonInput.svelte';
	import Search from '$lib/components/Search.svelte';
	import { createLessonAlternatives, SYMBOL_LESSON_ALTERNATIVES, type LessonAlternatives } from '$lib/lessons/lessonAlternatives.svelte';
	import { SYMBOL_SAVED_LESSONS} from '$lib/lessons/lessonManager.svelte';
	import { SYMBOL_LESSONS_QUERY, type QueryData } from '$lib/lessons/query';
	import { loadSavedLessonsFromLocalStorage, type SavedLessons } from '$lib/lessons/savedLessons.svelte';
	import {setContext } from 'svelte';

	const savedLessons = loadSavedLessonsFromLocalStorage();
    
    setContext<SavedLessons>(SYMBOL_SAVED_LESSONS, savedLessons);

    let query: QueryData = $state({queriedLessons: null});
    
    setContext<QueryData>(SYMBOL_LESSONS_QUERY, query);

	setContext<LessonAlternatives>(SYMBOL_LESSON_ALTERNATIVES, createLessonAlternatives());
</script>

<Search/>
<Editor/>


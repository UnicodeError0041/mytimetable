import { MODE, SEMESTER, KEYWORD } from '$lib/lessons/query';
import {JSDOM} from "jsdom";
import type { RequestHandler } from "@sveltejs/kit";
import { semesterFromString, timeFromString, type DayOfWeek, type Lesson, type Time } from '$lib/lessons/types';
import { timesFromDetailedTime } from '$lib/lessons/encode';

const URL = "https://tanrend.elte.hu/tanrendnavigation.php";

export const GET: RequestHandler = async ({ url }) => {
    const mode = url.searchParams.get(MODE);
	const semester = url.searchParams.get(SEMESTER);
    const keyword = url.searchParams.get(KEYWORD);

    const responseText = await(await fetch(`${URL}?${MODE}=${mode}&${SEMESTER}=${semester}&${KEYWORD}=${keyword}`)).text()

    const html = new JSDOM(responseText).window.document;

    let returned: Lesson[] = [];

    for(const row of html.querySelectorAll("tbody>tr")){
        const detailedTime = row.childNodes[0].textContent;
        const {startTime, endTime, day} = timesFromDetailedTime(detailedTime);


        const cell2Data = row.childNodes[1].textContent?.split(" ") as string[];

        const splitIndex = cell2Data[0].lastIndexOf("-");

        const subjectCode = cell2Data[0].substring(0, splitIndex);
        const courseCode = cell2Data[0].substring(splitIndex + 1);

        const courseType = cell2Data[1].substring(1, cell2Data[1].length - 1);


        const subjectName = row.childNodes[2].textContent as string;
        const location = row.childNodes[3].textContent as string;

        const teacherAndComment = (row.childNodes[5].textContent as string).trim();

        const semesterObj = semester ? semesterFromString(semester) : null;

        returned.push({
            day,
            startTime,
            endTime,
            semester: semesterObj,
            detailedTime,
            subjectCode,
            courseCode,
            courseType,
            subjectName,
            location,
            teacherAndComment,
        });
        
    }

	return new Response(JSON.stringify(returned));
}
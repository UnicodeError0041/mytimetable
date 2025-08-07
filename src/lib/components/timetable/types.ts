import type { Time } from "$lib/lessons/types";

export type TimeTableData<T> = {data: T, time:{startTime: Time, endTime: Time, day: string}};

export type PlacementData = {
        column: number,
        neighbours: number,
        span: number
    };

export type PlacedTimeTableData<T> = TimeTableData<T> & PlacementData;

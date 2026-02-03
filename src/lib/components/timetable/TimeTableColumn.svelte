<script lang="ts" generics="T">
    import { dayOfWeekToString, timeToNumber, type DayOfWeek, type Time } from "$lib/lessons/types";
	import type { Snippet } from "svelte";
    import type { PlacedTimeTableData, PlacementData, TimeTableData } from "./types"
	import {lcm} from "$lib/utility.svelte";
	import TimeTableElement from "./TimeTableElement.svelte";

    type Props = {
        datas: TimeTableData<T>[]
        element: Snippet<[T]>,
        minTime: Time,
        maxTime: Time,
        day: DayOfWeek,
        dayIdx: number,
        fastOrdering?: boolean
    };

    const {datas, element, minTime, maxTime, day, dayIdx, fastOrdering=false}: Props = $props();

    const sortedDatas = $derived(
        // fastOrdering ? 
        //     datas 
        // : 
        datas.toSorted((a, b) => 
            timeToNumber(maxTime) * (timeToNumber(a.time.startTime) - timeToNumber(b.time.startTime)) +
            timeToNumber(b.time.endTime) - timeToNumber(a.time.endTime) 
        )
    );

    const isDataInBlock = (blockColumn: number, blockTopTime: Time, blockBottomTime: Time, element: PlacedTimeTableData<T>) => {
        const blockTopValue = timeToNumber(blockTopTime);
        const blockBottomValue = timeToNumber(blockBottomTime);

        const topValue = timeToNumber(element.time.startTime);
        const bottomValue = timeToNumber(element.time.endTime);

        const startColumn = element.column;
        const endColumn = element.column + element.span - 1;

        return !(blockColumn > endColumn || blockColumn < startColumn || bottomValue <= blockTopValue || topValue >= blockBottomValue);
    }

    const isBlockEmpty = 
        (blockColumn: number, columnCount: number, blockTopTime: Time, blockBottomTime: Time, elements: PlacedTimeTableData<T>[]) =>
            blockColumn < 0 || blockColumn >= columnCount ?
                false
            :
                !elements.some(e => isDataInBlock(blockColumn, blockTopTime, blockBottomTime, e));
    
    const elementsInBlock = 
            (blockColumn: number, columnCount: number, blockTopTime: Time, blockBottomTime: Time, elements: PlacedTimeTableData<T>[]) =>
                blockColumn < 0 || blockColumn >= columnCount ?
                    [] 
                : 
                    elements.filter(e => isDataInBlock(blockColumn, blockTopTime, blockBottomTime, e));
    
    const getRightNeighbourIndicies = (element: PlacedTimeTableData<T>, elements: PlacedTimeTableData<T>[], columnCount: number) => {
        let indicies: Set<number> = new Set();

        const neighbours = elementsInBlock(element.column + element.span, columnCount, element.time.startTime, element.time.endTime, elements);
        for(const neighbour of neighbours){
            indicies.add(elements.findIndex(e => e === neighbour));
            indicies = indicies.union(getRightNeighbourIndicies(neighbour, elements, columnCount));
        }

        return indicies;
    }
    
    const moveNeighboursRight = (element: PlacedTimeTableData<T>, elements: PlacedTimeTableData<T>[], columnCount: number) => {
        const indicies = getRightNeighbourIndicies(element, elements, columnCount);

        for(const idx of indicies){
            elements[idx].column++;
        }
    }

    const [placementDatas, columns] = $derived.by(() => {
        let returned: PlacedTimeTableData<T>[] = [];
        let row: PlacedTimeTableData<T>[] = [];
        let rows: PlacedTimeTableData<T>[][] = [];

        let columns = 1;
        
        {// First pass
            let minEndTimeValue = Infinity;
            let minEndTimeIndex = 0;

            let maxEndTimeValue = -Infinity;

        
            for(const data of sortedDatas){
                rows.push([...row]);

                let placementData = {...data, column: -1, neighbours: -1, span:-1};
                returned.push(placementData);

                let currentStartTimeValue = timeToNumber(data.time.startTime);
                let currentEndTimeValue = timeToNumber(data.time.endTime);

                if (currentStartTimeValue >= maxEndTimeValue){
                    row = [];

                    minEndTimeValue = Infinity;
                    minEndTimeIndex = 0;

                    maxEndTimeValue = -Infinity;
                }

                if (row.length === 0 || currentStartTimeValue < minEndTimeValue){
                    row = [...row, placementData];
                    placementData.column = row.length - 1;
                    row.forEach(d => d.neighbours = Math.max(row.length, d.neighbours));

                    if (currentEndTimeValue < minEndTimeValue){
                        minEndTimeValue = currentEndTimeValue;
                        minEndTimeIndex = placementData.column;
                    }

                    maxEndTimeValue = Math.max(maxEndTimeValue, currentEndTimeValue);

                    continue;
                }
                
                
                for(let i = 0; i < row.length; i++){
                    if (timeToNumber(row[i].time.endTime) <= currentStartTimeValue){
                        row[i] = placementData;
                        placementData.column = i;
                        break;
                    }
                }

                placementData.neighbours = row.length;
                
                minEndTimeValue = Infinity;
                minEndTimeIndex = placementData.column;

                maxEndTimeValue = -Infinity;

                for (let i = 0; i < row.length; i++){
                    const value = timeToNumber(row[i].time.endTime);

                    if(value < minEndTimeValue){
                        minEndTimeValue = value;
                        minEndTimeIndex = i;
                    }
                    maxEndTimeValue = Math.max(maxEndTimeValue, value);
                }
            }

            rows.push([...row]);
        }
        
        {// Second pass
            for(let row_ of rows.reverse()){
                const max = Math.max(...row_.map((d => d.neighbours)));

                columns = max >= 1 ? lcm(max, columns) : columns;
                row_.forEach(d => d.neighbours = max);
            }

            returned.forEach(d => {
                d.span = columns / d.neighbours;
                d.column *= d.span;
            });
        }

        if(fastOrdering){
            return [returned, columns];
        }

        {// Move left
            let moved = true;

            while (moved){
                moved = false;

                for(let data of returned){
                    if (isBlockEmpty(data.column - 1, columns, data.time.startTime, data.time.endTime, returned)){
                        data.column--;
                        moved = true;
                    }
                }
            }
        }

        {// Extend right
            let sortedReturend = returned.toSorted((a, b) => b.column + b.span - a.column - a.span);
            let fixed: Set<number> = new Set();
            
                
            while(fixed.size !== sortedReturend.length){
                let sortedReturend = returned.toSorted((a, b) => b.column + b.span - a.column - a.span);

                for(let i = 0; i < sortedReturend.length; i++){
                    fixed.add(i);
                }

                for(let i = 0; i < sortedReturend.length; i++){
                    const data = sortedReturend[i];
                
                    if (isBlockEmpty(data.column + data.span, columns, data.time.startTime, data.time.endTime, [...fixed].map(j => sortedReturend[j]))){
                        fixed.delete(i);
                    }
                }

                
                for (let i = sortedReturend.length - 1; i >= 0; i--){
                    if(fixed.has(i)){
                        continue;
                    }

                    
                    moveNeighboursRight(sortedReturend[i], sortedReturend, columns);
                    sortedReturend[i].span++;

                    for(let j = 0; j < sortedReturend.length; j++){
                        let data = sortedReturend[j];

                        if(fixed.has(j)){
                            continue;
                        }
                    
                        if (!isBlockEmpty(data.column + data.span, columns, data.time.startTime, data.time.endTime, [...fixed].map(k => sortedReturend[k]))){
                            fixed.add(j);
                        }
                    }
                }
            }
        }

        return [returned, columns];
    });

</script>
<div class="timetable__column" style="--day-idx: {dayIdx};">
    <p class="timetable__column-day">{dayOfWeekToString(day)}</p>
    <div class="timetable__column-content" style="--columns: {columns};"
    >
        {#each placementDatas as data}
            <TimeTableElement placementData={data} element={element} minTime={minTime} maxTime={maxTime}/>
        {/each}
    </div>
</div>


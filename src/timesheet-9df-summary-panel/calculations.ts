import {
	addWeeks,
	differenceInHours,
	endOfDay,
	isWithinInterval,
	startOfDay,
} from "date-fns"

// Function to calculate the difference between two dates in hours
function calculateHoursBetweenDates(start: Date, end: Date) {
	return differenceInHours(end, start)
}

// Function to create two-week blocks
function createTwoWeekBlocks(start: Date, end: Date) {
	const blocks = []
	let currentStart = startOfDay(start)
	while (currentStart < end) {
		let currentEnd = endOfDay(addWeeks(currentStart, 2))
		blocks.push({ start: currentStart, end: currentEnd })
		currentStart = startOfDay(addWeeks(currentEnd, 1))
	}
	return blocks
}

// Function to calculate total time spent on tasks in two-week blocks
export function calculateTimeSpent(data: any[], start: Date) {
	const now = new Date()
	const blocks = createTwoWeekBlocks(start, now)
	const blockTotals = blocks.map((block) => ({
		startDate: block.start,
		totalTime: 0,
	}))

	data.forEach((item) => {
		const startTime = new Date(item.start_time)
		const endTime = new Date(item.end_time)
		const hours = calculateHoursBetweenDates(startTime, endTime)

		for (let i = 0; i < blocks.length; i++) {
			if (
				isWithinInterval(startTime, blocks[i]) &&
				isWithinInterval(endTime, blocks[i])
			) {
				blockTotals[i].totalTime += hours
				break
			}
		}
	})

	return blockTotals
}

// Usage
// const totalTimeSpent = calculateTimeSpent(response.data.data, new Date(userDetails.nineDayFortnightStart));

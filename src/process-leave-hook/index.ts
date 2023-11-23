import { Settings } from "./ts-settings"
import { createError } from "@directus/errors"
import { defineHook } from "@directus/extensions-sdk"
const InvalidLeaveDateError = createError(
	"INVALID_LEAVE_DATE_ERROR",
	"The start date must be less than the end date.",
	400
)

/**
 * Returns the number of work hours in a date range, given a number of hours in a normal work day
 * @param leaveHoursPerDay
 * @param startDateString
 * @param endDateString
 * @returns
 */
function calculateWorkHours(
	leaveHoursPerDay: number,
	startDateString: string,
	endDateString: string
) {
	let startDate = new Date(startDateString)
	let endDate = new Date(endDateString)
	let numberOfDays = 1 // Start with 1 to include the start date

	// Loop through each day between start and end dates
	for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
		// Check if the day is not a Saturday (6) or Sunday (0)
		if (d.getDay() !== 0 && d.getDay() !== 6) {
			numberOfDays++
		}
	}
	return numberOfDays * leaveHoursPerDay
}

export default defineHook(({ filter, action }, { services }) => {
	filter("items.create", async (input, meta, { schema }) => {
		if (meta.collection !== "leave") {
			return // Just move on
		}

		// TODO: Check no existing dates overlap

		// if dates are the default in Directus they are not passed in the input, add them here
		if (!("start_date" in input)) {
			input["start_date"] = new Date().toISOString().substring(0, 10)
		}
		if (!("end_date" in input)) {
			input["end_date"] = new Date().toISOString().substring(0, 10)
		}

		const settings = await Settings.get(services, schema)
		const leaveHoursPerDay = settings.leave_hours_per_day

		const workHours = calculateWorkHours(
			leaveHoursPerDay,
			input.start_date,
			input.end_date
		)

		input["total_hours"] = workHours

		return input
	})

	// Validation checks before item is updated
	// TODO: OOPS! Should do total hours calculation in ACTION, and start date check in filter!
	// action(
	// 	"items.update",
	// 	async ({ payload, keys, collection }, { schema, accountability }) => {
	// 		if (collection !== "leave") {
	// 			return // Just move on
	// 		}

	// 		if ("start_date" in payload || "end_date" in payload) {
	// 			const { ItemsService } = services
	// 			const leaveService = new ItemsService("leave", {
	// 				schema: schema,
	// 				accountability: accountability,
	// 			})
	// 			const leavesBeingUpdated = await leaveService.readMany(keys)

	// 			for (const leaveBeingUpdated in leavesBeingUpdated) {
	// 				const startDate = payload?.start_date || leaveBeingUpdated.start_date // Use the payload date if it exists, otherwise use the existing date
	// 				const endDate = payload?.end_date || leaveBeingUpdated.end_date

	// 				// Check start date is less than end date (as user could be bulk updating dates and one date may be invalid)
	// 				if (startDate > endDate) {
	// 					throw new InvalidLeaveDateError()
	// 				}
	// 			}
	// 		}
	// 	}
	// )

	// If start date or end date is changed, recalculate total hours
	filter(
		"items.update",
		async (payload, { collection, keys }, { schema, accountability }) => {
			if (collection !== "leave") {
				return // Just move on
			}

			const settings = await Settings.get(services, schema)
			const leaveHoursPerDay = settings.leave_hours_per_day

			if ("start_date" in payload || "end_date" in payload) {
				const { ItemsService } = services
				const leaveService = new ItemsService("leave", {
					schema: schema,
					accountability: accountability,
				})
				const leavesBeingUpdated = await leaveService.readMany(keys)

				// TODO: check if the start date or end date don't overlap with existing bookings
				// TODO: Retrieve all future bookings (all leave with end_date <= today)
				// const otherLeave = await leaveService.readMany({
				// 	end_date: {
				// 		_gt: new Date().toISOString().substring(0, 10),
				// 		user: accountability.user,
				// 	},
				// })

				let leaveCount = 0

				for (const leaveBeingUpdated in leavesBeingUpdated) {
					const startDate = payload?.start_date || leaveBeingUpdated.start_date // Use the payload date if it exists, otherwise use the existing date
					const endDate = payload?.end_date || leaveBeingUpdated.end_date

					console.log("CHECKING DATES")

					// TODO: Why is this not working?
					if (new Date(startDate) > new Date(endDate)) {
						console.log("INVALID DATE", startDate, endDate)
						throw new InvalidLeaveDateError()
					}

					const workHours = calculateWorkHours(
						leaveHoursPerDay,
						startDate,
						endDate
					)

					await leaveService.updateOne(
						keys[leaveCount],
						{ total_hours: workHours },
						{
							emitEvents: false, // Don't emit events to avoid infinite loop
						}
					)
					leaveCount++
				}
			}
		}
	)
})

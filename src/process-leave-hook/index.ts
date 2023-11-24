import { Settings } from "./ts-settings"
import { createError } from "@directus/errors"
import { defineHook } from "@directus/extensions-sdk"
const InvalidLeaveDateError = createError(
	"INVALID_LEAVE_DATE_ERROR",
	"The start date must be less than the end date.",
	400
)
const ConflictingLeaveDateError = createError(
	"CONFLICTING_LEAVE_DATE_ERROR",
	"The leave date(s) conflict with existing leave.",
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
	let numberOfDays = 0

	// Loop through each day between start and end dates
	for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
		// Check if the day is not a Saturday (6) or Sunday (0)
		if (d.getDay() !== 0 && d.getDay() !== 6) {
			numberOfDays++
		}
	}
	return numberOfDays * leaveHoursPerDay
}

// Given the existing leave and the new leave, check if the dates overlap
function checkOverlappingLeave(
	startDate: string,
	endDate: string,
	currentLeave: array
) {}

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

		// Check start date < end date
		if (new Date(input.start_date) > new Date(input.end_date)) {
			throw new InvalidLeaveDateError()
		}

		// Retrieve all future leave, for use when checking for leave conflicts
		const currentLeave = await leaveService.readByQuery({
			filter: {
				end_date: {
					_gt: new Date().toISOString().substring(0, 10),
					user: accountability.user,
				},
			},
		})

		// Check the leave dates don't overlap with existing leave
		for (const leave of currentLeave) {
			if (
				(new Date(startDate) >= new Date(leave.start_date) &&
					new Date(startDate) <= new Date(leave.end_date)) ||
				(new Date(endDate) >= new Date(leave.start_date) &&
					new Date(endDate) <= new Date(leave.end_date))
			) {
				throw new ConflictingLeaveDateError()
			}
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

	// If start date or end date is changed, recalculate total hours
	filter(
		"items.update",
		async (payload, { collection, keys }, { schema, accountability }) => {
			if (collection !== "leave") {
				return // Just move on
			}

			if ("start_date" in payload || "end_date" in payload) {
				const settings = await Settings.get(services, schema)
				const leaveHoursPerDay = settings.leave_hours_per_day

				const { ItemsService } = services
				const leaveService = new ItemsService("leave", {
					schema: schema,
					accountability: accountability,
				})
				const leavesBeingUpdated = await leaveService.readMany(keys)

				// Retrieve all future leave, for use when checking for leave conflicts
				const currentLeave = await leaveService.readByQuery({
					filter: {
						end_date: {
							_gt: new Date().toISOString().substring(0, 10),
							user: accountability.user,
						},
					},
				})

				let leaveCount = 0

				for (const leaveBeingUpdated of leavesBeingUpdated) {
					const startDate = payload?.start_date || leaveBeingUpdated.start_date // Use the payload date if it exists, otherwise use the existing date
					const endDate = payload?.end_date || leaveBeingUpdated.end_date

					if (new Date(startDate) > new Date(endDate)) {
						throw new InvalidLeaveDateError()
					}

					// Check the leave dates don't overlap with existing leave
					for (const leave of currentLeave) {
						if (
							leave.id !== leaveBeingUpdated.id &&
							((new Date(startDate) >= new Date(leave.start_date) &&
								new Date(startDate) <= new Date(leave.end_date)) ||
								(new Date(endDate) >= new Date(leave.start_date) &&
									new Date(endDate) <= new Date(leave.end_date)))
						) {
							throw new ConflictingLeaveDateError()
						}
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

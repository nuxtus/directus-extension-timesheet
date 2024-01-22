import { createError } from "@directus/errors"
import { defineHook } from "@directus/extensions-sdk"

const InvalidTimesheetDateError = createError(
	"INVALID_TIMESHEET_DATE_ERROR",
	"The start date must be less than the end date.",
	400
)
const StartDateRequiredTimesheetError = createError(
	"START_DATE_REQUIRED_TIMESHEET_ERROR",
	"The start date is required.",
	400
)
const PermissionDeniedError = createError(
	"PERMISSION_DENIED_ERROR",
	"You do not have permission to create timesheet entry.",
	403
)

const ConflictingTimesheetDateError = createError(
	"CONFLICT_TIMESHEET_DATE_ERROR",
	"The time provided conflicts with existing time entry.",
	400
)

const BulkEditTimesheetError = createError(
	"BULK_EDIT_TIMESHEET_ERROR",
	"You cannot bulk edit timesheet entries.",
	400
)

type Input = {
	id?: string
	start_time: string
	end_time: string
	user_created: string
}

const validateTimesheetEntry = async (
	input: Input,
	schema: any,
	services: any,
	accountability: any
) => {
	const { ItemsService } = services
	const timesheetService = new ItemsService("timesheets", {
		schema,
	})

	if (!("end_time" in input)) {
		return // we are adding new time from the timer so its okay to continue without any further checks
	}
	if (new Date(input.start_time) > new Date(input.end_time)) {
		throw new InvalidTimesheetDateError()
	}
	if (accountability === null || accountability.user === null) {
		throw new PermissionDeniedError()
	}

	const startTime = input.start_time
	const endTime = input.end_time

	// Use timesheetService to retrieve any possible conflicting timesheet entries
	const existingEntry = await timesheetService.readByQuery({
		filter: {
			_and: [
				{
					_or: [
						{
							_and: [
								{ start_time: { _lte: endTime } },
								{ end_time: { _nnull: true } },
								{ end_time: { _gte: startTime } },
							],
						},
						{
							_and: [
								{ start_time: { _gte: startTime } },
								{ end_time: { _nnull: true } },
								{ start_time: { _lte: endTime } },
							],
						},
						{
							_and: [
								{ end_time: { _gte: startTime } },
								{ end_time: { _nnull: true } },
								{ end_time: { _lte: endTime } },
							],
						},
					],
				},
				{
					user_created: accountability.user,
				},
				{
					id: { _neq: input.id },
				},
			],
		},
	})

	if (existingEntry.length > 0) {
		throw new ConflictingTimesheetDateError()
	}
}

export default defineHook(({ filter }, { services }) => {
	filter("items.create", async (input, meta, { schema, accountability }) => {
		if (meta.collection !== "timesheets") {
			return // Just move on
		}
		const typedInput: Input = input as Input
		if (!("start_time" in typedInput)) {
			throw new StartDateRequiredTimesheetError()
		}
		await validateTimesheetEntry(
			input as Input,
			schema,
			services,
			accountability
		)
	})

	filter("items.update", async (input, meta, { schema, accountability }) => {
		if (meta.collection !== "timesheets") {
			return // Just move on
		}
		const typedInput: Input = input as Input
		if (!("start_time" in typedInput)) {
			const { ItemsService } = services
			const timesheetService = new ItemsService("timesheets", {
				schema,
			})
			const currentEntry = await timesheetService.readOne(meta.keys[0])
			typedInput.start_time = currentEntry.start_time
			typedInput.id = meta.keys[0]
		}
		await validateTimesheetEntry(typedInput, schema, services, accountability)
	})
})

/** Calculate and insert 9 day fortnight leave in calendar automatically */
import { Settings } from "../process-leave-hook/ts-settings"

const NUM_FUTURE_9DFS = 4 // How many future 9 day fortnights to move ahead, suggest 4

export default ({ schedule }, { services, getSchema }) => {
	schedule("0 0 * * 0", async () => {
		const schema = await getSchema()
		const { ItemsService } = services
		const userService = new ItemsService("directus_users", {
			schema: await getSchema(),
		})
		const leaveService = new ItemsService("ts_leave", {
			schema,
		})

		const users = await userService.readByQuery({
			filter: {
				_and: [
					{
						status: {
							_eq: "active",
						},
					},
					{
						nineDayFortnightStart: {
							_nnull: true,
						},
					},
				],
			},
			limit: -1,
		})

		let existingLeave = []

		if (users.length === 0) {
			return
		}

		// Get some configuration settings
		const settings = await Settings.get(services, schema)

		// The point at which we start looking for 9DF entries
		const startDate = new Date()

		existingLeave = await leaveService.readByQuery({
			filter: {
				_and: [
					{
						leave_type: {
							_eq: settings.nine_day_fortnight_leave_type,
						},
					},
					{
						start_date: {
							_gte: new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000)
								.toISOString()
								.substring(0, 10), // update this to be 3 days before this date to cover moving from start of week to end of previous week
						},
					},
				],
			},
			limit: -1, // We need all the leave records
		})

		const next9DFLeaveDays = [] // Store all the 9DF leave days to be inserted

		for (const user of users) {
			// calculate the next 4 9 day fortnight leaves

			// get the start date of the next 9 day fortnight
			const next9DayFortnightStart = new Date(user.nineDayFortnightStart)

			// Check if the next 9 day fortnight has already started
			while (next9DayFortnightStart < startDate) {
				next9DayFortnightStart.setDate(next9DayFortnightStart.getDate() + 14)
			}

			// Get to the last 9DF leave day by going back from the week start, to the week finish
			const first9DFLeaveDay = new Date(next9DayFortnightStart)
			first9DFLeaveDay.setDate(first9DFLeaveDay.getDate() - 3)

			// calculate the dates of the next NUM_FUTURE_9DFS 9DF leave days based on the next9DayFortnightStart and save them in an array
			for (let i = 0; i < NUM_FUTURE_9DFS; i++) {
				const next9DFLeaveDay = new Date(first9DFLeaveDay)
				next9DFLeaveDay.setDate(next9DFLeaveDay.getDate() + i * 14)

				// Only push next9DFLeaveDay if it is not in existingLeave (check the start_date key for current user)
				const leaveExists = existingLeave.some(
					(leave: { start_date: string; user: { id: string } }) =>
						leave.start_date ===
							next9DFLeaveDay.toISOString().substring(0, 10) &&
						leave.user === user.id
				)

				if (!leaveExists) {
					next9DFLeaveDays.push({
						start_date: next9DFLeaveDay.toISOString().substring(0, 10),
						end_date: next9DFLeaveDay.toISOString().substring(0, 10),
						user: user.id,
						leave_type: settings.nine_day_fortnight_leave_type,
						total_hours: settings.leave_hours_per_day,
						approved: new Date().toISOString().substring(0, 10),
						approved_by: user.manager, // Manager may be null
					})
				}
			}
		}

		await leaveService.createMany(next9DFLeaveDays, {
			emitEvents: false, // Don't emit events to skip the checks done by the process-leave-hook, which fail as no accountability here
		})
	})
}

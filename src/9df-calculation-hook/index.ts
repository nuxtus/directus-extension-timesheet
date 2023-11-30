/** Calculate and insert 9 day fortnight leave in calendar automatically */
import { Settings } from "../process-leave-hook/ts-settings"

export default ({ schedule }, { services, getSchema }) => {
	// schedule("*/15 * * * *", async () => {
	schedule("* * * * *", async () => {
		const schema = await getSchema()
		const { ItemsService } = services
		const userService = new ItemsService("directus_users", {
			schema: await getSchema(),
		})
		const leaveService = new ItemsService("leave", {
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
		})

		let existingLeave = []

		if (users.length === 0) {
			return
		}

		// Get some configuration settings
		const settings = await Settings.get(services, schema)

		existingLeave = await leaveService.readByQuery({
			filter: {
				_and: [
					{
						leave_type: {
							_eq: 3, // TODO: Hard coded 9DF leave type, how to get around this?
						},
					},
					{
						start_date: {
							_gte: new Date().toISOString().substring(0, 10),
						},
					},
				],
			},
		})

		const next9DFLeaveDays = [] // Store all the 9DF leave days to be inserted

		for (const user of users) {
			// calculate the next 4 9 day fortnight leaves

			// // first get todays date and add 8 weeks to it
			const today = new Date()

			// get the start date of the next 9 day fortnight
			const next9DayFortnightStart = new Date(user.nineDayFortnightStart)

			// Check if the next 9 day fortnight has already started
			while (next9DayFortnightStart < today) {
				next9DayFortnightStart.setDate(next9DayFortnightStart.getDate() + 14)
			}

			// Get to the last 9DF leave day by going back from the week start, to the week finish
			const first9DFLeaveDay = new Date(next9DayFortnightStart)
			first9DFLeaveDay.setDate(first9DFLeaveDay.getDate() - 3)

			// calculate the dates of the next 4 9DF leave days based on the next9DayFortnightStart and save them in an array
			for (let i = 0; i < 4; i++) {
				const next9DFLeaveDay = new Date(first9DFLeaveDay)
				next9DFLeaveDay.setDate(next9DFLeaveDay.getDate() + i * 14)
				// Only push next9DFLeaveDay if it is not in existingLeave (check the start_date key)
				if (
					!existingLeave.find(
						(leave) =>
							leave.start_date ===
							next9DFLeaveDay.toISOString().substring(0, 10)
					)
				) {
					// next9DFLeaveDays.push(next9DFLeaveDay)
					next9DFLeaveDays.push({
						start_date: next9DFLeaveDay.toISOString().substring(0, 10),
						end_date: next9DFLeaveDay.toISOString().substring(0, 10),
						user: user.id,
						leave_type: settings.nine_date_fortnight_leave_type,
						total_hours: settings.leave_hours_per_day,
						approved: new Date().toISOString().substring(0, 10),
						approved_by: user.manager, // Manager may be null
					})
				}
			}
		}

		const results = await leaveService.createMany(next9DFLeaveDays, {
			emitEvents: false, // Don't emit events to skip the checks done by the process-leave-hook, which fail as no accountability here
		})
		console.log(results)
	})
}

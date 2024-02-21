import { createError } from "@directus/errors"
import { defineOperationApi } from "@directus/extensions-sdk"
import { ref } from "vue"
import { useItems } from "@directus/extensions-sdk"

type Options = {
	// 	text: string
}

type LeaveDataTrigger = {
	body: {
		keys: number[]
		collection: string
	}
}

const InvalidOperationUsageError = createError(
	"INVALID_OPERATION_USAGE_ERROR",
	"This operation must be used on a flow that is triggered by a leave update request.",
	400
)
const LeaveCollectionError = createError(
	"LEAVE_COLLECTION_ERROR",
	"This operation must be used on a flow that is triggered by a leave collection.",
	400
)
const PermissionDeniedError = createError(
	"LEAVE_PERMISSION_DENIED_ERROR",
	"You do not have permission to approve leave.",
	403
)

const UnknownError = createError(
	"UNKNOWN_ERROR",
	"Failed while attempting to approve leave, but unknown reason.",
	400
)

const EmailError = createError(
	"EMAIL_ERROR",
	"Failed to send email, check email settings.",
	400
)

export default defineOperationApi<Options>({
	id: "ts_approve_leave",
	handler: async ({}, { data, services, accountability, getSchema, env }) => {
		let leaveIds = []
		let collection = undefined

		if (
			accountability === null ||
			accountability.user === null ||
			accountability.user === undefined
		) {
			throw new PermissionDeniedError()
		}

		try {
			const trigger = data.$trigger as LeaveDataTrigger
			leaveIds = trigger.body.keys
			collection = trigger.body.collection
		} catch (err) {
			throw new InvalidOperationUsageError()
		}
		if (collection !== "ts_leave") {
			throw new LeaveCollectionError()
		}

		const schema = await getSchema()

		const leaveService = new services.ItemsService("ts_leave", {
			schema,
			accountability: accountability,
		})

		const now = new Date().toISOString()

		try {
			await leaveService.updateMany(leaveIds, {
				approved: now,
				approved_by: accountability.user,
			})
		} catch (err) {
			throw new UnknownError()
		}

		// If ts_settings.leave_notification is not null, then we need to email that address with all the approved leave
		const settingsService = new services.ItemsService("ts_settings", {
			schema: await getSchema(),
			accountability,
		})
		const settings = await settingsService.readSingleton({
			fields: ["leave_notification"],
		})

		if (settings.leave_notification !== null) {
			// Get all the approved leave
			const leaveService = new services.ItemsService("ts_leave", {
				schema: await getSchema(),
				accountability,
			})
			const approvedLeave = await leaveService.readMany(leaveIds, {
				fields: [
					"user.first_name",
					"user.last_name",
					"start_date",
					"end_date",
					"leave_type.name",
				],
				filter: {
					leave_type: {
						_in: [1, 2, 5], // TODO: Remove hard coded leave type IDs in favour of something configurable
					},
				},
			})

			// Send email
			const { MailService } = services
			const mailService = new MailService({ schema })

			mailService
				.send({
					to: [settings.leave_notification],
					from: env.EMAIL_FROM,
					subject: "Leave approved",
					template: {
						name: "leave-approved",
						data: {
							approvedLeave,
						},
					},
				})
				.catch((err: any) => {
					console.error(err)
					throw new EmailError()
				})
		}
	},
})

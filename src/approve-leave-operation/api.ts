import { createError } from "@directus/errors"
import { defineOperationApi } from "@directus/extensions-sdk"

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

export default defineOperationApi<Options>({
	id: "ts_approve_leave",
	handler: async ({}, { data, services, accountability, getSchema }) => {
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

		const leaveService = new services.ItemsService("ts_leave", {
			schema: await getSchema(),
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
	},
})

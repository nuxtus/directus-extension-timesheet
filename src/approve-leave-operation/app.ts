import { defineOperationApp } from "@directus/extensions-sdk"

export default defineOperationApp({
	id: "ts_approve_leave",
	name: "Approve leave",
	icon: "order_approve",
	description: "Approve leave requests.",
	overview: () => [],
	options: [],
})

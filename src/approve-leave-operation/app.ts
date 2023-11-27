import { defineOperationApp } from "@directus/extensions-sdk"

export default defineOperationApp({
	id: "ts_approve_leave",
	name: "Approve leave",
	icon: "order_approve",
	description: "Approve leave requests.",
	overview: ({ text }) => [
		{
			label: "Text",
			text: text,
		},
	],
	options: [
		{
			field: "text",
			name: "Text",
			type: "string",
			meta: {
				width: "full",
				interface: "input",
			},
		},
	],
})

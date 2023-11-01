import PanelComponent from "./panel.vue"
import { definePanel } from "@directus/extensions-sdk"

export default definePanel({
	id: "timesheet_9df_summary_panel",
	name: "Timesheet 9DF Summary",
	icon: "timer",
	description: "Staff timesheet entries per 9DF block selectable by user.",
	component: PanelComponent,
	options: [
		// {
		// 	field: "text",
		// 	name: "Text",
		// 	type: "string",
		// 	meta: {
		// 		interface: "input",
		// 		width: "full",
		// 	},
		// },
	],
	minWidth: 42,
	minHeight: 18,
})

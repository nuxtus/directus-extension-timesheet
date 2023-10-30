import PanelComponent from "./panel.vue"
import { definePanel } from "@directus/extensions-sdk"

export default definePanel({
	id: "timesheet_report_panel",
	name: "Timesheet Report",
	icon: "timer",
	description: "Summarise staff timesheet information.",
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

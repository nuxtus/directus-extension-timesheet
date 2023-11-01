import PanelComponent from "./panel.vue"
import { definePanel } from "@directus/extensions-sdk"

export default definePanel({
	id: "timesheet_user_hours_panel",
	name: "Timesheet User Hours",
	icon: "timer",
	description: "Staff timesheet totals dashboard panel.",
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

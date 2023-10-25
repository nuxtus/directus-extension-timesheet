import PanelComponent from "./panel.vue"
import { definePanel } from "@directus/extensions-sdk"

export default definePanel({
	id: "nuxtus-timesheet-report-panel",
	name: "Timesheet Report",
	icon: "timer",
	description: "Displays a table of timesheet entries.",
	component: PanelComponent,
	options: [
		{
			field: "text",
			name: "Text",
			type: "string",
			meta: {
				interface: "input",
				width: "full",
			},
		},
	],
	minWidth: 12,
	minHeight: 8,
})

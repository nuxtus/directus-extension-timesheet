import PanelComponent from "./panel.vue"
import { definePanel } from "@directus/extensions-sdk"

export default definePanel({
	id: "timesheet_entries_panel",
	name: "Timesheet Entries",
	icon: "timer",
	description: "Staff timesheet entries per user and from a specified date.",
	component: PanelComponent,
	options: [],
	minWidth: 42,
	minHeight: 18,
})

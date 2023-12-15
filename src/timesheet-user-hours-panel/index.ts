import PanelComponent from "./panel.vue"
import UserComponent from "./user-component.vue"
import { definePanel } from "@directus/extensions-sdk"

export default definePanel({
	id: "timesheet_user_hours_panel",
	name: "Timesheet User Hours",
	icon: "timer",
	description: "Staff timesheet totals dashboard panel.",
	component: PanelComponent,
	options: [
		{
			field: "user",
			name: "User",
			type: "string",
			meta: {
				width: "half",
				interface: "collection-item-dropdown",
				options: {
					selectedCollection: "directus_users",
				},
			},
		},
		{
			field: "timeframe",
			name: "Timeframe",
			type: "string",
			meta: {
				width: "half",
				interface: "select-dropdown",
				options: {
					choices: [
						{ text: "This week", value: "thisWeek" },
						{ text: "Last 9DF", value: "last9df" },
					],
				},
			},
		},
	],
	minWidth: 20,
	minHeight: 9,
})

import { ref, toRefs } from "vue"
import { useCollection, useItems } from "@directus/extensions-sdk"

import LayoutComponent from "./layout.vue"
import { defineLayout } from "@directus/extensions-sdk"

export default defineLayout({
	id: "nuxtus-timesheet-layout",
	name: "Timesheet",
	icon: "timer",
	component: LayoutComponent,
	slots: {
		options: () => null,
		sidebar: () => null,
		actions: () => null,
	},
	setup(props) {
		const name = ref("Timesheets")
		const { collection, filter, search } = toRefs(props)
		const {
			info,
			primaryKeyField,
			fields: fieldsInCollection,
		} = useCollection(collection)

		const limit = ref(20)

		// Added this to assist with users who have permission to see all timesheets to default to only their own, it gets clobbered if user then uses the filter
		filter.value = {
			user_created: {
				_eq: "$CURRENT_USER",
			},
		}

		// Get the timesheet settings from ts_settings
		const { items: settings } = useItems(ref("ts_settings"), {
			fields: ["task_collection", "task_collection_display_field"],
		})

		const { items, loading, error, totalPages, totalCount } = useItems(
			collection,
			{
				sort: ref(["-start_time"]),
				limit,
				fields: ref(["*"]),
				filter,
				search,
				page: ref(1),
			}
		)

		return {
			name,
			info,
			primaryKeyField,
			items,
			loading,
			filter,
			search,
			fieldsInCollection,
			error,
			totalPages,
			totalCount,
			limit,
			settings,
		}
	},
})

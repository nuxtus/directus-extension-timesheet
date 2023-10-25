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
		const name = ref("TD Timesheets")
		const { collection, filter, search } = toRefs(props)
		const {
			info,
			primaryKeyField,
			fields: fieldsInCollection,
		} = useCollection(collection)

		const limit = ref(20)

		const { items, loading, error, totalPages, totalCount } = useItems(
			collection,
			{
				sort: ref(["-date_created"]),
				limit,
				fields: ref([
					"*",
					"task.item:project.Name",
					"task.item:timesheet_options.Name",
				]),
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
		}
	},
})

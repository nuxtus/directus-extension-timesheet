<template>
	<div class="text" :class="{ 'has-header': showHeader }">
		<v-select id="userSelect" v-model="user" :items="users" placeholder="User" />
		<v-table v-if="timeEntries.length > 0" class="table" v-model:headers="tableHeaders" :items="timeEntries"
			fixed-header :allowHeaderReorder="true" noItemsText="You have not recorded any times yet" itemKey="id">
			<template #[`item.start_time`]="{ item }">
				{{ new Date(item.start_time).toLocaleString('en-GB', {
					year: 'numeric', month: '2-digit', day:
						'2-digit', hour: '2-digit', minute: '2-digit'
				}) }}
			</template>
			<template #[`item.end_time`]="{ item }">
				{{ item.end_time ? new Date(item.end_time).toLocaleString('en-GB', {
					year: 'numeric', month: '2-digit', day:
						'2-digit', hour: '2-digit', minute: '2-digit'
				}) : '--' }}
			</template>
			<template #[`item.total`]="{ item }">
				{{ item.end_time ?
					(() => {
						let diff = new Date(item.end_time) - new Date(item.start_time)
						let hours = Math.floor(diff / 1000 / 60 / 60)
						let minutes = Math.floor((diff / 1000 / 60) % 60)
						return ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2)
					})() : '--' }}
			</template>
		</v-table>
	</div>
</template>

<script setup lang="ts">
import { useApi, useItems, useStores } from '@directus/extensions-sdk'
import { ref, watch } from 'vue'

const api = useApi()
let users = ref([{ value: "all", text: "All" }])
let user = ref(null)

api.get('/users').then((response) => {
	response.data.data.forEach(user => {
		users.value.push({ value: user.id, text: `${user.first_name} ${user.last_name}` })
	})
})

let timeEntries = ref([])

watch(user, () => {
	if (user.value) {
		let filter = '?fields=*,task.name'
		if (user.value !== "all") {
			filter += `&filter[user_created][_eq]=${user.value}`
		}
		api.get(`/items/timesheets${filter}`).then((response) => {
			timeEntries.value = response.data.data
		})
	}
}, { immediate: true })

// Table layout
const tableHeaders = ref<Header[]>([
	{
		text: 'Start time',
		value: 'start_time',
		width: 200,
		sortable: true,
		align: 'left',
		description: null,
	},
	{
		text: 'End time',
		value: 'end_time',
		sortable: true,
		align: 'left',
		description: null,
	},
	{
		text: "Total",
		value: 'total',
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: "Task",
		value: 'task.name',
		sortable: true,
		align: 'left',
		description: null,
	}
])
</script>

<script lang="ts">

import { defineComponent } from 'vue'

export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},
		// text: {
		// 	type: String,
		// 	default: '',
		// },
	}
})
</script>

<style scoped>
.text {
	padding: 12px;
}

.text.has-header {
	padding: 0 12px;
}
</style>

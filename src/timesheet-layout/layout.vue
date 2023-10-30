<template>
	<div>
		<Timer @start="createTimeEntry" @stop="finishTimeEntry" :tasks="tasks" :timer="currentTimer"
			:totalTimeInSec="totalTime" :nineDFInSec="calculateTotal9DFTime" item-key="id"></Timer>
		<div>
			<v-table v-if="items != undefined && items.length > 0" class="table" v-model:headers="tableHeaders"
				:items="items" :show-resize="true" fixed-header @click:row="editTimesheetEntry" :allowHeaderReorder="true"
				noItemsText="You have not recorded any times yet" itemKey="id" @update:sort="resort" :sort="sort">
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
				<template #[`item.task_id`]="{ item }">
					{{ getTaskById(item.task_id).text }}
				</template>
			</v-table>
			<div class="paginationWrapper" v-if="items.length > 0">
				<v-pagination class="pagination" :v-model="items" :length="totalPages" :totalVisible="3" :modelValue="page"
					:showFirstLast="true" @update:modelValue="paginate" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import Timer from './timer.vue'
import { useApi } from '@directus/extensions-sdk'
const api = useApi()

const router = useRouter()
let totalTime = ref(0)
let currentTimer = ref(undefined)
let currentUser = null
let sort = ref({ by: "date_created", desc: true })
let page = ref(1)
let user9DFMonday = ref(undefined)

let props = defineProps({
	collection: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	items: Array,
	loading: Boolean,
	error: Array,
	search: {
		type: String,
		default: null,
	},
	filter: {
		default: {}
	},
	limit: {
		type: Number,
		required: true
	},
	totalPages: {
		type: Number,
		required: true
	},
	totalCount: {
		type: Number,
		required: true
	},
	settings: Array
})

function getTodaysTimers() {
	api.get('/users/me').then((response) => {
		currentUser = response.data.data

		if ('nineDayFortnightStart' in currentUser) {
			user9DFMonday.value = new Date(currentUser.nineDayFortnightStart)
		}

		const today = new Date()
		today.setUTCHours(0, 0, 0, 0)

		// Get all today's timers for total and any current
		api.get(`/items/${props.collection}?filter={"_and": [ {"start_time": { "_gte": "${today.toISOString().slice(0, 19).replace('T', ' ')}" } }, { "user_created": { "_eq": "${currentUser.id}"} }] }&sort=date_created`).then((response) => {
			totalTime.value = 0
			response.data.data.forEach(item => {
				let endTime
				if (item.end_time === null) {
					currentTimer.value = item
					endTime = new Date()
				} else {
					endTime = new Date(item.end_time)
				}
				let startTime = new Date(item.start_time)
				const diff = endTime - startTime
				totalTime.value += Math.abs(Math.floor(diff / 1000)) // Convert from milliseconds to seconds
			})
		})
	})
}

getTodaysTimers()

let tasks = ref([])

// Wait for settings to load and then fetch the tasks
watchEffect(async () => {
	if (Object.keys(props.settings).length === 0) { return }
	const response = await api.get(`/items/${props.settings.task_collection}?sort=${props.settings.task_collection_display_field}`)
	const result = response.data.data.map(task => ({
		value: task.id,
		text: task[props.settings.task_collection_display_field]
	}))
	tasks.value = result
})

function getTaskById(id): Task {
	let task: Task = tasks.value.find(task => task.value === id)
	if (task === undefined) {
		task = {
			text: 'unknown'
		}
	}
	return task
}

function updateItems() {
	const response = await api({
		method: 'search', url: `/items/${props.collection}`, data: {
			query: {
				filter: props.filter,
				search: props.search,
				page: page,
				sort: sort.value,
				limit: props.limit,
				fields: ["*", `${props.settings.task_collection}.${props.settings.task_collection_display_field}`]
			},
		}
	})

	props.items = response.data.data
}

// TODO: Combine these 2 functions
async function paginate(pageMove) {
	page.value = pageMove
	updateItems()
}

async function resort(sortedBy) {
	sort = ref(sortedBy)
	updateItems()
}

function createTimeEntry(details) {
	api.post(`/items/${props.collection}`, {
		start_time: new Date(),
		task_id: details.task
	}).then((response) => {
		currentTimer.value = response.data.data
		// Need to look up the task name
		let taskIndex = tasks.value.findIndex(task => task.value === currentTimer.value.task)
		if (taskIndex !== -1) {
			currentTimer.value.task = { name: tasks.value[taskIndex].text }
		}
		props.items.unshift(currentTimer.value)
	})
		.catch((error) => {
			// TODO: Timer will now be out of sync, fix this
			alert("Failed to save timesheet entry. " + error)
		})
}

function finishTimeEntry(details) {
	const endTime = new Date()
	api.patch(`/items/${props.collection}/${details.timer}`, {
		end_time: endTime,
		end_time_original: endTime
	}).then(() => {
		// Find the timer in items and update the end_time
		let index = props.items.findIndex(item => item.id === currentTimer.value.id)
		if (index !== -1) {
			props.items[index].end_time = endTime.toISOString() // Format endtime to MySQL DateTime format including full date, milliseconds and final Z
		}
		currentTimer.value = undefined
		getTodaysTimers() // Sync the totals with the server
	})
}

// At midnight, refetch the timers to set current back to 0
setInterval(() => {
	const now = new Date()
	if (now.getHours() === 0 && now.getMinutes() === 0) {
		getTodaysTimers()
	}
}, 60000) // Check every minute

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
		value: 'task_id',
		sortable: true,
		align: 'left',
		description: null,
	}
])

// Move to edit timesheet entry page
function editTimesheetEntry(item) {
	router.push(`/content/${props.collection}/${item.item.id}`)
}

// 9DF calculation
const calculateTotal9DFTime = computed(() => {
	if (user9DFMonday.value === undefined) { return undefined }
	let totalMilliseconds = 0
	let currentDate = new Date()
	currentDate.setHours(23, 59, 59, 999)
	let mostRecentMonday = new Date(user9DFMonday.value)
	mostRecentMonday.setHours(0, 0, 0, 0)

	// Adjust to the most recent Monday that is a 2 week increment of the parameter date
	while (mostRecentMonday < currentDate) {
		let nextMonday = new Date(mostRecentMonday.getTime())
		nextMonday.setDate(nextMonday.getDate() + 14)
		if (nextMonday > currentDate) {
			break
		}
		mostRecentMonday = nextMonday
	}

	props.items.forEach(item => {
		let endTime = new Date(item.end_time)
		let startTime = new Date(item.start_time)

		if (startTime >= mostRecentMonday && startTime <= currentDate) {
			totalMilliseconds += endTime - startTime
		}
	})

	return totalMilliseconds / 1000
});

</script>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	inheritAttrs: false,
})
</script>

<style scoped>
.table {
	/* min-width: calc(100% - var(--content-padding)) !important; */
	margin-right: var(--content-padding);
	margin-left: var(--content-padding);
}

.paginationWrapper {
	display: flex;
}

.pagination {
	margin-top: 10px;
	margin-left: auto;
	margin-right: 40px;
}
</style>

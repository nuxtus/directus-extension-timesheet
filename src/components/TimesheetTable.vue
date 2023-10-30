<template>
	<v-table v-if="items != undefined && items.length > 0" class="table" v-model:headers="tableHeaders" :items="items"
		:show-resize="true" fixed-header @click:row="handleRowClick" :allowHeaderReorder="true"
		noItemsText="You have not recorded any times yet" itemKey="id" @update:sort="handleSort" :sort="sort">
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
			:showFirstLast="true" @update:modelValue="handlePageUpdate" />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"
const emit = defineEmits(['row-click', 'update-sort', 'update-page'])

let props = defineProps({
	items: {
		type: Array,
		required: true
	},
	sort: {
		// type: Ref<SortBy>,
		default: ref({ sortBy: 'start_time', descending: false })
	},
	totalPages: {
		type: Number,
		required: true
	},
	tasks: {
		type: Array,
		required: true
	}
})

// Handle table events
const handleRowClick = function (timesheetItem) {
	emit('row-click', timesheetItem)
}

const handleSort = function (sortBy) {
	emit('update-sort', sortBy)
}

const handlePageUpdate = function (pageValue) {
	emit('update-page', pageValue)
}

// Match task_id to a task
function getTaskById(id): Task {
	let task: Task = props.tasks.find(task => task.value === id)
	if (task === undefined) {
		task = {
			text: 'unknown'
		}
	}
	return task
}

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
<template>
	<div class="text" :class="{ 'has-header': showHeader }">
		<div class="dropdownWrapper">
			<v-select id="userSelect" v-model="user" :items="usersSelect" placeholder="User" />
			<DateTime :value="startDate" type="date" @input="setDate"></DateTime>
			<button @click="downloadCSV" title="Download CSV" alt="Download CSV"><v-icon name="download"></v-icon></button>
		</div>
		<div class="scroll">
			<TimesheetTable :items="timeEntries" :sort="sort" @update-sort="resort"></TimesheetTable>
		</div>
	</div>
</template>

<script setup lang="ts">
import TimesheetTable from '../components/TimesheetTable.vue'
import DateTime from '../components/DateTime.vue'
import { useApi } from '@directus/extensions-sdk'
import { ref, watch } from 'vue'
import { isFuture } from 'date-fns'
import { saveAs } from 'file-saver'

const api = useApi()
let users = ref([{
	id: 'all',
	first_name: 'All',
	last_name: 'Users'
}])
let usersSelect = ref([])
let user = ref('all')
let startDate = ref(null)
let sort = ref({ by: 'start_time', desc: false })

api.get('/users').then((response) => {
	users.value = [
		...users.value,
		...response.data.data
	]
	users.value.forEach(user => {
		usersSelect.value.push({ value: user.id, text: `${user.first_name} ${user.last_name}` })
	})
})

let timeEntries = ref([])

function setDate(dateFromPicker) {
	startDate.value = dateFromPicker
}

function fetchTimesheets() {
	let query = '?fields=*'
	if (startDate.value) {
		query += `&filter[start_time][_gte]=${startDate.value}`
	}
	if (user.value !== "all") {
		query += `&filter[user_created][_eq]=${user.value}`
	}
	if (sort.value) {
		query += `&sort=${sort.value.desc ? '-' : ''}${sort.value.by}`
	}
	api.get(`/items/timesheets${query}`).then((response) => {
		timeEntries.value = response.data.data
	})
}

function resort(sortBy) {
	sort.value = sortBy
}

function downloadCSV() {
	const replacer = (key, value) => value === null ? '' : value
	const header = Object.keys(timeEntries.value[0])
	let csv = timeEntries.value.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
	csv.unshift(header.join(','))
	csv = csv.join('\r\n')

	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
	saveAs(blob, 'timeEntries.csv')
}

watch(startDate, (_newDate, oldDate) => {
	if (startDate.value) {
		if (isFuture(new Date(startDate.value))) {
			alert("Need to provide a date in the past")
			return
		}
		fetchTimesheets()
	}
})

watch(user, () => {
	if (user.value) {
		fetchTimesheets()
	}
}, { immediate: true })

watch(sort, () => {
	fetchTimesheets()
})
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
.dropdownWrapper {
	display: flex;
	gap: 20px;
}

.text {
	padding: 12px;
}

.text.has-header {
	padding: 0 12px;
}

.text {
	height: 100%;
}

.scroll {
	overflow: scroll;
	height: 100%;
	margin-top: var(--content-padding);
}

/* .panel-container {
	overflow: scroll;
} */
</style>

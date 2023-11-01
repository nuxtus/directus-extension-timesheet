<template>
	<div class="text" :class="{ 'has-header': showHeader }">
		<div></div>
	</div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk'
import { ref, watch } from 'vue'
import { isFuture, subDays } from 'date-fns'

const api = useApi()
let users = ref([{
	id: 'all',
	first_name: 'All',
	last_name: 'Users'
}])
let usersSelect = ref([])
let user = ref('all')
let startDate = ref(subDays(new Date().setHours(0, 0, 0, 0), 30).toISOString())
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

.text {
	height: 100%;
}
</style>

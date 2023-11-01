<template>
	<div class="text" :class="{ 'has-header': showHeader }">
		<div class="dropdownWrapper">
			<v-select id="userSelect" v-model="user" :items="usersSelect" placeholder="User" />
			<v-select id="rangeSelect" v-model="range" :items="ranges" placeholder="Time range" />
		</div>
		<div class="scroll">
			<TimesheetTable :items="timeEntries"></TimesheetTable>
		</div>
	</div>
</template>

<script setup lang="ts">
import TimesheetTable from '../components/TimesheetTable.vue'
import { useApi, useItems, useStores } from '@directus/extensions-sdk'
import { ref, watch } from 'vue'

const api = useApi()
let users = ref([])
let usersSelect = ref([])
let user = ref('')
let range = ref('currentFortnight')
let ranges = [{
	value: 'currentFortnight',
	text: 'Current fortnight'
},
{
	value: 'lastFortnight',
	text: 'Last fortnight'
},
{
	value: 'lastMonth',
	text: 'Last month'
},
]

api.get('/users').then((response) => {
	users.value = response.data.data
	users.value.forEach(user => {
		usersSelect.value.push({ value: user.id, text: `${user.first_name} ${user.last_name}` })
	})
})

let timeEntries = ref([])

watch(user, () => {
	if (user.value) {
		let userDetails = usersSelect.value.find(userFromList => userFromList.id === user.value)
		console.log(userDetails)

		let query = '?fields=*'
		switch (range.value) {
			case 'currentFortnight':
				let currentFortnightStart = new Date()
				currentFortnightStart.setDate(currentFortnightStart.getDate() - currentFortnightStart.getDay() + 1)
				query += `&filter[start_time][_gte]=${currentFortnightStart.toISOString()}`
				console.log(currentFortnightStart)
				break
			case 'lastFortnight':
				let lastFortnightStart = new Date()
				lastFortnightStart.setDate(lastFortnightStart.getDate() - lastFortnightStart.getDay() - 13)
				query += `&filter[start_time][_gte]=${lastFortnightStart.toISOString()}`
				let lastFortnightEnd = new Date(lastFortnightStart)
				lastFortnightEnd.setDate(lastFortnightEnd.getDate() + 14)
				query += `&filter[start_time][_lt]=${lastFortnightEnd.toISOString()}`
				console.log(lastFortnightStart, lastFortnightEnd)
				break
			case 'lastMonth':
				let lastMonthStart = new Date()
				lastMonthStart.setMonth(lastMonthStart.getMonth() - 1, 1)
				query += `&filter[start_time][_gte]=${lastMonthStart.toISOString()}`
				let lastMonthEnd = new Date(lastMonthStart)
				lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1, 0)
				query += `&filter[start_time][_lt]=${lastMonthEnd.toISOString()}`
				console.log(lastMonthStart, lastMonthEnd)
				break
		}
		if (user.value !== "all") {
			query += `&filter[user_created][_eq]=${user.value}`
		}
		api.get(`/items/timesheets${query}`).then((response) => {
			timeEntries.value = response.data.data
		})
	}
}, { immediate: true })
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

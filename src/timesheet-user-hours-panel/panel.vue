<template>
	<div class="text" :class="{ 'has-header': showHeader }">
		<div>
			<div>{{ userName }} ({{ timeframeHeader }})</div>
			<div class="group">
				<div class="block">
					<div class="header">Time</div>
					<div class="number" :class="{ 'text-under-warning': isUnderTime }">{{ totalTime }}</div>
				</div>
				<div class="block">
					<div class="header">Expected</div>
					<div class="number">{{ expectedTime }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps } from 'vue'
import { differenceInDays, addDays, startOfWeek } from 'date-fns'
import { useApi } from '@directus/extensions-sdk'

const props = defineProps({
	showHeader: {
		type: Boolean,
		default: false,
	},
	user: {
		type: String,
		required: true
	},
	timeframe: {
		type: String,
		default: 'thisWeek',
	},
})

const api = useApi()

let startDate = ref(null)
let userName = ref('-')
let totalTime = ref('-')
let expectedTime = ref(76)
let timeframeHeader = ref('Last 9DF')
let isUnderTime = ref(false)

switch (props.timeframe) {
	case 'last9df':
		let nineDayFortnight: String | null = null
		api.get(`/users?fields=nineDayFortnight,first_name,last_name&filter[id][_eq]=${props.user.key}&limit=1`).then((response) => {
			if (response.data.data.length === 0) {
				console.error("Invalid user provided")
				return
			}
			const user = response.data.data[0]
			userName.value = `${user.first_name} ${user.last_name}`
			nineDayFortnight = user.nineDayFortnight
			if (nineDayFortnight === null) {
				console.error("User does not have a nineDayFortnight set")
				return
			}
			let today = new Date()
			today.setHours(0, 0, 0, 0) // Set the time to midnight
			let [year, month, day] = nineDayFortnight.split('-').map(Number)
			let nineDayFortnightDate = new Date(year, month - 1, day)
			let daysSinceFortnight = differenceInDays(today, nineDayFortnightDate)
			let blocksSinceFortnight = Math.floor(daysSinceFortnight / 14)
			let startDateValue = addDays(nineDayFortnightDate, (blocksSinceFortnight * 14) + 1)
			startDateValue.setHours(0, 0, 0, 0) // Set the time to midnight
			startDate.value = startDateValue.toISOString()
		})
		break
	default:
		// thisWeek
		timeframeHeader.value = 'This Week'
		api.get(`/users?fields=first_name,last_name&filter[id][_eq]=${props.user.key}&limit=1`).then((response) => {
			if (response.data.data.length === 0) {
				console.error("Invalid user provided")
				return
			}
			const user = response.data.data[0]
			userName.value = `${user.first_name} ${user.last_name}`
			startDate.value = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
			let today = new Date()
			let daysSinceStart = Math.min(differenceInDays(today, startDate.value), 5)
			expectedTime.value = 7.6 * daysSinceStart
		})
		break
}

function updateTimes() {
	let query = `?fields=*&filter[user_created][_eq]=${props.user.key}&filter[start_time][_gte]=${startDate.value}`
	api.get(`/items/timesheets${query}`).then((response) => {
		const times = response.data.data
		let totalMinutes = times.reduce((total, time) => {
			let startTime = new Date(time.start_time)
			let endTime = new Date(time.end_time)
			let differenceInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
			return total + differenceInMinutes
		}, 0)

		let hours = Math.floor(totalMinutes / 60)
		let minutes = (totalMinutes % 60).toFixed(0).padStart(2, '0')

		isUnderTime.value = totalMinutes < (60 * expectedTime.value) ? true : false

		totalTime.value = `${hours}:${minutes}`
	})
}

watch(startDate, () => {
	updateTimes()
})

if (startDate.value !== null) {
	updateTimes()
}

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

.number {
	display: block;
	white-space: normal;
	font-weight: 800;
	text-align: center;
	font-size: 78.0031px;
	margin-top: 30px;
}

.group {
	display: flex;
	gap: 40px;
}

.header {
	font-weight: bolder;
}

.text-under-warning {
	color: red;
}
</style>

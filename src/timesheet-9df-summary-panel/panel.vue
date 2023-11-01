<template>
	<div class="text" :class="{ 'has-header': showHeader }">
		<div class="dropdownWrapper">
			<v-select id="userSelect" v-model="user" :items="usersSelect" placeholder="User" />
		</div>
		<div class="scroll">
			<v-table v-if="items != undefined && items.length > 0" class="table" v-model:headers="tableHeaders"
				:items="items" :show-resize="true" fixed-header :allowHeaderReorder="true" itemKey="startDate"
				@update:sort="handleSort" :sort="sort">
				<template #[`item.startDate`]="{ item }">
					{{ formatDate(item.startDate) }}
				</template>
				<template #[`item.totalTime`]="{ item }">
					<div :class="{ 'text-red': shouldHighlight(item) }">{{ item.totalTime }}</div>
				</template>
				<template #[`item.expected`]="{ item }">
					{{ calculateExpectedHours(item) }}
				</template>
			</v-table>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk'
import { ref, watch } from 'vue'
import { differenceInDays, isWithinInterval, addDays, format } from 'date-fns'

const api = useApi()
let users = ref([])
let usersSelect = ref([])
let user = ref('')
let items = ref([])

api.get('/users').then((response) => {
	users.value = response.data.data
	users.value.forEach(user => {
		usersSelect.value.push({ value: user.id, text: `${user.first_name} ${user.last_name}` })
	})
})

watch(user, () => {
	if (user.value) {
		let userDetails = users.value.find(userFromList => userFromList.id === user.value)
		if (userDetails.nineDayFortnight === null) {
			alert("User does not have a 9 day fortnight start date entered. Cannot continue.")
			return
		}

		let query = `?fields=*&filter[user_created][_eq]=${user.value}`

		api.get(`/items/timesheets${query}`).then((response) => {
			items.value = calculateTimeSpent(response.data.data, new Date(userDetails.nineDayFortnight))
		})
	}
}, { immediate: true })

const sort = ref({ sortBy: 'startDate', descending: false })

watch(sort, () => {
	items.value.sort((a, b) => {
		const dateA = new Date(a.startDate)
		const dateB = new Date(b.startDate)

		if (sort.value.descending) {
			return dateB.getTime() - dateA.getTime()
		} else {
			return dateA.getTime() - dateB.getTime()
		}
	})
}, { immediate: true })

const handleSort = function (sortBy) {
	sort.value = sortBy
}

let tableHeaders = ref<Header[]>([
	{
		text: 'Start date',
		value: 'startDate',
		width: 200,
		sortable: true,
		align: 'left',
		description: null,
	},
	{
		text: "Time recorded",
		value: 'totalTime',
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: "Expected",
		value: 'expected',
		sortable: false,
		align: 'left',
		description: null,
	}
])

function calculateExpectedHours(item: any) {
	const today = new Date()
	const startDate = new Date(item.startDate)
	const endDate = addDays(startDate, 13)

	if (isWithinInterval(today, { start: startDate, end: endDate })) {
		const daysFromStart = differenceInDays(today, startDate)
		return parseFloat((7.6 * daysFromStart).toFixed(2))
	} else {
		return 76
	}
}

function shouldHighlight(item) {
	const today = new Date()
	const startDate = new Date(item.startDate)
	const endDate = addDays(startDate, 13)
	const isCurrentBlock = isWithinInterval(today, { start: startDate, end: endDate })

	return item.totalTime < calculateExpectedHours(item) && !isCurrentBlock
}

function formatDate(date) {
	return format(new Date(date), 'EEE dd MMM yyyy')
}

</script>

<script lang="ts">

import { defineComponent } from 'vue'
import { calculateTimeSpent } from './calculations'

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

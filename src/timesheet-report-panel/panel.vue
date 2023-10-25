<template>
	<div class="text" :class="{ 'has-header': showHeader }">
		{{ text }}
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useItems } from '@directus/extensions-sdk'

const { items } = useItems('timesheet', {
	fields: '*'
})

console.log("HELLO", items)


export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},
		text: {
			type: String,
			default: '',
		},
	},
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

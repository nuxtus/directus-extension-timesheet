<template>
	<div id="clock">
		<v-button @click="toggle" :rounded="true" :icon="true" class="mr"><v-icon :name="running ? 'stop' : 'play_arrow'"
				:filled="true" :disabled="task === null ? true : false" /></v-button>

		<div id="taskSelectWrapper">
			<v-select v-if="tasks" id="taskSelect" v-model="task" :items="tasks" :disabled="running" placeholder="Task" />
		</div>
		<div class="spacer"></div>
		<div class="mr" v-if="nineDFInSec">
			<div class="time">9DF hours</div>
			<div class="time type-title">{{ nineDF }}</div>
		</div>
		<div class="mr">
			<div class="time">Today</div>
			<div class="time type-title">{{ totalTime }}</div>
		</div>
		<div class="timeSize">
			<div class="time">Current</div>
			<div class="time type-title">{{ time }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const emit = defineEmits(['start', 'stop', 'reset'])
let props = defineProps({ tasks: Array, timer: { required: true }, totalTimeInSec: Number, nineDFInSec: Number })

let time = ref("00:00:00")
let totalTime = ref("00:00")
let task = ref(null)
let nineDF = ref("00:00")
let totalTimeInSecCalc = ref(props.totalTimeInSec || 0)
let nineDFInSecCalc = ref(props.nineDFInSec || 0)

let timeBegan: Date | null = null,
	timeStopped: Date | null = null,
	stoppedDuration = 0,
	started: ReturnType<typeof setInterval>,
	running = ref(false)

function toggle() {
	if (running.value) {
		stop()
	} else {
		start()
	}
}

// Starts a brand new work timer
function start() {
	if (running.value) return
	if (task.value === null) {
		alert('Must select a task')
		return
	}

	if (timeBegan === null) {
		timeBegan = new Date()
	}

	if (timeStopped !== null) {
		stoppedDuration += (new Date() - timeStopped)
	}

	started = setInterval(clockRunning, 1000)
	running.value = true
	emit('start', { task: task.value })
}

function stop() {
	running.value = false
	clearInterval(started)
	stoppedDuration = 0
	timeBegan = null
	timeStopped = null
	time.value = "00:00:00"
	emit('stop', { timer: props.timer.id })
}

function clockRunning() {
	if (timeBegan === null) {
		console.error("Clock running called but timeBegan is null")
	}

	var currentTime = new Date(),
		timeElapsed = new Date(currentTime - timeBegan! + stoppedDuration),
		hour = timeElapsed.getUTCHours(),
		min = timeElapsed.getUTCMinutes(),
		sec = timeElapsed.getUTCSeconds()

	time.value =
		zeroPrefix(hour, 2) + ":" +
		zeroPrefix(min, 2) + ":" +
		zeroPrefix(sec, 2)

	// Clock is running every second
	totalTimeInSecCalc.value += 1 // Keep the total time adding up live
	totalTime.value = formatTime(totalTimeInSecCalc.value)
	if (props.nineDFInSec) {
		nineDFInSecCalc.value += 1 // Keep the nineDF adding up live
		nineDF.value = formatTime(nineDFInSecCalc.value)
	}
};

function formatTime(seconds) {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	return `${zeroPrefix(hours, 2)}:${zeroPrefix(minutes, 2)}`
}


function zeroPrefix(num, digit) {
	var zero = ''
	for (var i = 0; i < digit; i++) {
		zero += '0'
	}
	return (zero + num).slice(-digit)
}

// Watch for property changes once 9DF is calculated in the layout
watch(() => props.nineDFInSec, (new9DFTime) => {
	nineDFInSecCalc.value = new9DFTime || 0
	nineDF.value = formatTime(nineDFInSecCalc.value)
})
watch(() => props.totalTimeInSec, (newTotalTime) => {
	totalTimeInSecCalc.value = newTotalTime || 0
	totalTime.value = formatTime(totalTimeInSecCalc.value)
})
watch(() => props.timer, (timer) => {
	if (timer !== undefined) {
		// If the timer is already running (from a previous start), start the clock
		if (timer.end_time === null) {
			running.value = true
			timeBegan = new Date(timer.start_time)
			clearInterval(started)
			stoppedDuration = 0
			timeStopped = null
			started = setInterval(clockRunning, 1000)
		}
	}
})
</script>

<style scoped>
#clock {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	background-color: var(--primary);
	border-radius: 25px;
	margin: 20px;
	padding: 20px;
}

#taskSelectWrapper {
	min-width: 150px;
	max-width: 500px;
}

.spacer {
	flex-grow: 1;
}

.mr {
	margin-right: 20px;
}

.v-button {
	--v-button-color: var(--primary);
	--v-button-background-color: var(--primary-50);
	--v-button-color-hover: var(--white);
	--v-button-background-color-hover: var(--primary-75);
}

.time {
	color: var(--white);
}

.timeSize {
	width: 115px;
}
</style>
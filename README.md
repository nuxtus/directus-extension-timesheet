# Timesheets

A project timer layout for timesheet collections in Directus.
Allows users to start/stop a timer and record the times in a timesheet.

## Set up

You will need to create some collections manually:

1. timesheets: This should have user/date created and user/date updated fields as well as custom fields start_time, end_time, end_time_original (timestampz, seconds enabled) and task (M2A relationship, link to projects and timesheet_tasks). Hide the end_time_original from users so they can't change.
2. timesheet_tasks: Should have a "name" field which will show in the "task" drop down selector of the timer, to record times against
3. (optional) Add a nineDayFortnightStart field to users to calculate 9DF - it should be set to the LAST start of the 9DF for this staff member. Type Date.

## Installation

1. Git clone this project
2. `npm i`
3. `npm run build`
4. Copy the entire folder into your Directus extensions folder `/extensions/bundles/timesheets`
5. Restart directus

Note: If using Docker you may want to add the extension to the volumes via directus -> volumes, add: `- ./extensions/layouts/td_timesheet/dist:/directus/extensions/layouts/td_timesheet`

## Validation

Timesheet entry validation is left to you. I suggest adding a flow and creating a script to validate. Here is a starting point:

```ts
module.exports = async function(data) {
	let new_start_time = data.$last.start_time;
    let new_end_time = data.$last.end_time;
    
    if ('start_time' in data.$trigger.payload) {
     	new_start_time = data.$trigger.payload.end_time
    }
    if ('end_time' in data.$trigger.payload) {
     	new_end_time = data.$trigger.payload.end_time
    }
    if (new_end_time === null) {
     	return; // Nothing to validate   
    }
    new_end_time = new Date(new_end_time)
    if (new_end_time > new Date()) {
     	throw Error("End time must be in the past.")   
    }
    new_start_time = new Date(new_start_time)
    if (new_start_time > new_end_time) {
        throw Error("Start time must be before end time.")
    }
    
	return data.$trigger.payload;
}
```

## Permissions

It's up to you to manually define the permissions for CRUD operations within Directus. I usually lock users to only being able to CRU the start_time, end_time and project fields.
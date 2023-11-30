# Timesheets

A project timer layout for timesheet collections in Directus.
Allows users to start/stop a timer and record the times in a timesheet.

## Installation

1. Git clone this project
2. `npm i`
3. `npm run build`
4. Copy the entire folder into your Directus extensions folder `/extensions/directus-extension-timesheet`
5. Run the supplied schema to update your database: `npx directus schema apply ./schema/schema.json`
6. Restart directus
7. (optional) You can change the collection that the timesheets record time against by visiting the Timesheets > Settings and manualling changing the settings
8. (optional) If you wish to calculate 9 day fortnights, set each users nineDayFortnightStart field. It should be set to the LAST start of the 9DF for this staff member.
9. (optional) Create a "manual trigger" flow on the leave collection. Add the "Approve Leave" operation to the flow. This will allow users to approve leave.

Note: If using Docker you may want to add the extension to the volumes via directus -> volumes, add: `- ./node_-_modules/directus-extension-timesheet/dist:/directus/extensions/directus-extension-timesheet`

## Using your own task collection

The collection that that timers are run against is configurable in the Timesheet > Settings area. You can change this to any collection you like, but it must have the following fields:

1. id (integer)
2. name\description (string) - This can be called anything you want but must be a string
3. status - A standard Directus status field, only the "active" status is displayed in the timer dropdown

## Permissions

It's up to you to manually define the permissions for CRUD operations within Directus. I usually: 

1. Lock users to only being able to CRU the start_time, end_time and project fields.
2. Add permission to only allow users to view their own timesheets
3. Give users permission to view everyone's leave, but not edit/delete it.
4. Do not allow add/edit of the leave approval fields.

Some example roles with these permissions are provided in the schema folder.
export const Settings = {
	async get(services, schema) {
		const { ItemsService } = services
		const settingsService = new ItemsService("ts_settings", { schema: schema })
		return settingsService.readSingleton({})
	},
}

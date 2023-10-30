declare module "*.vue" {
	import { DefineComponent } from "vue"
	const component: DefineComponent<{}, {}, any>
	export default component
}

declare type Task = {
	value: number
	text: string
}

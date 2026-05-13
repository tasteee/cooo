import type { ComponentType } from "react"

declare const __CLO_REMOTE_URLS__: Record<string, string>
declare function __webpack_init_sharing__(scope: string): Promise<void>
declare const __webpack_share_scopes__: Record<string, unknown>

export type ProductConfigT = {
	name: string
	isEnabled: boolean
	framework: string
	label: string
	basePath: string
	entry: string
}

type RemoteContainerT = {
	init: (sharedScope: unknown) => Promise<void>
	get: (module: string) => Promise<() => { default?: ComponentType; Main?: ComponentType }>
}

const loadedRemotes = new Set<string>()

const loadRemoteEntry = async (remoteUrl: string): Promise<void> => {
	const isAlreadyLoaded = loadedRemotes.has(remoteUrl)
	if (isAlreadyLoaded) return

	await new Promise<void>((resolve, reject) => {
		const script = document.createElement("script")
		script.src = remoteUrl

		script.onload = () => {
			loadedRemotes.add(remoteUrl)
			resolve()
		}

		script.onerror = () => {
			reject(new Error(`CLO could not load remote entry: ${remoteUrl}`))
		}

		document.head.appendChild(script)
	})
}

const EXPOSED_MODULE = "./main"

export const loadFederatedComponent = async (config: ProductConfigT): Promise<ComponentType> => {
	const remoteUrl = __CLO_REMOTE_URLS__[config.name]
	await loadRemoteEntry(remoteUrl)
	await __webpack_init_sharing__("default")
	const windowRecord = window as unknown as Record<string, RemoteContainerT>
	const container = windowRecord[config.name]
	await container.init(__webpack_share_scopes__["default"])
	const factory = await container.get(EXPOSED_MODULE)
	const productModule = factory()
	const Component = productModule.default ?? productModule.Main
	const isComponentMissing = Component === undefined
	if (isComponentMissing) throw new Error(`CLO MFE "${config.name}" must export a default or Main component.`)
	return Component
}

import { useEffect, useState } from "react"
import type { ComponentType } from "react"
import { createRoot } from "react-dom/client"
import { Router, Route, Link, useLocation } from "wouter"
import configs from "./dev.configs"

declare const __CLO_REMOTE_URLS__: Record<string, string>
declare function __webpack_init_sharing__(scope: string): Promise<void>
declare const __webpack_share_scopes__: Record<string, unknown>

type ProductConfigT = {
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

type ProductLoaderPropsT = {
	config: ProductConfigT
}

type NavigationPropsT = {
	configs: ProductConfigT[]
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

const loadFederatedComponent = async (config: ProductConfigT): Promise<ComponentType> => {
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

const ProductLoader = (props: ProductLoaderPropsT) => {
	const componentState = useState<ComponentType | null>(null)
	const Component = componentState[0]
	const setComponent = componentState[1]

	const load = async () => {
		const LoadedComponent = await loadFederatedComponent(props.config)
		setComponent(() => {
			return LoadedComponent
		})
	}

	useEffect(() => void load(), [props.config])
	const isComponentMissing = Component === null
	if (isComponentMissing) return null
	return <Component />
}

const Navigation = (props: NavigationPropsT) => {
	const [currentPath, navigate] = useLocation()

	return (
		<nav>
			{props.configs.map((config) => {
				const isCurrentPath = currentPath.startsWith(config.basePath)
				const ariaCurrent = isCurrentPath ? ("page" as const) : undefined

				return (
					<Link key={config.name} href={config.basePath} aria-current={ariaCurrent}>
						{config.label}
					</Link>
				)
			})}
		</nav>
	)
}

const enabledConfigs = configs.filter((config) => {
	return config.isEnabled
})

const Dev = () => {
	return (
		<Router>
			<header>
				<strong>US BANK</strong>
				<input aria-label="Search" placeholder="Search" />
			</header>
			<Navigation configs={enabledConfigs} />
			{enabledConfigs.map((config) => {
				return <Route key={config.name} path={`${config.basePath}*`} component={() => <ProductLoader config={config} />} />
			})}
		</Router>
	)
}

const rootElement = document.getElementById("root")
const isRootMissing = rootElement === null

if (isRootMissing) {
	throw new Error("CLO could not find #root.")
}

createRoot(rootElement).render(<Dev />)

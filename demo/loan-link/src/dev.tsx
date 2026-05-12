import { useEffect, useState } from "react"
import type { ComponentType, MouseEvent } from "react"
import { createRoot } from "react-dom/client"
import developmentConfigurations from "./dev.configs"

type DevelopmentConfigurationT = {
	name: string
	isEnabled: boolean
	framework: "react"
	label: string
	basePath: string
	entry: string
}

type ProductModuleT = {
	default?: ComponentType
	Main?: ComponentType
}

type NavigationPropsT = {
	configurations: DevelopmentConfigurationT[]
	currentPath: string
	onNavigate: (basePath: string) => void
}

type ProductRouterPropsT = {
	configuration: DevelopmentConfigurationT
}

const TopBar = () => {
	return (
		<header>
			<strong>US BANK</strong>
			<input aria-label="Search" placeholder="Search" />
		</header>
	)
}

const Navigation = (props: NavigationPropsT) => {
	return (
		<nav>
			{props.configurations.map((configuration) => {
				const isCurrentConfiguration = props.currentPath.startsWith(configuration.basePath)
				const ariaCurrent = isCurrentConfiguration ? "page" : undefined
				const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
					event.preventDefault()
					props.onNavigate(configuration.basePath)
				}

				return (
					<a key={configuration.name} href={configuration.basePath} aria-current={ariaCurrent} onClick={handleClick}>
						{configuration.label}
					</a>
				)
			})}
		</nav>
	)
}

const getComponentFromModule = (productModule: ProductModuleT): ComponentType => {
	const Component = productModule.default ?? productModule.Main
	const isComponentMissing = Component === undefined

	if (isComponentMissing) {
		throw new Error("CLO product modules must export a default component or Main component.")
	}

	return Component
}

const ProductRouter = (props: ProductRouterPropsT) => {
	const componentState = useState<ComponentType | null>(null)
	const Component = componentState[0]
	const setComponent = componentState[1]

	useEffect(() => {
		const loadProduct = async () => {
			const productModule = (await import(props.configuration.entry)) as ProductModuleT
			const LoadedComponent = getComponentFromModule(productModule)
			setComponent(() => {
				return LoadedComponent
			})
		}

		void loadProduct()
	}, [props.configuration])

	const isComponentMissing = Component === null

	if (isComponentMissing) return null

	return <Component />
}

const Dev = () => {
	const currentPathState = useState(window.location.pathname)
	const currentPath = currentPathState[0]
	const setCurrentPath = currentPathState[1]
	const enabledConfigurations = developmentConfigurations.filter((configuration) => {
		return configuration.isEnabled
	})
	const matchingConfiguration = enabledConfigurations.find((configuration) => {
		return currentPath.startsWith(configuration.basePath)
	})
	const activeConfiguration = matchingConfiguration ?? enabledConfigurations[0]
	const isActiveConfigurationMissing = activeConfiguration === undefined

	useEffect(() => {
		const handlePopState = () => {
			setCurrentPath(window.location.pathname)
		}

		window.addEventListener("popstate", handlePopState)

		return () => {
			window.removeEventListener("popstate", handlePopState)
		}
	}, [setCurrentPath])

	const handleNavigate = (basePath: string) => {
		window.history.pushState(null, "", basePath)
		setCurrentPath(basePath)
	}

	if (isActiveConfigurationMissing) return <main>No enabled products</main>

	return (
		<>
			<TopBar />
			<Navigation configurations={enabledConfigurations} currentPath={currentPath} onNavigate={handleNavigate} />
			<ProductRouter configuration={activeConfiguration} />
		</>
	)
}

const element = document.getElementById("root")
const isElementMissing = element === null

if (isElementMissing) {
	throw new Error("CLO could not find #root.")
}

const rootElement = element
createRoot(rootElement).render(<Dev />)

import { useEffect, useState } from "react"
import type { ComponentType } from "react"
import { createRoot } from "react-dom/client"
import { Router, Route, Link, useLocation } from "wouter"
import configs from "__clo_dev_configs__"
import { type ProductConfigT, loadFederatedComponent } from "./federation"

type ProductLoaderPropsT = {
	config: ProductConfigT
}

type NavBarPropsT = {
	configs: ProductConfigT[]
}

const ProductLoader = (props: ProductLoaderPropsT) => {
	const componentState = useState<ComponentType | null>(null)
	const Component = componentState[0]
	const setComponent = componentState[1]

	const load = async () => {
		const LoadedComponent = await loadFederatedComponent(props.config)
		setComponent(() => LoadedComponent)
	}

	useEffect(() => void load(), [props.config])
	const isComponentMissing = Component === null
	if (isComponentMissing) return null
	return <Component />
}

const NavBar = (props: NavBarPropsT) => {
	const [currentPath] = useLocation()

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

const enabledConfigs = configs.filter((config: ProductConfigT) => {
	return config.isEnabled
})

const TopBar = () => {
	return (
		<header
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				height: "64px",
				padding: "0px 36px"
			}}
		>
			<h1>US BANK</h1>
			<input aria-label="Search" placeholder="Search" />
		</header>
	)
}

const Dev = () => {
	return (
		<Router>
			<TopBar />
			<NavBar configs={enabledConfigs} />
			{enabledConfigs.map((config: ProductConfigT) => {
				const path = `${config.basePath}*`
				const component = () => <ProductLoader config={config} />
				return <Route key={config.name} path={path} component={component} />
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

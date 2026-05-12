import webpack from "webpack"
import type { WebpackPluginInstance } from "webpack"
import { fetchSharedDependencies } from "../helpers/fetch-shared-dependencies"

const ModuleFederationPlugin = webpack.container.ModuleFederationPlugin

export const REMOTE_ENTRY_FILENAME = "remoteEntry.js"
export const REMOTE_GLOBAL_TYPE = "window"
const DEFAULT_EXPOSURE = "./main"
const DEFAULT_EXPOSED_MODULE = "./src/main.tsx"
const DEFAULT_EXPOSES = { [DEFAULT_EXPOSURE]: DEFAULT_EXPOSED_MODULE }

export const createModuleFederationPlugin = async (context: ScriptingContextT): Promise<WebpackPluginInstance> => {
	const sharedDependencies = await fetchSharedDependencies()
	const exposes = context.exposes ?? DEFAULT_EXPOSES
	const sharedDependenciesWithExternals = { ...sharedDependencies, ...context.externals }

	return new ModuleFederationPlugin({
		name: context.name,
		remotes: {},
		exposes,
		shared: sharedDependenciesWithExternals,
		filename: REMOTE_ENTRY_FILENAME,
		library: { type: REMOTE_GLOBAL_TYPE, name: context.name }
	})
}

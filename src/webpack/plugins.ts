import webpack from "webpack"
import type { WebpackPluginInstance } from "webpack"
import { createHtmlPlugin } from "./plugins/create-html-plugin"
import { createDefinePlugin } from "./plugins/create-define-plugin"
import { createModuleFederationPlugin, REMOTE_ENTRY_FILENAME } from "./plugins/create-module-federation-plugin"
import { fetchSharedDependencies } from "./helpers/fetch-shared-dependencies"

const ModuleFederationPlugin = webpack.container.ModuleFederationPlugin

export const createPlugins = (context: ScriptingContextT) => {
	const pluginPromises: Promise<WebpackPluginInstance>[] = [
		Promise.resolve(createHtmlPlugin(context)),
		Promise.resolve(createDefinePlugin(context))
	]
	const shouldCreateModuleFederationPlugin = context.command === "build"

	if (shouldCreateModuleFederationPlugin) {
		pluginPromises.push(createModuleFederationPlugin(context))
	}

	return Promise.all(pluginPromises)
}

export const createShellPlugins = async (
	context: ScriptingContextT,
	mfeConfigs: MfeDevConfigT[]
): Promise<WebpackPluginInstance[]> => {
	const sharedDependencies = await fetchSharedDependencies()
	const sharedDependenciesWithExternals = { ...sharedDependencies, ...context.externals }

	const remoteUrls = Object.fromEntries(
		mfeConfigs.map((mfeConfig) => {
			return [mfeConfig.name, mfeConfig.remoteUrl]
		})
	)

	const htmlPlugin = createHtmlPlugin(context)
	const definePlugin = new webpack.DefinePlugin({
		...Object.fromEntries(
			Object.entries(context.textReplacements).map((entry) => {
				return [entry[0], JSON.stringify(entry[1])]
			})
		),
		__CLO_REMOTE_URLS__: JSON.stringify(remoteUrls)
	})
	const mfPlugin = new ModuleFederationPlugin({
		name: "shell",
		remotes: {},
		shared: sharedDependenciesWithExternals
	})

	return [htmlPlugin, definePlugin, mfPlugin]
}

export const createMfePlugins = async (
	context: ScriptingContextT,
	mfeConfig: MfeDevConfigT
): Promise<WebpackPluginInstance[]> => {
	const sharedDependencies = await fetchSharedDependencies()
	const sharedDependenciesWithExternals = { ...sharedDependencies, ...context.externals }

	const entryFileName = mfeConfig.entry.replace(/^\.\//, "")
	const mfeEntryRelativePath = `./src/${entryFileName}`

	const mfPlugin = new ModuleFederationPlugin({
		name: mfeConfig.name,
		filename: REMOTE_ENTRY_FILENAME,
		exposes: { "./main": mfeEntryRelativePath },
		shared: sharedDependenciesWithExternals,
		library: { type: "window", name: mfeConfig.name }
	})

	return [mfPlugin]
}

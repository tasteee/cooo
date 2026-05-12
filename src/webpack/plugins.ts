import type { WebpackPluginInstance } from "webpack"
import { createHtmlPlugin } from "./plugins/create-html-plugin"
import { createDefinePlugin } from "./plugins/create-define-plugin"
import { createModuleFederationPlugin } from "./plugins/create-module-federation-plugin"

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

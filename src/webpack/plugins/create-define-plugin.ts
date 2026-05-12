import webpack from "webpack"

const DefinePlugin = webpack.DefinePlugin

export const createDefinePlugin = (context: ScriptingContextT) => {
	const replacementsEntries = Object.entries(context.textReplacements)
	const replacements = replacementsEntries.map((replacementEntry) => {
		const replacementKey = replacementEntry[0]
		const replacementValue = replacementEntry[1]
		return [replacementKey, JSON.stringify(replacementValue)]
	})
	const definitions = Object.fromEntries(replacements)

	return new DefinePlugin(definitions)
}

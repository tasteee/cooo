type ScriptingContextT = {
	projectRootPath: string
	packageJsonPath: string
	name: string
	command: "start" | "build" | "create"
	entry: string
	developmentEntry?: string
	textReplacements: Record<string, string>
	externals: Record<string, unknown>
	developmentConfigurationsPath?: string
	exposes?: Record<string, string>
	port?: number
}

type CloConfigurationT = Partial<
	Pick<
		ScriptingContextT,
		| "name"
		| "entry"
		| "developmentEntry"
		| "textReplacements"
		| "externals"
		| "developmentConfigurationsPath"
		| "exposes"
		| "port"
	>
>

type CloDevelopmentConfigurationT = {
	name: string
	isEnabled: boolean
	framework: "react"
	label: string
	basePath: string
	entry: string
}

import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { createJiti } from "jiti"
import { pkgUp } from "pkg-up"
import { logger } from "./logger"

type PackageJsonT = {
	name?: string
	clo?: CloConfigurationT
}

const CONFIGURATION_FILE_NAMES = ["clo.config.ts", "clo.config.mts", "clo.config.js", "clo.config.mjs", "clo.config.cjs"]
const DEFAULT_DEVELOPMENT_CONFIGURATIONS_PATH = "src/dev.configs.ts"
const DEFAULT_DEVELOPMENT_ENTRY_PATH = "src/dev.tsx"
const DEFAULT_PRODUCT_ENTRY_PATH = "src/main.tsx"

const configurationImporter = createJiti(import.meta.url)

const isRecord = (value: unknown): value is Record<string, unknown> => {
	const isTruthy = Boolean(value)
	const isObject = typeof value === "object"
	const isArray = Array.isArray(value)
	return isTruthy && isObject && !isArray
}

const readPackageJson = async (packageJsonPath: string): Promise<PackageJsonT> => {
	const contents = await readFile(packageJsonPath, "utf8")
	return JSON.parse(contents) as PackageJsonT
}

const findConfigurationPath = (projectRootPath: string): string | undefined => {
	const configurationPaths = CONFIGURATION_FILE_NAMES.map((fileName) => {
		return path.join(projectRootPath, fileName)
	})
	const configurationPath = configurationPaths.find(existsSync)
	return configurationPath
}

const importConfigurationFile = async (configurationPath: string): Promise<CloConfigurationT> => {
	const configuration = await configurationImporter.import(configurationPath, { default: true })
	const isConfigurationObject = isRecord(configuration)

	if (!isConfigurationObject) {
		throw new Error(`${path.basename(configurationPath)} must export a configuration object.`)
	}

	return configuration as CloConfigurationT
}

const getPackageJsonConfiguration = (packageJson: PackageJsonT): CloConfigurationT => {
	const hasPackageJsonConfiguration = isRecord(packageJson.clo)

	if (!hasPackageJsonConfiguration) return {}

	return packageJson.clo as CloConfigurationT
}

const loadProductConfiguration = async (projectRootPath: string, packageJson: PackageJsonT): Promise<CloConfigurationT> => {
	const hasPackageJsonConfiguration = isRecord(packageJson.clo)
	const packageJsonConfiguration = getPackageJsonConfiguration(packageJson)
	const configurationPath = findConfigurationPath(projectRootPath)
	const hasConfigurationFile = Boolean(configurationPath)
	const isConfigurationMissing = !hasPackageJsonConfiguration && !hasConfigurationFile

	if (isConfigurationMissing) {
		logger.warn("No CLO configuration found. Using defaults and package.json name.")
		return packageJsonConfiguration
	}

	if (!configurationPath) return packageJsonConfiguration

	const fileConfiguration = await importConfigurationFile(configurationPath)
	return { ...packageJsonConfiguration, ...fileConfiguration }
}

const resolveOptionalPath = (
	projectRootPath: string,
	configuredPath: string | undefined,
	fallbackPath: string
): string | undefined => {
	const requestedPath = configuredPath ?? fallbackPath
	const candidatePath = path.resolve(projectRootPath, requestedPath)
	const pathExists = existsSync(candidatePath)

	if (!pathExists) return undefined

	return candidatePath
}

const getMissingEntryErrorMessage = (
	command: ScriptingContextT["command"],
	entryPath: string,
	entryConfigurationKey: "entry" | "developmentEntry"
): string => {
	const commandLabel = command === "start" ? "start" : "build"
	return `Could not find ${commandLabel} entry at ${entryPath}. Run \"clo ${commandLabel}\" from a CLO product directory, or set clo.${entryConfigurationKey} in package.json or clo.config.ts.`
}

export const loadScriptingContext = async (command: ScriptingContextT["command"]): Promise<ScriptingContextT> => {
	const packageJsonPath = await pkgUp({ cwd: process.cwd() })

	if (!packageJsonPath) throw new Error("Could not find a package.json for this project.")

	const projectRootPath = path.dirname(packageJsonPath)
	const packageJson = await readPackageJson(packageJsonPath)
	const productConfiguration = await loadProductConfiguration(projectRootPath, packageJson)
	const name = productConfiguration.name ?? packageJson.name

	if (!name) {
		throw new Error("CLO could not determine a product name. Set package.json name or clo.name.")
	}

	const developmentConfigurationsPath = resolveOptionalPath(
		projectRootPath,
		productConfiguration.developmentConfigurationsPath,
		DEFAULT_DEVELOPMENT_CONFIGURATIONS_PATH
	)

	const isStartCommand = command === "start"
	const defaultEntryPath = isStartCommand ? DEFAULT_DEVELOPMENT_ENTRY_PATH : DEFAULT_PRODUCT_ENTRY_PATH
	const configuredDevelopmentEntryPath = productConfiguration.developmentEntry ?? defaultEntryPath
	const configuredProductEntryPath = productConfiguration.entry ?? defaultEntryPath
	const configuredEntryPath = isStartCommand ? configuredDevelopmentEntryPath : configuredProductEntryPath
	const entry = path.resolve(projectRootPath, configuredEntryPath)
	const doesEntryExist = existsSync(entry)
	const isEntryMissing = !doesEntryExist
	const entryConfigurationKey = isStartCommand ? "developmentEntry" : "entry"

	if (isEntryMissing && !isStartCommand) {
		const errorMessage = getMissingEntryErrorMessage(command, entry, entryConfigurationKey)
		throw new Error(errorMessage)
	}

	return {
		projectRootPath,
		packageJsonPath,
		name,
		command,
		entry,
		developmentEntry: productConfiguration.developmentEntry,
		textReplacements: productConfiguration.textReplacements ?? {},
		externals: productConfiguration.externals ?? {},
		developmentConfigurationsPath,
		exposes: productConfiguration.exposes,
		port: productConfiguration.port
	}
}

export const loadDevelopmentConfigurations = async (
	context: ScriptingContextT,
	shellPort: number
): Promise<MfeDevConfigT[]> => {
	const devConfigsPath = context.developmentConfigurationsPath

	if (!devConfigsPath) return []

	const rawConfigs = await configurationImporter.import(devConfigsPath, { default: true })
	const configs = rawConfigs as CloProductConfigT[]
	const enabledConfigs = configs.filter((config) => {
		return config.isEnabled
	})

	return enabledConfigs.map((config, index) => {
		const port = shellPort + 1 + index
		const remoteUrl = `http://localhost:${port}/remoteEntry.js`
		return { ...config, port, remoteUrl }
	})
}

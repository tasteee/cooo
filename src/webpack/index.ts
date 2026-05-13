import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import webpack from "webpack"
import WebpackDevServer from "webpack-dev-server"
import { createLoaders } from "./loaders"
import { createShellPlugins, createMfePlugins } from "./plugins"

const createShellBootstrapEntry = (actualEntryPath: string): string => {
	const bootstrapDirectory = path.join(os.tmpdir(), "clo-shell")
	mkdirSync(bootstrapDirectory, { recursive: true })
	const bootstrapPath = path.join(bootstrapDirectory, "bootstrap.js")
	const importPath = actualEntryPath.replace(/\\/g, "/")
	writeFileSync(bootstrapPath, `import(${JSON.stringify(importPath)})\n`)
	return bootstrapPath
}

const getCliNodeModulesPaths = (): string[] => {
	const currentFilePath = fileURLToPath(import.meta.url)
	const currentDirectoryPath = path.dirname(currentFilePath)
	const nodeModulesCandidates = [
		path.resolve(currentDirectoryPath, "..", "node_modules"),
		path.resolve(currentDirectoryPath, "..", "..", "node_modules")
	]

	return nodeModulesCandidates.filter((nodeModulesPath) => {
		return existsSync(nodeModulesPath)
	})
}

const getShellDevEntryPath = (): string => {
	const currentFilePath = fileURLToPath(import.meta.url)
	const currentDirectoryPath = path.dirname(currentFilePath)
	const candidates = [
		path.resolve(currentDirectoryPath, "..", "shell", "dev.tsx"),
		path.resolve(currentDirectoryPath, "..", "..", "shell", "dev.tsx")
	]
	const shellEntry = candidates.find(existsSync)

	if (!shellEntry) {
		throw new Error("CLO could not find the shell dev entry. Reinstall the CLI.")
	}

	return shellEntry
}

const createLoaderModulePaths = (context: ScriptingContextT): string[] => {
	const productNodeModulesPath = path.resolve(context.projectRootPath, "node_modules")
	const cliNodeModulesPaths = getCliNodeModulesPaths()

	return [productNodeModulesPath, ...cliNodeModulesPaths, "node_modules"]
}

const createResolveExtensions = (): string[] => {
	return [
		".tsx",
		".ts",
		".jsx",
		".js",
		".mjs",
		".json",
		".css",
		".scss",
		".sass",
		".less",
		".svg",
		".png",
		".jpg",
		".jpeg",
		".gif",
		".webp",
		".ico",
		".bmp",
		".tiff",
		".woff",
		".woff2",
		".eot",
		".ttf",
		".otf",
		".mp4",
		".webm",
		".ogg",
		".mp3",
		".wav",
		".flac",
		".aac"
	]
}

export const run = async (context: ScriptingContextT) => {
	const shouldBuild = context.command === "build"

	if (shouldBuild) return build(context)

	return undefined
}

export const startShell = async (context: ScriptingContextT, mfeConfigs: MfeDevConfigT[], port: number) => {
	const shellDevEntryPath = getShellDevEntryPath()
	const bootstrapEntry = createShellBootstrapEntry(shellDevEntryPath)
	const plugins = await createShellPlugins(context, mfeConfigs)
	const buildPath = path.join(context.projectRootPath, "build", "shell")
	const loaders = createLoaders()
	const resolveExtensions = createResolveExtensions()
	const loaderModulePaths = createLoaderModulePaths(context)
	const devConfigsAlias = context.developmentConfigurationsPath ?? ""

	const compiler = webpack({
		mode: "development",
		entry: bootstrapEntry,
		context: context.projectRootPath,
		devtool: "eval-cheap-module-source-map",
		stats: "errors-only",
		infrastructureLogging: { level: "error" },
		plugins,

		output: {
			path: buildPath,
			publicPath: "/",
			uniqueName: "shell"
		},

		module: {
			rules: loaders
		},

		resolve: {
			extensions: resolveExtensions,
			modules: ["node_modules", ...loaderModulePaths],
			alias: {
				__clo_dev_configs__: devConfigsAlias
			}
		},

		resolveLoader: {
			modules: loaderModulePaths
		}
	})

	if (!compiler) throw new Error("Webpack could not create a shell compiler.")

	const server = new WebpackDevServer(
		{
			host: "localhost",
			port,
			historyApiFallback: true,
			client: { overlay: true, logging: "error" },
			static: false,
			devMiddleware: { stats: "errors-only" }
		},
		compiler
	)

	await server.start()
}

export const startMfe = async (context: ScriptingContextT, mfeConfig: MfeDevConfigT) => {
	const mfeEntryPath = path.resolve(context.projectRootPath, "src", mfeConfig.entry)
	const plugins = await createMfePlugins(context, mfeConfig)
	const buildPath = path.join(context.projectRootPath, "build", mfeConfig.name)
	const loaders = createLoaders()
	const resolveExtensions = createResolveExtensions()
	const loaderModulePaths = createLoaderModulePaths(context)
	const publicPath = `http://localhost:${mfeConfig.port}/`

	const compiler = webpack({
		mode: "development",
		entry: mfeEntryPath,
		context: context.projectRootPath,
		devtool: "eval-cheap-module-source-map",
		stats: "errors-only",
		infrastructureLogging: { level: "error" },
		plugins,

		output: {
			path: buildPath,
			publicPath,
			uniqueName: mfeConfig.name
		},

		module: {
			rules: loaders
		},

		resolve: {
			extensions: resolveExtensions
		},

		resolveLoader: {
			modules: loaderModulePaths
		}
	})

	if (!compiler) throw new Error(`Webpack could not create a compiler for MFE "${mfeConfig.name}".`)

	const server = new WebpackDevServer(
		{
			host: "localhost",
			port: mfeConfig.port,
			headers: { "Access-Control-Allow-Origin": "*" },
			client: { overlay: true, logging: "error" },
			static: false,
			devMiddleware: { stats: "errors-only" }
		},
		compiler
	)

	await server.start()
}

const build = async (_context: ScriptingContextT) => {
	return undefined
}

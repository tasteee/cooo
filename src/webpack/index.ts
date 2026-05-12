import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import webpack from "webpack"
import WebpackDevServer from "webpack-dev-server"
import { createLoaders } from "./loaders"
import { createPlugins } from "./plugins"

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
	const shouldStart = context.command === "start"
	const shouldBuild = context.command === "build"

	if (shouldStart) return start(context)
	if (shouldBuild) return build(context)

	return undefined
}

const start = async (context: ScriptingContextT) => {
	const entry = context.entry
	const plugins = await createPlugins(context)
	const buildPath = path.join(context.projectRootPath, "build")
	const loaders = createLoaders()
	const port = context.port ?? 3000
	const resolveExtensions = createResolveExtensions()
	const loaderModulePaths = createLoaderModulePaths(context)

	const compiler = webpack({
		mode: "development",
		entry,
		context: context.projectRootPath,
		devtool: "eval-cheap-module-source-map",
		plugins,

		output: {
			path: buildPath,
			publicPath: "auto"
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
	const hasCompiler = Boolean(compiler)
	const isCompilerMissing = !hasCompiler

	if (isCompilerMissing) throw new Error("Webpack could not create a compiler.")

	const server = new WebpackDevServer(
		{
			host: "localhost",
			port,
			historyApiFallback: true,
			client: { overlay: true },
			static: false
		},
		compiler
	)

	await server.start()
}

const build = async (_context: ScriptingContextT) => {
	return undefined
}

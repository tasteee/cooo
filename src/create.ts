import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { logger } from "./logger"

const TEXT_FILE_EXTENSIONS = new Set([
	".css",
	".html",
	".js",
	".json",
	".jsx",
	".md",
	".mjs",
	".mts",
	".ts",
	".tsx",
	".txt",
	".yml",
	".yaml"
])

const runPnpmInstall = (currentWorkingDirectory: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const isWindows = process.platform === "win32"
		const packageManagerCommand = isWindows ? (process.env.ComSpec ?? "cmd.exe") : "pnpm"
		const packageManagerArguments = isWindows ? ["/d", "/s", "/c", "pnpm", "i"] : ["i"]
		const child = spawn(packageManagerCommand, packageManagerArguments, {
			cwd: currentWorkingDirectory,
			stdio: "inherit"
		})

		child.once("error", reject)
		child.once("exit", (exitCode) => {
			const didInstallSucceed = exitCode === 0

			if (didInstallSucceed) {
				resolve()
				return
			}

			reject(new Error(`pnpm i exited with code ${exitCode ?? "unknown"}.`))
		})
	})
}

const getBoilerplatePath = (): string => {
	const currentFilePath = fileURLToPath(import.meta.url)
	const currentDirectoryPath = path.dirname(currentFilePath)
	const candidates = [
		path.resolve(currentDirectoryPath, "..", "boilerplate"),
		path.resolve(currentDirectoryPath, "boilerplate")
	]
	const boilerplatePath = candidates.find(existsSync)
	const isBoilerplatePathMissing = boilerplatePath === undefined

	if (isBoilerplatePathMissing) {
		const searchedPaths = candidates.join(", ")
		throw new Error(`Could not find the CLO boilerplate files. Searched: ${searchedPaths}`)
	}

	return boilerplatePath
}

const replaceNamePlaceholders = async (directoryPath: string, name: string): Promise<void> => {
	const entries = await readdir(directoryPath)

	await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directoryPath, entry)
			const entryStat = await stat(entryPath)

			if (entryStat.isDirectory()) {
				await replaceNamePlaceholders(entryPath, name)
				return
			}

			const extension = path.extname(entryPath)
			const isTextFile = TEXT_FILE_EXTENSIONS.has(extension)

			if (!isTextFile) return

			const contents = await readFile(entryPath, "utf8")
			const replacedContents = contents.replaceAll("__NAME__", name)

			if (replacedContents === contents) return

			await writeFile(entryPath, replacedContents, "utf8")
		})
	)
}

export const create = async (name: string) => {
	const targetPath = path.resolve(process.cwd(), name)
	const targetExists = existsSync(targetPath)

	if (targetExists) {
		throw new Error(`Cannot create ${name}; ${targetPath} already exists.`)
	}

	const boilerplatePath = getBoilerplatePath()

	logger.info(`Creating ${name}`)
	await mkdir(targetPath, { recursive: true })
	await cp(boilerplatePath, targetPath, { recursive: true })
	await replaceNamePlaceholders(targetPath, name)

	logger.info("Installing dependencies")
	await runPnpmInstall(targetPath)

	process.chdir(targetPath)

	logger.success(`Created ${name}`)
	logger.info("Next steps:")
	logger.info(`  cd ${name}`)
	logger.info("  clo start")
}

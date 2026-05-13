import dotenv from "dotenv"
import { loadScriptingContext, loadDevelopmentConfigurations } from "./config"
import { logger } from "./logger"
import { startShell, startMfe } from "./webpack/index"

export const start = async () => {
	dotenv.config()

	const context = await loadScriptingContext("start")
	const shellPort = context.port ?? 3000
	const mfeConfigs = await loadDevelopmentConfigurations(context, shellPort)

	logger.info(`Starting ${context.name} shell on port ${shellPort}`)

	const mfeStartPromises = mfeConfigs.map((mfeConfig) => {
		logger.info(`Starting MFE "${mfeConfig.name}" on port ${mfeConfig.port}`)
		return startMfe(context, mfeConfig)
	})

	await Promise.all([startShell(context, mfeConfigs, shellPort), ...mfeStartPromises])
}

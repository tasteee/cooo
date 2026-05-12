import dotenv from "dotenv"
import { loadScriptingContext } from "./config"
import { logger } from "./logger"
import { run } from "./webpack/index"

export const start = async () => {
	dotenv.config()

	const context = await loadScriptingContext("start")

	logger.info(`Starting ${context.name}`)
	await run(context)
}

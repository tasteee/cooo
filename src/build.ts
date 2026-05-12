import dotenv from "dotenv"
import { loadScriptingContext } from "./config"
import { logger } from "./logger"
import { run } from "./webpack"

export const build = async () => {
	dotenv.config()

	const context = await loadScriptingContext("build")

	logger.info(`Building ${context.name}`)
	await run(context)
}

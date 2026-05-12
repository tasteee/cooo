import { cac } from "cac"
import { build } from "./build"
import { create } from "./create"
import { start } from "./start"
import dotenv from "dotenv"

dotenv.config()

const commandLineInterface = cac("clo")

commandLineInterface.command("start", "Start a CLO product locally.").action(start)
commandLineInterface.command("build", "Build a CLO product for production.").action(build)
commandLineInterface.command("create <name>", "Scaffold a new CLO product.").action(create)

commandLineInterface.help()
commandLineInterface.parse()

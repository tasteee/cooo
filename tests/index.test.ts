import { expect, test } from "vitest"
import packageJson from "../package.json"

test("package exposes the CLI build output", () => {
	expect(packageJson.bin.clo).toBe("bin/clo.js")
	expect(packageJson.exports["."]).toBe("./dist/index.mjs")
	expect(packageJson.files).toContain("bin")
	expect(packageJson.files).toContain("dist")
	return undefined
})

import HtmlWebpackPlugin from "html-webpack-plugin"

const createTemplate = () => {
	const isProduction = process.env.NODE_ENV === "production"
	const titleSuffix = isProduction ? "" : "[DEV]"
	return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>CLO ${titleSuffix}</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `
}

export const createHtmlPlugin = (_context: ScriptingContextT) => {
	return new HtmlWebpackPlugin({
		templateContent: createTemplate()
	})
}

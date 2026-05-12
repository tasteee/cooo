import type { LoaderUseT, WebpackLoaderRuleT } from "./types"

const babelPresets = [
	["@babel/preset-env", { bugfixes: true, modules: false }],
	["@babel/preset-react", { runtime: "automatic" }],
	["@babel/preset-typescript", { allowDeclareFields: true }]
]

const babelLoader: LoaderUseT = {
	loader: "babel-loader",
	options: {
		cacheDirectory: true,
		cacheCompression: false,
		presets: babelPresets
	}
}

const cssModulesOptions = {
	auto: true,
	exportLocalsConvention: "camelCaseOnly",
	localIdentName: "[name]__[local]__[contenthash:base64:5]"
}

const makeStyleLoaders = (preProcessors: LoaderUseT[] = []): LoaderUseT[] => {
	return [
		"style-loader",
		{
			loader: "css-loader",
			options: {
				importLoaders: preProcessors.length + 1,
				modules: cssModulesOptions,
				sourceMap: true
			}
		},
		{
			loader: "postcss-loader",
			options: {
				postcssOptions: {
					plugins: ["postcss-preset-env"]
				},
				sourceMap: true
			}
		},
		...preProcessors
	]
}

export const sourceMapLoader: WebpackLoaderRuleT = {
	test: /\.(?:js|mjs|cjs)$/,
	enforce: "pre",
	use: "source-map-loader"
}

export const jsLoader: WebpackLoaderRuleT = {
	test: /\.[cm]?js$/,
	exclude: /node_modules/,
	use: babelLoader
}

export const jsxLoader: WebpackLoaderRuleT = {
	test: /\.jsx$/,
	exclude: /node_modules/,
	use: babelLoader
}

export const tsLoader: WebpackLoaderRuleT = {
	test: /\.ts$/,
	exclude: /node_modules/,
	use: babelLoader
}

export const tsxLoader: WebpackLoaderRuleT = {
	test: /\.tsx$/,
	exclude: /node_modules/,
	use: babelLoader
}

export const cssLoader: WebpackLoaderRuleT = {
	test: /\.css$/,
	use: makeStyleLoaders()
}

export const scssLoader: WebpackLoaderRuleT = {
	test: /\.(?:scss|sass)$/,
	use: makeStyleLoaders([
		{
			loader: "sass-loader",
			options: { sourceMap: true }
		}
	])
}

export const lessLoader: WebpackLoaderRuleT = {
	test: /\.less$/,
	use: makeStyleLoaders([
		{
			loader: "less-loader",
			options: { sourceMap: true }
		}
	])
}

export const stylusLoader: WebpackLoaderRuleT = {
	test: /\.styl$/,
	use: makeStyleLoaders([
		{
			loader: "stylus-loader",
			options: { sourceMap: true }
		}
	])
}

export const htmlLoader: WebpackLoaderRuleT = {
	test: /\.html$/,
	loader: "html-loader",
	options: {
		sources: {
			list: ["..."]
		}
	}
}

export const svgLoader: WebpackLoaderRuleT = {
	test: /\.svg$/,
	oneOf: [
		{
			issuer: /\.[jt]sx$/,
			resourceQuery: /react/,
			use: [
				{
					loader: "@svgr/webpack",
					options: {
						exportType: "named",
						icon: true,
						memo: true,
						ref: true,
						svgo: true,
						titleProp: true
					}
				}
			]
		},
		{
			type: "asset/resource",
			generator: {
				filename: "assets/images/[name].[contenthash:8][ext]"
			}
		}
	]
}

export const imageLoader: WebpackLoaderRuleT = {
	test: /\.(?:avif|bmp|gif|ico|jpe?g|png|webp)$/,
	type: "asset",
	parser: {
		dataUrlCondition: {
			maxSize: 8 * 1024
		}
	},
	generator: {
		filename: "assets/images/[name].[contenthash:8][ext]"
	}
}

export const fontLoader: WebpackLoaderRuleT = {
	test: /\.(?:eot|otf|ttf|woff2?)$/,
	type: "asset/resource",
	generator: {
		filename: "assets/fonts/[name].[contenthash:8][ext]"
	}
}

export const mediaLoader: WebpackLoaderRuleT = {
	test: /\.(?:mp3|mp4|ogg|wav|webm)$/,
	type: "asset/resource",
	generator: {
		filename: "assets/media/[name].[contenthash:8][ext]"
	}
}

export const fileLoader: WebpackLoaderRuleT = {
	test: /\.(?:pdf|txt|zip)$/,
	type: "asset/resource",
	generator: {
		filename: "assets/files/[name].[contenthash:8][ext]"
	}
}

export const rawLoader: WebpackLoaderRuleT = {
	test: /\.raw\.(?:css|html|js|svg|txt)$/,
	type: "asset/source"
}

export const yamlLoader: WebpackLoaderRuleT = {
	test: /\.ya?ml$/,
	use: "yaml-loader"
}

export const tomlLoader: WebpackLoaderRuleT = {
	test: /\.toml$/,
	use: "toml-loader"
}

export const csvLoader: WebpackLoaderRuleT = {
	test: /\.csv$/,
	use: ["csv-loader"]
}

export const xmlLoader: WebpackLoaderRuleT = {
	test: /\.xml$/,
	use: ["xml-loader"]
}

export const graphqlLoader: WebpackLoaderRuleT = {
	test: /\.(?:graphql|gql)$/,
	exclude: /node_modules/,
	use: "graphql-tag/loader"
}

export const mdxLoader: WebpackLoaderRuleT = {
	test: /\.mdx?$/,
	use: [babelLoader, "@mdx-js/loader"]
}

export const wasmLoader: WebpackLoaderRuleT = {
	test: /\.wasm$/,
	type: "webassembly/async"
}

export const workerLoader: WebpackLoaderRuleT = {
	test: /\.worker\.[cm]?[jt]s$/,
	use: [
		{
			loader: "worker-loader",
			options: {
				filename: "assets/workers/[name].[contenthash:8].worker.js"
			}
		},
		babelLoader
	]
}

export const createLoaders = (): WebpackLoaderRuleT[] => {
	return [
		sourceMapLoader,
		jsLoader,
		jsxLoader,
		tsLoader,
		tsxLoader,
		cssLoader,
		scssLoader,
		lessLoader,
		stylusLoader,
		htmlLoader,
		svgLoader,
		imageLoader,
		fontLoader,
		mediaLoader,
		fileLoader,
		rawLoader,
		yamlLoader,
		tomlLoader,
		csvLoader,
		xmlLoader,
		graphqlLoader,
		mdxLoader,
		wasmLoader,
		workerLoader
	]
}

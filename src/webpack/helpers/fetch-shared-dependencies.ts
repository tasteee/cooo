const wait = async (milliseconds: number): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds)
	})
}

// # fetch externals from gitlab (mock for now)
export const fetchSharedDependencies = async () => {
	await wait(1250)

	return {
		react: {
			singleton: true,
			requiredVersion: "^18.0.0"
		},
		"react-dom": {
			singleton: true,
			requiredVersion: "^18.0.0"
		},
		xoid: {
			singleton: true,
			requiredVersion: "^1.0.1"
		},
		"@xoid/react": {
			singleton: true,
			requiredVersion: "^1.0.1"
		}
	}
}

export class UsageError extends Error {}

/** Runs a command and reports a refusal as one plain line, without a stack trace. */
export async function runCommand(command: () => Promise<void>): Promise<void> {
	try {
		await command();
	} catch (cause) {
		if (!(cause instanceof UsageError)) throw cause;
		console.error(cause.message);
		process.exitCode = 1;
	}
}

export const alreadyExists = (cause: unknown): boolean =>
	cause instanceof Error && "code" in cause && cause.code === "EEXIST";

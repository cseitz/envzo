
export type EnvzoValidatorError =
    | InvalidEnvironmentError
    | MissingEnvironmentError

export class InvalidEnvironmentError extends TypeError {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidEnvironmentError.prototype);
    }
}


export class MissingEnvironmentError extends ReferenceError {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, MissingEnvironmentError.prototype);
    }
}


export const errors = {
    /** Environment variable does not match the validator
     * @param type  The name of this validator
     * @param input The value given at runtime
     */
    invalid: (type: string, input: unknown) => {
        return new InvalidEnvironmentError(`Invalid ${type} input: "${input}"`)
    },
    /** Environment variable does not exist */
    missing: (message?: string) => (
        new MissingEnvironmentError(message)
    )
}
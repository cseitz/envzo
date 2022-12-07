import { errors } from './errors';


type EmptyObject = {}

type EnvzoValidatorOptions<T> = {
    /** Default value*/
    default?: T;
    /** If false *(default)*, the process will exit if this value is missing */
    optional?: boolean;
} & ({
    /** The key within the `env` dictionary to use as a value */
    key: string;
} | {
    /** A getter to retrieve the value from the `env` dictionary */
    get: (env: any) => any | null;
})

export type EnvzoParser<T, O extends object = EmptyObject> = (props: {
    /** The value given */
    input: string | T,
    /** Configuration passed in `envzo.parse` */
    options: O & EnvzoValidatorOptions<T>,
    /** Envzo errors such as `invalid` to indicate the validator failing */
    errors: typeof errors
}) => T;

export type EnvzoValidator<T, O extends object = EmptyObject> = (options: O & EnvzoValidatorOptions<T>) => T;


export function makeValidator<T, O extends object = EmptyObject>(
    parser: EnvzoParser<T, O>,
    defaultOptions?: O
): EnvzoValidator<T, O> {
    return function(this: any, options) {
        let input;
        if ('key' in options) {
            input = this[options.key];
        } else if ('get' in options) {
            input = options.get(this);
        }
        return parser({
            input: input as any,
            errors,
            options: {
                ...(defaultOptions || {}),
                ...(options || {})
            }
        })
        // return (input) => {
        //     return parser({
        //         input: input as any,
        //         errors,
        //         options: {
        //             ...(defaultOptions || {}),
        //             ...(options || {})
        //         }
        //     })
        // }
    }
}


export namespace validators {

    export const boolean = makeValidator<boolean>(({ input }) => {
        switch (input) {
            case true:
            case 'true':
            case 't':
            case '1':
                return true;
            case false:
            case 'false':
            case 'f':
            case '0':
                return false;
            default:
                throw errors.invalid('boolean', input);
        }
    });

    export const string = makeValidator<string>(({ input }) => {
        if (typeof input !== 'string') {
            throw errors.invalid('string', input);
        }
        return input;
    });

    const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/; // intentionally non-exhaustive
    export const email = makeValidator<string>(({ input }) => {
        if (!EMAIL_REGEX.test(input)) {
            throw errors.invalid('email', input);
        }
        return input;
    });

    export const number = makeValidator<number>(({ input }) => {
        const coerced = +input;
        if (Number.isNaN(coerced)) {
            throw errors.invalid('number', input);
        }
        return coerced;
    });

    export const port = makeValidator<number>(({ input }) => {
        const coerced = +input;
        if (
            Number.isNaN(coerced) ||
            `${coerced}` !== `${input}` ||
            coerced % 1 !== 0 ||
            coerced < 1 ||
            coerced > 65535
        ) {
            throw errors.invalid('port', input);
        }
        return coerced;
    });

    export const url = makeValidator<string>(({ input }) => {
        try {
            new URL(input); // validate url
            return input;
        } catch (_) {
            throw errors.invalid('url', input);
        }
    });

    export const json = makeValidator<unknown>(({ input }) => {
        try {
            if (typeof input !== 'string') {
                return input;
            }

            return JSON.parse(input) as unknown;
        } catch (e) {
            throw errors.invalid('json', input);
        }
    });

    boolean({ key: 'omg' })

}
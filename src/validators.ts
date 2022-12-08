import { errors } from './errors';
import { Counter } from './utils';


type EmptyObject = {}

export type EnvzoValidatorOptions<T, E = any> = {
    /** Default value*/
    default?: T;
    /** If false *(default)*, the process will exit if this value is missing */
    optional?: boolean;
} & ({
    /** The key within the `env` dictionary to use as a value */
    key: string;
} | {
    /** A getter to retrieve the value from the `env` dictionary */
    get: (env: E) => any | null;
})

export type EnvzoParser<T, O extends object = EmptyObject> = (props: {
    /** The value given */
    input: string | T,
    /** Configuration passed in `envzo.parse` */
    options: O & EnvzoValidatorOptions<T>,
    /** Envzo errors such as `invalid` to indicate the validator failing */
    errors: typeof errors,
    /** Built-in validators for parsing basic datatypes */
    parse: typeof validators,
}) => T;

// declare const internals: unique symbol;
const internals: unique symbol = Symbol();
export { internals }

// export type EnvzoValidator<T, O extends object = EmptyObject> = (options: O & EnvzoValidatorOptions<T>) => T;
export type EnvzoValidator<T, O extends object = EmptyObject, E extends object = any> = ((input: string | T, options?: O & EnvzoValidatorOptions<T>) => T) & {
    serialize: (counter: Counter, arr?: any[], stopAt?: number, asString?: boolean) => (options: O & EnvzoValidatorOptions<T, E>) => O & EnvzoValidatorOptions<T, E> & { index: number };
    with: (env: E) => (options: O & EnvzoValidatorOptions<T, E>) => T;
    [internals]: {
        T: T
        O: O
    }
};


let _validators: typeof validators;

export const MATCH_SERIALIZED_VALIDATOR = /<\[\[VALIDATOR:(\d+)\]\]>/g;
export function makeValidator<T, O extends object = EmptyObject>(
    parser: EnvzoParser<T, O>,
    defaultOptions?: O
): EnvzoValidator<T, O> {
    const bind = function (options: EnvzoValidatorOptions<any>) {
        let input;
        if ('key' in options) {
            // @ts-ignore
            input = this[options.key];
        } else if ('get' in options) {
            // @ts-ignore
            input = options.get(this);
        }
        if (input === undefined) {
            if (options.optional) {
                return undefined;
            } else {
                throw errors.missing()
            }
        }
        return parser({
            parse: _validators,
            input: input as any,
            errors,
            options: {
                ...(defaultOptions || {}),
                ...(options || {})
            } as any,
        })
    }
    return Object.assign(function (input: any, options: any = {}) {
        return parser({
            parse: _validators,
            input,
            errors,
            options: {
                ...(defaultOptions || {}),
                ...(options || {})
            }
        })
    }, {
        __bind: bind,
        with: (env: any) => bind.bind(env),
        serialize: (counter: Counter, arr?: any[], stopAt?: number, asString?: boolean) => {
            return function (opts: any) {
                const n = counter.increment() - 1;
                if (stopAt != undefined && n >= stopAt) {
                    throw new Error(`Serialize STOP`);
                }
                const result = {
                    ...opts,
                    index: n,
                    bind,
                    toString() {
                        return `<[[VALIDATOR:${result.index}]]>`
                    }
                }
                if (arr) arr.push(result);
                if (asString === true) {
                    return result.toString();
                }
                return result;
            }
        },
    } as any)
}


export namespace validators {

    /** Matches a boolean */
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

    /** Matches a string */
    export const string = makeValidator<string>(({ input }) => {
        if (typeof input !== 'string') {
            throw errors.invalid('string', input);
        }
        return input;
    });

    const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/; // intentionally non-exhaustive
    /** Matches an email */
    export const email = makeValidator<string>(({ input }) => {
        if (!EMAIL_REGEX.test(input)) {
            throw errors.invalid('email', input);
        }
        return input;
    });

    /** Matches a number */
    export const number = makeValidator<number>(({ input }) => {
        const coerced = +input;
        if (Number.isNaN(coerced)) {
            throw errors.invalid('number', input);
        }
        return coerced;
    });

    /** Matches a port number */
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

    /** Matches a URL */
    export const url = makeValidator<string>(({ input }) => {
        try {
            new URL(input); // validate url
            return input;
        } catch (_) {
            throw errors.invalid('url', input);
        }
    });

    /** Matches JSON */
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

    const HOST_REGEX = /(([0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})|(\w*.\w*.\w*)):[0-9]{2,5}/;
    /** Matches `host:port` */
    export const host = makeValidator<string>(({ input, errors }) => {
        if (!HOST_REGEX.test(input)) {
            throw errors.invalid('host', input);
        }
        return input;
    })

}

_validators = validators;
import { defaultEnvzoReporter, defaultEnvzoReportHandler, EnvzoReporter, EnvzoReporterErrors, EnvzoReportHandler } from './reporter';
import { Counter, get, getNestedKeys } from './utils';
import { EnvzoValidator, makeValidator, validators, internals, MATCH_SERIALIZED_VALIDATOR } from './validators';



type EnvzoConfig = {
    validators?: Record<string, EnvzoValidator<any>>;
    handleReport?: EnvzoReportHandler,
    reporter?: EnvzoReporter,
}

// type EnvzoValidators<C extends EnvzoConfig> = typeof validators & C['validators'];
// type InferEnvzo<T> = T extends EnvzoParser<any> ? ReturnType<T> : T;

type BoundEnvzoValidators<C extends EnvzoConfig, E = any, V = typeof validators & C['validators']> = {
    // @ts-ignore
    [P in keyof V]: ReturnType<EnvzoValidator<V[P][typeof internals]['T'], V[P][typeof internals]['O'], E>['with']>
}


const DEFAULT_CONFIG: EnvzoConfig = {
    handleReport: defaultEnvzoReportHandler,
    reporter: defaultEnvzoReporter,
}

export class Envzo<C extends EnvzoConfig> {
    static makeValidator = makeValidator;

    constructor(public config: C) {
        this.config = { ...DEFAULT_CONFIG, ...this.config }
    }


    parse<E, T>(env: E, register: (types: BoundEnvzoValidators<C, E>) => T) {
        const validates = this.serialize(register);
        const errors: EnvzoReporterErrors = {}
        for (const entry of validates) {
            try {
                entry.bind.call(env, entry)
            } catch(err) {
                errors[entry.field] = {
                    ...entry,
                    typeName: entry.bind.typeName,
                    error: err,
                }
            }
        }
        if (Object.keys(errors).length > 0 && this.config.handleReport && this.config.reporter) {
            this.config.handleReport(this.config.reporter(errors))
        }
        const boundValidators = Object.fromEntries(
            Object.entries({
                ...validators,
                ...(this.config.validators || {})
            }).map(([name, validator]) => {
                return [name, validator.with(env)]
            })
        );
        return register(boundValidators as any);
    }

    /** Detects what validators correspond to what keys, without validating the data itself */
    private serialize(register: (types: BoundEnvzoValidators<C>) => any) {
        const __validators = Object.entries({
            ...validators,
            ...(this.config.validators || {})
        })
        const _validators = __validators.map(([key, func]) => {
            Object.assign((func as any).__bind, {
                typeName: __validators.find(o => o[1] === func)?.[0]
            })
            return [key, func]
        }) as typeof __validators;
        const precounter = new Counter();
        const prevalidates = new Array();
        const preserializedValidators = Object.fromEntries(
            _validators.map(([name, validator]) => {
                return [name, validator.serialize(precounter, prevalidates, undefined, true)]
            })
        );
        const preserialize = register(preserializedValidators as any);
        const keys = getNestedKeys(preserialize);
        const entries = Object.fromEntries(
            keys.map(o => [o, get(preserialize, o)])
                .filter(o => o[1].includes(`<[[VALIDATOR:`))
                .map(o => [o[0], Array.from(o[1].matchAll(MATCH_SERIALIZED_VALIDATOR))])
                .filter(o => o[1].length > 0)
                .map(o => [o[0], o[1].map((e: any) => e[1]).map((e: any) => Number(e))])
        );
        const toKeys = new Map<number, string>();
        for (const key in entries) {
            for (const index of entries[key]) {
                toKeys.set(index, key);
            }
        }
        // console.log(entries, toKeys)
        const counter = new Counter();
        const validates = new Array();
        register(Object.fromEntries(_validators.map(([name, validator]) => {
            return [name, validator.serialize(counter, validates)]
        })) as any);
        return validates.map(o => {
            o.field = toKeys.get(o.index);
            // console.log(o)
            return o;
        })
        // return {
        //     calls: entries,
        //     keys: toKeys,
        // }
    }

}


export const envzo = new Envzo(DEFAULT_CONFIG);

// export const envzo = new Envzo({
//     validators: {
//         bruh: Envzo.makeValidator<boolean>(({ parse }) => {
//             return true;
//         })
//     }
// });



// envzo.parse(process.env, ({ number, string, bruh }) => ({
//     ye: bruh({ key: 'YE', default: false }),
//     mongo: `mongodb://${string({ key: 'MONGO_HOST' })}/${string({ key: 'MONGO_DB' })}`,
//     eey: number({ key: 'EEY' }),
//     omg: string({ get: env => env.omg }),
//     nested: {
//         yeyeye: number({ key: 'YEYEYE' })
//     }
// }))
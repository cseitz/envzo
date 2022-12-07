import { EnvzoValidator, makeValidator, validators } from './validators';



type EnvzoConfig = {
    validators?: Record<string, EnvzoValidator<any>>;
}

// type EnvzoValidators<C extends EnvzoConfig> = typeof validators & C['validators'];

// type InferEnvzo<T> = T extends EnvzoParser<any> ? ReturnType<T> : T;

type BoundEnvzoValidators<C extends EnvzoConfig, V = typeof validators & C['validators']> = {
    // @ts-ignore
    [P in keyof V]: (...args: Parameters<V[P]>) => ReturnType<V[P]>;
}

export class Envzo<C extends EnvzoConfig> {
    static makeValidator = makeValidator;

    constructor(public config: C) {

    }


    parse<T>(env: any, register: (types: BoundEnvzoValidators<C>) => T) {
        const boundValidators = Object.fromEntries(
            Object.entries({
                ...validators,
                ...(this.config.validators || {})
            }).map(([name, validator]) => {
                return [name, validator.bind(env)]
            })
        );
        return register(boundValidators as any);
    }


}

export const envzo = new Envzo({
    validators: {
        bruh: Envzo.makeValidator<boolean>(({ }) => {
            return true;
        })
    }
});


// envzo.parse({}, ({ number, string, bruh }) => ({
//     ye: bruh({ key: 'YE', default: false }),
//     mongo: `mongodb://${string({ key: 'MONGO_HOST' })}/${string({ key: 'MONGO_DB' })}`,
//     eey: number({ key: 'EEY' }),
//     omg: string({ get: env => env.omg }),
//     nested: {
//         yeyeye: number({ key: 'YEYEYE' })
//     }
// }))

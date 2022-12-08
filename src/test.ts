import { Envzo } from '.';


export const envzo = new Envzo({
    validators: {
        powerOfTwo: Envzo.makeValidator<number>(({ input, errors, parse }) => {
            // console.log(parse);
            // Use the `number` validator to parse into a number
            const num = parse.number(input);
            if (Math.log2(num) % 1 !== 0) {
                // not a power of two!
                throw errors.invalid('Power of Two', input);
            }
            return num;
        })
    }
});


envzo.parse(process.env, ({ powerOfTwo }) => ({
    // a: `mongodb://${string({ key: 'aMONGO_HOST' })}/${string({ key: 'aMONGO_DB' })}&${string({ key: 'aMONGO_AND' })}`,
    ye: powerOfTwo({ key: 'YE', default: 4 }),
    // mongo: `mongodb://${string({ key: 'MONGO_HOST' })}/${string({ key: 'MONGO_DB' })}`,
    // nums: [number({ key: 'N1' }), number({ key: 'N2' })],
    // eey: number({ key: 'EEY' }),
    // omg: string({ get: env => env.omg }),
    // nested: {
    //     w: `mongodb://${string({ key: 'wMONGO_HOST' })}&${string({ key: 'wMONGO_AND' })}`,
    //     yeyeye: number({ key: 'YEYEYE' }),
    //     x: `mongodb://${string({ key: 'xMONGO_DB' })}&${string({ key: 'xMONGO_AND' })}`,
    // },
    // z: `mongodb://${string({ key: 'zMONGO_HOST' })}}`,
}))

envzo.parse(process.env, ({ host, string }) => ({
    mongo: `mongodb://${host({ key: 'MONGO_HOST' })}/${string({ key: 'MONGO_DB' })}`
}))
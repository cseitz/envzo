import { Envzo } from '.';

export const envzo = new Envzo({
    validators: {
        powerOfTwo: Envzo.makeValidator<number>(({ input, errors, parse }) => {
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


envzo.parse(process.env, ({ number, string, powerOfTwo }) => ({
    ye: powerOfTwo({ key: 'YE', default: 4 }),
    mongo: `mongodb://${string({ key: 'MONGO_HOST' })}/${string({ key: 'MONGO_DB' })}`,
    eey: number({ key: 'EEY' }),
    omg: string({ get: env => env.omg }),
    nested: {
        yeyeye: number({ key: 'YEYEYE' })
    }
}))
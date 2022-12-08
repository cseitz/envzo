
## Envzo

Name:
- `env`ironment
- `zo`d

Heavily inspired by...
- [zod](https://github.com/colinhacks/zod)
- [envsafe](https://github.com/KATT/envsafe)
- [envalid](https://github.com/af/envalid)

I wanted to create something almost the same as `envsafe` and `envalid`, 
except I disliked the fact that imports were global.

For example, one would `import { str } from 'envalid'` when I felt that would clog my global imports.

I set out to create a simple and modular alternative to `envsafe` and `envalid` that would eliminate
those global variables, allow validators to be built and reused, and allow string interpolation with types.

Note: *Some portions of my code, such as the built-in validators, was pulled directly from [envsafe](https://github.com/KATT/envsafe)! [KATT](https://github.com/KATT)'s code is excellent and I love everything he works on!*

### Usage

```ts
import { envzo } from 'envzo';

// Pull port number from PORT environment variable
const env = envzo.parse(process.env, ({ port }) => ({
    listenPort: port({ key: 'PORT', default: 1234 })
}))

console.log(env.listenPort);
```

You can also define custom validators.
```ts
import { Envzo } from 'envzo';

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

const env = envzo.parse(process.env, ({ powerOfTwo }) => ({
    num: powerOfTwo({ key: 'NUMBER' })
}))

// num is a power of two
const { num } = env;
```
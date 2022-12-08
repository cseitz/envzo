

export class Counter {
    constructor(public value: number = 0) {

    }

    increment() {
        return ++this.value;
    }
}


export function getNestedKeys(obj: any, stop?: (o: any) => boolean, prefix = ''): string[] {
    if (typeof obj === 'object' && stop && stop(obj)) {
        return [prefix.slice(0, -1)]
    }
    if (typeof obj !== 'object') {
        return [prefix.slice(0, -1)]
    }
    return Object.keys(obj).reduce((res: any, el: any) => {
        if (Array.isArray(obj[el])) {
            // console.log('is array', obj[el])
            // return res;
            // .filter((o: any) => typeof o === 'object')
            // typeof o !== 'object' ? o : 
            const items = [].concat(...obj[el].map((o: any, i: number) => getNestedKeys(o, stop, prefix + el + '.' + String(i) + '.')));
            return [...res, ...items]
        } else if (typeof obj[el] === 'object' && obj[el] !== null) {
            if (stop && stop(obj[el])) {
                return [...res, prefix + el];
            }
            return [...res, ...getNestedKeys(obj[el], stop, prefix + el + '.')];
        }
        return [...res, prefix + el];
    }, []) as any;
}


export function get(obj: object, path: string) {
    const properties = typeof path === 'string' ? path.split('.') : path;
    // @ts-ignore
    return properties.reduce((prev: any, curr: any) => {
        if (!(curr in prev) && !isNaN(Number(curr))) {
            return prev?.[Number(curr)]
        }
        return prev?.[curr];
    }, obj)
}
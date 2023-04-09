function getAllProperties(object: object) {
    const properties = new Set<[object, string | symbol]>();

    let obj = object;

    do {
        for (const key of Reflect.ownKeys(obj)) {
            properties.add([obj, key]);
        }
    } while ((obj = Reflect.getPrototypeOf(obj)!) && obj !== Object.prototype);

    return properties;
}

interface AutoBindOptions {
    include: (string | RegExp)[]
    exclude: (string | RegExp)[]
}

export function autoBind<K extends string | symbol>(self: Record<K, unknown>, options?: AutoBindOptions) {
    const filter = (key: string) => {
        const match = (pattern: string | RegExp) => typeof pattern === "string"
            ? key === pattern
            : pattern.test(key);

        if (options?.include) {
            return options.include.some(match);
        }

        if (options?.exclude) {
            return !options.exclude.some(match);
        }

        return true;
    };

    for (const [object, key] of getAllProperties(self.constructor.prototype)) {
        if (key === "constructor" || typeof key !== "string" || !filter(key)) {
            continue;
        }

        const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
        if (descriptor && typeof descriptor.value === "function") {
            self[key as K] = (self[key as K] as Function).bind(self);
        }
    }

    return self;
}

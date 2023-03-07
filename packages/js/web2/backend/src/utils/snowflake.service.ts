import { machineIdSync } from "node-machine-id";

export const SnowflakeService = new (class {
    _increment = 0;

    readonly _pid = process.pid & 0b11111;

    readonly _mid = machineIdSync().charCodeAt(0) & 0b11111;

    readonly _epoch = 1577826000000;

    make = () => {
        const timestamp = BigInt(new Date().getTime() - this._epoch);

        let result = BigInt(0);

        result += timestamp << 21n;
        result += BigInt(this._mid) << 17n;
        result += BigInt(this._pid) << 12n;
        result += BigInt(this._increment);
        this._increment += 1;

        return result.toString();
    };
});

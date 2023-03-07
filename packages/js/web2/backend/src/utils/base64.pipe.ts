import { PipeTransform, Injectable } from "@nestjs/common";

@Injectable()
export class Base64Pipe implements PipeTransform {
    transform(value: unknown) {
        if (!value)
            return null;

        return JSON.parse(Buffer.from(String(value), "base64").toString("utf8"));
    }
}

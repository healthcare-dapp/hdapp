import { array, number, Mixed, string, type, Type } from "io-ts";
import { orNull } from "../io-ts-utils/or-null";

export interface PagedResponse<D> {
    items: D[]
    total_count: number
    next_page_id: string | null
    previous_page_id: string | null
}

export const PagedResponse = (t: Mixed) => {
    return type({
        items: array(t),
        total_count: number,
        next_page_id: orNull(string),
        previous_page_id: orNull(string),
    });
};

import { useEffect, useState } from "react";
import { dbService } from "../services/db.service";

export function useDatabase(effect: () => void, dependentStores?: string[], dependantVars?: unknown[]) {
    const [, forceUpdate] = useState(0);

    const callback = (stores: string[]) => {
        if (!dependentStores || dependentStores.some(store => stores.includes(store))) {
            effect();
            forceUpdate(n => n + 1);
        }
    };

    useEffect(() => {
        effect();
    }, []);

    useEffect(() => {
        dbService.on("txn_completed", callback);
        return () => {
            dbService.off("txn_completed", callback);
        };
    }, dependantVars ?? []);
}

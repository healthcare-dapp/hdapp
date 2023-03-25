import { useEffect, useState } from "react";
import { dbService } from "../services/db.service";

export function useDatabase(effect: () => void, dependentStores?: string[]) {
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        effect();

        const callback = (stores: string[]) => {
            if (!dependentStores || dependentStores.some(store => stores.includes(store))) {
                effect();
                forceUpdate(n => n + 1);
            }
        };

        dbService.on("txn_completed", callback);
        return () => {
            dbService.off("txn_completed", callback);
        };
    }, []);
}

import { useEffect, useState } from "react";
import { sessionManager } from "../managers/session.manager";
import { sharedDbService } from "../services/db.service";

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
        sharedDbService.on("txn_completed", callback);
        sessionManager.db.service.on("txn_completed", callback);
        return () => {
            sharedDbService.off("txn_completed", callback);
            sessionManager.db.service.off("txn_completed", callback);
        };
    }, [...(dependantVars ?? []), sessionManager.db]);
}

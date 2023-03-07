import { useEffect, useState } from "react";
import { dbService } from "../services/db.service";

export function useDatabase(effect: () => void) {
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        effect();

        const callback = () => {
            effect();
            forceUpdate(n => n + 1);
        };

        dbService.on("txn_completed", () => callback());
        return () => {
            dbService.off("txn_completed", () => callback());
        };
    }, []);
}

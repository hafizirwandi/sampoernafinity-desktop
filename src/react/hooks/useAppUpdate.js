import { useCallback, useEffect, useState } from 'react';

export function useAppUpdate() {
    const [state, setState] = useState(null);

    useEffect(() => {
        const unsubscribe = window.api.updater.onState(setState);
        window.api.updater.getState().then(setState);

        return unsubscribe;
    }, []);

    const install = useCallback(() => window.api.updater.install(), []);
    const openDownload = useCallback(() => window.api.updater.openDownload(), []);
    const check = useCallback(() => window.api.updater.check(), []);

    return { state, install, openDownload, check };
}

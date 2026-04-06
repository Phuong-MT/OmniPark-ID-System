"use client";

import { Provider } from "react-redux";
import { RootState, Store } from "@/redux/store";
import { useEffect, useRef } from "react";

export function ReduxProvider({ children, initialState }: { children: React.ReactNode, initialState?: Partial<RootState>; }) {
	const storeRef = useRef<any>(null);

	if (!storeRef.current) {
		storeRef.current = Store(initialState);
	}

	useEffect(() => {
		if (initialState) {
			storeRef.current.dispatch({
				type: "HYDRATE",
				payload: initialState,
			});
		}
	}, [initialState]);

	return <Provider store={storeRef.current}>{children}</Provider>;
};

import { useStore } from "react-redux";

export function ReduxHydrator({ initialState }: { initialState: Partial<RootState> }) {
    const store = useStore();

    useEffect(() => {
        if (initialState) {
            store.dispatch({ type: "HYDRATE", payload: initialState });
        }
    }, [store, initialState]);

    return null;
}

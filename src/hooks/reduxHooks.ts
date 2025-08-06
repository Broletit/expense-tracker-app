import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";

// Use instead of useDispatch
export const useAppDispatch: () => AppDispatch = useDispatch;

// Use instead of useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

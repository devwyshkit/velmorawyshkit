import * as React from "react";
import * as OriginalRuntime from "react/jsx-runtime?original";

const {
  Fragment,
  jsx,
  jsxs,
  jsxDEV,
} = OriginalRuntime as typeof import("react/jsx-runtime");

const useState = React.useState;
const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect ?? React.useEffect;
const useDebugValue = React.useDebugValue;
const useSyncExternalStore =
  React.useSyncExternalStore ??
  ((_subscribe: () => void, getSnapshot: () => unknown) => getSnapshot());

const runtime = {
  Fragment,
  jsx,
  jsxs,
  jsxDEV,
  useState,
  useEffect,
  useLayoutEffect,
  useDebugValue,
  useSyncExternalStore,
};

export {
  Fragment,
  jsx,
  jsxs,
  jsxDEV,
  useState,
  useEffect,
  useLayoutEffect,
  useDebugValue,
  useSyncExternalStore,
};

export default runtime;


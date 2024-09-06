import { lazy } from "react";

const routes = [
  {
    path: "/trove",
    exact: true,
    component: lazy(() => import("../pages/TROVE")),
    animation: "fadeIn",
    title: "TROVE",
  },
  {
    path: "/riskytrove",
    exact: true,
    component: lazy(() => import("../pages/RISKYTROVE")),
    animation: "fadeIn",
    title: "RISKY TROVE"
  },
  {
    path: "/stabilitypool",
    exact: true,
    component: lazy(() => import("../pages/STABILITYPOOL")),
    animation: "fadeIn",
    title: "STABILITY POOL",
  },
  {
    path: "/staking",
    exact: true,
    component: lazy(() => import("../pages/STAKING")),
    animation: "fadeIn",
    title: "STAKING",
  },
  {
    path: "/swap",
    exact: true,
    component: lazy(() => import("../pages/SWAP")),
    animation: "fadeIn",
    title: "SWAP",
  },
  {
    path: "/analytics",
    exact: true,
    component: lazy(() => import("../pages/ANALYTICS")),
    animation: "fadeIn",
    title: "ANALYTICS",
  },
  {
    path: "/faucet",
    exact: true,
    component: lazy(() => import("../pages/FAUCET")),
    animation: "fadeIn",
    title: "FAUCET",
  },
];

export default routes;

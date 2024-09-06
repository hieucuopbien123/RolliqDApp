import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import routes from "./configs/router.js";
import FadeLoader from "react-spinners/ClockLoader";
import { TransactionMonitor } from "./components/Trasaction";
import { Helmet } from "react-helmet";
import { Suspense } from "react";
import clsx from "clsx";
import { useRolliq } from "./hooks/RolliqContext";
import { Decimal, Difference, Trove } from "./lib/@rolliq/lib-base";
import { Wallet } from "@ethersproject/wallet";
import { RolliqStoreProvider } from "./lib/@rolliq/lib-react";
import { TroveViewProvider } from "./components/Trove/context/TroveViewProvider";
import { StabilityViewProvider } from "./components/Stability/context/StabilityViewProvider";
import { StakingViewProvider } from "./components/Staking/context/StakingViewProvider";

function App({loader}) {
  const { account, provider, rolliq } = useRolliq();

  Object.assign(window, {
    account,
    provider,
    rolliq,
    Trove,
    Decimal,
    Difference,
    Wallet,
  });

  return (
    <RolliqStoreProvider {...{ loader }} store={rolliq.store}>
      <Router>
        <TroveViewProvider>
          <StabilityViewProvider>
            <StakingViewProvider>
              <Header />
              <div className="mx-auto container" style={{minHeight: "calc(100vh - 63px)"}}>
                <Routes>
                  {
                    routes.map((route) => (
                    <Route
                      key={route.path}
                      path={route.path}
                      exact={route.exact}
                      element={
                        <Suspense
                          fallback={
                            loader
                          }
                        >
                          <Helmet>
                            <meta property="og:url" content={window.location.href} />
                            <meta name="twitter:url" content={window.location.href} />
                          </Helmet>
                          <div
                            className={clsx({
                              [`animate__animated animate__${route.animation}`]: Boolean(
                                route.animation
                              ),
                            })}
                          >
                            <route.component />
                          </div>
                        </Suspense>
                      }
                    />
                  ))}
                  <Route path="*" element={<Navigate to={"/trove"} replace />} />
                </Routes>
              </div>
            </StakingViewProvider>
          </StabilityViewProvider>
        </TroveViewProvider>
      </Router>  
      <TransactionMonitor />
    </RolliqStoreProvider>
  )
}

export default App;

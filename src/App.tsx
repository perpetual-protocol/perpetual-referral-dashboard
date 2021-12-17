import React from "react";
import { Web3ReactProvider } from "@web3-react/core";
import { QueryClient, QueryClientProvider } from "react-query";
import Home from "./views/home/Home";
import { Web3Provider } from "@ethersproject/providers";
import { useState } from "react";
import Toast from "./components/Toast";
import { useContext } from "react";
import * as echarts from "echarts/core";

import { LineChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { Route } from "wouter";
import Report from "./views/report/Report";
import Notify from "bnc-notify";
import AppStateProvider from "./AppStateHolder";
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  CanvasRenderer,
  BarChart,
]);

const queryClient = new QueryClient();
const notify = Notify({
  dappId: "11c0b233-f345-4691-af21-275b3e1a7d0f",
  networkId: 100,
});

export const ToastContext = React.createContext(null);
export const NotifyContext = React.createContext(null);
export const useToast = () => useContext(ToastContext);
export const useNotify = () => useContext(NotifyContext);

function getLibrary(provider) {
  return new Web3Provider(provider);
}

export default function App() {
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastText, setToastText] = useState("");
  const showToast = (text: string) => {
    setIsToastVisible(true);
    setToastText(text);
    setTimeout(() => {
      setIsToastVisible(false);
      setToastText("");
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <NotifyContext.Provider value={{ notify }}>
        <QueryClientProvider client={queryClient}>
          <Web3ReactProvider getLibrary={getLibrary}>
            <AppStateProvider>
              <div className="flex flex-col w-full h-full font-body subpixel-antialiased">
                <a href="https://referral.perp.com" target="_blank" className='flex font-semibold w-full p-4 bg-perp-light-green justify-center'>
                  V2 of the referral program has launched! The Perpetual Protocol V1 referral program has been stopped.
                  You can go to V2 by clicking this banner.
                </a>
                <Route path="/" component={Home} />
                <Route path="/report" component={Report} />
              </div>
            </AppStateProvider>
          </Web3ReactProvider>
        </QueryClientProvider>
        <Toast isVisible={isToastVisible} text={toastText} />
      </NotifyContext.Provider>
    </ToastContext.Provider>
  );
}

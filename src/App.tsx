import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { QueryClient, QueryClientProvider } from 'react-query';
import Home from './views/home/Home';
import AppNav from './views/app-nav/AppNav';
import { Web3Provider } from '@ethersproject/providers';
import { useState } from 'react';
import Toast from './components/Toast';
import { useContext } from 'react';
import * as echarts from 'echarts/core';

import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  CanvasRenderer,
  BarChart
]);

const queryClient = new QueryClient();

export const ToastContext = React.createContext(null);
export const useToast = () => useContext(ToastContext);

function getLibrary(provider) {
  return new Web3Provider(provider);
}

export default function App() {
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastText, setToastText] = useState('');
  const showToast = (text: string) => {
    setIsToastVisible(true);
    setToastText(text);
    setTimeout(() => {
      setIsToastVisible(false);
      setToastText('');
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <QueryClientProvider client={queryClient}>
        <Web3ReactProvider getLibrary={getLibrary}>
          <div className='flex flex-col w-full h-full font-body subpixel-antialiased'>
            <AppNav />
            <Home />
          </div>
        </Web3ReactProvider>
      </QueryClientProvider>
      <Toast isVisible={isToastVisible} text={toastText} />
    </ToastContext.Provider>
  );
}

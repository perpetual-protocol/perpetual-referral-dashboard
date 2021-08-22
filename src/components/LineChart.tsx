import React from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import * as echarts from 'echarts/core';
import useTailwind from '../hooks/useTailwind';
import { useState } from 'react';
import numeral from 'numeral';

type ChartData = {
  values: number[];
  axis: string[];
};

type Props = {
  data: ChartData;
  name: string;
};

const tailwind = useTailwind();

function getOption(name: string, data: ChartData) {
  return {
    xAxis: {
      type: 'category',
      data: data?.axis || [],
      axisLine: {
        onZero: false
      },
      axisLabel: {
        color: '#FFF'
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: true
      },
      splitNumber: 4,
      splitLine: {
        show: false
      },
      position: 'right',
      nameGap: 25,
      axisLabel: {
        color: '#FFF'
      }
    },
    grid: {
      left: '2.5%',
      right: '2.5%',
      top: '10%',
      bottom: '5%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        label: {
          show: false
        }
      },
      formatter: (params) => {
        return `${params[0].marker} $${numeral(params[0].value).format('0,0.00')}`
      }
    },
    color: [tailwind.theme.colors['perp-cyan']],
    series: [
      {
        name,
        type: 'bar',
        barWidth: '60%',
        data: data?.values || []
      }
    ]
  };
}

export default function LineChart(props: Props) {
  const { data = { values: [], axis: [] }, name } = props;
  const [chartInstance, setChartInstance] = useState<echarts.ECharts>();
  const chartRef = useRef();

  useEffect(() => {
    if (chartInstance) {
      chartInstance.setOption(getOption(name, data));
    }
  }, [data?.axis, data?.values]);

  useEffect(() => {
    if (chartRef.current && !chartInstance) {
      const chart = echarts.init(chartRef.current);
      chart.setOption(getOption(name, data));
      setChartInstance(chart);

      window.onresize = () => {
        chart.resize();
      };
    }
  }, []);

  return <div className='h-full w-full' ref={chartRef} />;
}

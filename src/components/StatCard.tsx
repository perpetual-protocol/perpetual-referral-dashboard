import React, { ReactElement } from 'react';
import numeral from 'numeral';
import Skeleton from './Skeleton';

type Props = {
  title: string;
  icon?: ReactElement;
  change?: number;
  value: number;
  format?: string;
  max?: number;
  isLoading?: boolean;
  subtext?: string;
};

export default function StatCard(props: Props) {
  const { title, icon, change, value, format, max, isLoading, subtext } = props;
  if (isLoading) {
    return (
      <Skeleton
        height={160}
        className='rounded-2xl bg-perp-gray-300 py-5 px-6 col-span-12 sm:col-span-6 md:col-span-4'
      />
    );
  }

  const changeColor = change > 0 ? 'text-perp-light-green' : 'text-perp-red';

  return (
    <div className='rounded-2xl bg-perp-gray-300 py-5 px-6 col-span-12 sm:col-span-6 md:col-span-4'>
      <h6 className='text-perp-gray-50 text-sm mb-4'>{title}</h6>
      <div className='flex items-center pb-12'>
        <div className='mr-2'>{icon}</div>
        <h2 className='text-white text-3xl font-bold mr-2'>
          {numeral(value).format(format || '0,0')}
        </h2>
        {max && <span className='text-perp-gray-50 text-sm'>/ {max} MAX</span>}
        {change !== undefined && (
          <span className={`${changeColor}`}>
            {numeral(change).format('+0.0%')}
          </span>
        )}
      </div>
    </div>
  );
}

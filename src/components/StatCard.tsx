import React, { ReactElement } from "react";
import numeral from "numeral";
import Skeleton from "./Skeleton";
import Tooltip from "./Tooltip";

type Props = {
  title: string;
  icon?: ReactElement;
  change?: number;
  value: string | number;
  format?: string;
  max?: number;
  isLoading?: boolean;
  subtext?: string;
  tooltip?: ReactElement;
  state?: 'normal' | 'error';
  span?: number;
};

export default function StatCard(props: Props) {
  const {
    title,
    icon,
    change,
    value,
    format,
    max,
    isLoading,
    subtext,
    tooltip,
    state = 'normal',
    span = 4
  } = props;
  if (isLoading) {
    return (
      <Skeleton
        height={120}
        className={`rounded-2xl bg-perp-gray-300 py-5 px-6 col-span-12 sm:col-span-6 md:col-span-${span}`}
      />
    );
  }

  const changeColor = change > 0 ? "text-perp-light-green" : "text-perp-red";
  const textColorClass = state === 'normal' ? 'text-white' : 'text-perp-red';

  return (
    <div className={`rounded-2xl bg-perp-gray-300 py-5 px-6 col-span-12 sm:col-span-6 md:col-span-${span}`}>
      <div className="flex items-center mb-4">
        <h6 className="text-perp-gray-50 text-sm pr-1">{title}</h6>
        {tooltip && <Tooltip content={tooltip}/>}
      </div>
      <div className="pb-2">
        <div className="flex items-center">
          <div className="mr-2">{icon}</div>
          <h2 className={`${textColorClass} text-3xl font-bold mr-2`}>
            { typeof (value) === 'string' ? value : numeral(value).format(format || "0,0")}
          </h2>
          {max && (
            <span className="text-perp-gray-50 text-sm">/ {max} MAX</span>
          )}
          {change !== undefined && (
            <span className={`${changeColor}`}>
              {numeral(change).format("+0.0%")}
            </span>
          )}
        </div>
      </div>
      {subtext && <div className={`${textColorClass} text-sm mt-2`}>{subtext}</div>}

    </div>
  );
}

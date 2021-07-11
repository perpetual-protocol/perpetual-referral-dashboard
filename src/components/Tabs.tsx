import React from 'react';

export type TabOption = {
  value: string;
  label: string;
};

type Props = {
  tabs: TabOption[];
  activeTab: string;
  onTabSelected: (tab: TabOption) => void;
};

type TabProps = {
  tab: TabOption;
  isActive: boolean;
  onClick: (tab: TabOption) => void;
};

function Tab(props: TabProps) {
  const { tab, isActive, onClick } = props;
  const underlineClass = isActive ? 'bg-perp-cyan' : 'bg-transparent';
  return (
    <div className='mr-8'>
      <button
        onClick={() => onClick(tab)}
        className='text-white font-medium bg-perp-gray-300 my-3'
      >
        {tab.label}
      </button>
      <div className={`${underlineClass} h-0.5`} />
    </div>
  );
}

export default function Tabs(props: Props) {
  const { tabs, activeTab, onTabSelected } = props;
  return (
    <div
      className='w-full flex'
      style={{ maxWidth: '1200px' }}
    >
      {tabs.map(tab => (
        <Tab
          key={`tab-${tab.value}`}
          onClick={onTabSelected}
          tab={tab}
          isActive={activeTab === tab.value}
        />
      ))}
    </div>
  );
}

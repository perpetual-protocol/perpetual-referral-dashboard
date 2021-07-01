import React, { ReactElement } from 'react';

type Size = 'sm' | 'md' | 'lg';
type ButtonType = 'primary' | 'secondary';

type Props = {
  children: string | string[];
  icon?: ReactElement;
  size?: Size;
  onClick: Function;
  type?: ButtonType;
};

export default function Button(props: Props) {
  const { children, icon, size = 'md', onClick, type = 'primary' } = props;

  const getSizeClass = (size: Size) => {
    switch (size) {
      case 'sm':
        return 'py-2 px-4 text-sm';
      case 'md':
        return 'py-3 px-6 text-base';
      case 'lg':
        return '';
    }
  };

  const getTypeClass = (type: ButtonType) => {
    switch (type) {
      case 'primary':
        return 'bg-perp-cyan text-perp-btn-text';
      case 'secondary':
        return 'bg-perp-gray-200 text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`${getSizeClass(size)} ${getTypeClass(
        type
      )} font-semibold rounded-full flex items-center hover:bg-perp-cyan-secondary`}
    >
      {icon && <div className='mr-2 flex items-center'>{icon}</div>}
      {children}
    </button>
  );
}

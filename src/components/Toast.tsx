import React from 'react';

type Props = {
  isVisible: boolean;
  text: string;
  type: 'normal' | 'error'
};

export default function Toast(props: Props) {
  const { isVisible, text, type } = props;
  const bg = type === 'normal' ? 'bg-perp-light-green' : 'bg-perp-red';
  return (
    <>
      {isVisible && (
        <div
          className={`${bg} py-2 px-3 text-perp-body absolute rounded left-0 right-0 mx-auto`}
          style={{ top: '24px', width: 'fit-content' }}
        >
          <span>{text}</span>
        </div>
      )}
    </>
  );
}

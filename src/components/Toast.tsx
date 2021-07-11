import React from 'react';

type Props = {
  isVisible: boolean;
  text: string;
};

export default function Toast(props: Props) {
  const { isVisible, text } = props;
  return (
    <>
      {isVisible && (
        <div
          className='bg-perp-light-green py-2 px-3 text-perp-body absolute rounded left-0 right-0 mx-auto'
          style={{ top: '24px', width: 'fit-content' }}
        >
          <span>{text}</span>
        </div>
      )}
    </>
  );
}

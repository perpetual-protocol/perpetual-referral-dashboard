import React, { ReactElement } from 'react';
import { Portal } from 'react-portal';

type Props = {
  children: ReactElement | ReactElement[];
  onClose?: () => void;
};

const style = {
  minWidth: '250px',
  maxWidth: '300px',
  minHeight: '150px'
}

export default function Modal(props: Props) {
  const { children, onClose } = props;
  const preventPropagation = (event: Event) => {
    event.stopPropagation();
  }

  const handleClose = () => {
    onClose && onClose();
  }
  return (
    <Portal node={document && document.getElementById('portal')}>
      <div className='fixed w-full h-full flex justify-center items-center z-10'>
        <div
          id='modal-backdrop'
          className='absolute w-full h-full bg-black bg-opacity-80 z-20'
          onClick={handleClose}
        ></div>
        <div onClick={preventPropagation as any} id='modal-content' className='rounded-lg bg-perp-gray-300 z-30 shadow-lg p-4' style={style}>
          {children}
        </div>
      </div>
    </Portal>
  );
}

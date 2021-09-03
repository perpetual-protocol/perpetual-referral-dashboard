import React, { ChangeEvent } from 'react';

type Props = {
    placeholder?: string;
    onChange?: (e: ChangeEvent) => void;
    value?: string;
}

export default function Input(props: Props) {
    const { placeholder, onChange, value } = props;
    return (
        <input value={value} onChange={onChange} placeholder={placeholder} className='text-white outline-none text-center w-full p-2 border border-white bg-transparent border-opacity-10 rounded-lg'>
        </input>
    )
}
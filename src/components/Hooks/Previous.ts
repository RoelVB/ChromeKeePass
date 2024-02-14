import React from 'react';

/** Previous state value */
export default function usePrevious<T = any>(value?: T)
{
    const ref = React.useRef(value);

    React.useEffect(()=>{
        ref.current = value;
    }, [value]);
    
    return ref.current;
}

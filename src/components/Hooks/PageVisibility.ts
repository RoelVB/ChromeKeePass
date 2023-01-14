import React from "react";

/** Changes when the visibility of a page changes */
export const usePageVisibility = ()=>
{
    const [ visible, setVisible ] = React.useState(false);

    React.useEffect(()=>{
        setVisible(!document.hidden);

        const onVisibilityChange = ()=>
        {
            setVisible(!document.hidden);
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return ()=>
        {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    return visible;
};

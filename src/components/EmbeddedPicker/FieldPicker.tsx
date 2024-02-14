import React from 'react';
import Typography from '@mui/material/Typography';
import { elementIsEnabledInput } from '../../classes/Constants';
import usePrevious from '../Hooks/Previous';

export interface IProps
{
    description: string|JSX.Element;
    onPicked: (field: HTMLInputElement)=>void;
    /** Fields that cannot be selected */
    ignoreFields?: HTMLInputElement[];
}

const inputHoveredClass = 'CKP-inputHovered';

export const FieldPicker: React.FC<IProps> = (props)=>
{
    const [hoveringInput, setHoveringInput] = React.useState<HTMLInputElement>();
    const prevHoveringInput = usePrevious(hoveringInput);

    // The hovered input changed
    React.useEffect(()=>{
        // Removing styling from previously hovered field
        if(prevHoveringInput) prevHoveringInput.classList.remove(inputHoveredClass);
        // Add styling to hovered field
        if(hoveringInput && !props.ignoreFields?.includes(hoveringInput)) hoveringInput.classList.add(inputHoveredClass);
    }, [hoveringInput]);

    // Handle hover effect
    const onMouseOver = React.useCallback((ev: MouseEvent)=>{
        setHoveringInput(elementIsEnabledInput(ev.target as HTMLElement));
    }, []);
    React.useEffect(()=>{
        document.addEventListener('mouseover', onMouseOver);
        return ()=>document.removeEventListener('mouseover', onMouseOver);
    }, []);

    // Handle field selection
    const onMouseDown = React.useCallback((ev: MouseEvent)=>{
        const textInput = elementIsEnabledInput(ev.target as HTMLElement);
        if(textInput && !props.ignoreFields?.includes(textInput))
        {
            ev.preventDefault();
            ev.stopPropagation();
            textInput.classList.remove(inputHoveredClass);
            props.onPicked(textInput);
        }
    }, [props.onPicked, props.ignoreFields]);
    React.useEffect(()=>{
        document.addEventListener('mousedown', onMouseDown);
        return ()=>document.removeEventListener('mousedown', onMouseDown);
    }, [props.onPicked]);

    return (<>
        <Typography>{props.description}</Typography>
    </>);
};

import React from 'react';
import { createRoot } from 'react-dom/client';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Picker, { IProps as IPickerProps } from './Picker/Picker';
import Wrapper from './Wrapper';
import Box from '@mui/material/Box';

export interface IProps
{
    credentials: IPickerProps['credentials'];
    onSelect: IPickerProps['onSelect'];
}

const PopupContainer = styled(Box)(({ theme })=>({
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
}));

/**
 * We use this, because useRef will not trigger a re-render when it's changed
 * @returns [input element, ref callback]
 */
const useInputRef = (): [HTMLInputElement|undefined, (el: HTMLInputElement)=>void] =>
{
    const [input, setInput] = React.useState<HTMLInputElement>();

    const ref = React.useCallback((element: HTMLInputElement)=>{
        if(element)
            setInput(element);
    }, []);

    return [input, ref];
};

const Popup: React.FC<IProps> = (props)=>
{
    const [input, inputRef] = useInputRef();

    return (<Wrapper>
        <PopupContainer>
            <Box sx={{m: 1}}>
                <TextField
                    variant='standard'
                    label='Filter'
                    inputRef={inputRef}
                    autoFocus
                    fullWidth
                />
            </Box>

            <Picker
                filterInput={input}
                credentials={props.credentials}
                onSelect={props.onSelect}
            />
        </PopupContainer>
    </Wrapper>);
};

/**
 * Mount component into HTMLElement
 * @param container Element to mount in
 * @param props Popup props
 * @returns Function to unmount the component
 */
export const mount = (container: HTMLElement, props: IProps): ()=>void =>
{
    const reactContainer = createRoot(container);
    reactContainer.render(<Popup {...props} />);

    return reactContainer.unmount;
};

export default Popup;

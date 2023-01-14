import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FilledInput from '@mui/material/FilledInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const IFrameInfoContainer = styled(Box)(({ theme })=>({
    textAlign: 'center',
    lineHeight: '18px',
    padding: 5,
    maxHeight: 400,
}));

const IFrameInfo: React.FC = ()=>
{
    if(self === top) return null; // We're NOT in an IFrame

    const inputRef = React.useRef<HTMLInputElement>(null);
    const [copiedTooltipOpen, setCopiedTooltipOpen] = React.useState(false);

    const copyUrl = async ()=>
    {
        try { // Try the clipboard API
            await navigator.clipboard?.writeText(inputRef.current?.value!);
            setCopiedTooltipOpen(true);
        } catch(error) { // No clipboard API? We use the execCommand
            inputRef.current?.select();
            const success = document.execCommand('copy');
            setCopiedTooltipOpen(success);
        }
    };

    return (<IFrameInfoContainer>
        <Box>This input is part of a website that is embedded into the current website.<br />Your passwords should be registered with the following URL:</Box>
        <FormControl sx={{width: '100%'}} variant='filled' hiddenLabel>
            <FilledInput
                inputRef={inputRef}
                size='small'
                value={self.location.origin}
                onFocus={ev=>ev.currentTarget.select()}
                endAdornment={
                    <InputAdornment position='end'>
                        <ClickAwayListener onClickAway={()=>setCopiedTooltipOpen(false)}>
                            <Tooltip
                                PopperProps={{disablePortal: true}}
                                onClose={()=>setCopiedTooltipOpen(false)}
                                open={copiedTooltipOpen}
                                title='Copied to clipboard'
                                disableFocusListener
                                disableHoverListener
                                disableTouchListener
                            >
                                <IconButton
                                    onClick={()=>copyUrl()}
                                    edge='end'
                                >
                                    <ContentCopyIcon />
                                </IconButton>
                            </Tooltip>
                        </ClickAwayListener>
                    </InputAdornment>
                }
            />
        </FormControl>
    </IFrameInfoContainer>);
};

export default IFrameInfo;

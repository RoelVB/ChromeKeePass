import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import * as IMessage from "../../IMessage";

export interface IProps
{
    isSelected: boolean;
    credential: IMessage.Credential;
    onSelect: (cred: IMessage.Credential)=>void;
}

const ItemContainer = styled(Box)<{isSelected?: boolean}>(({ theme, isSelected })=>({
    padding: 3,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    cursor: 'pointer',
    overflowX: 'hidden',
    div: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        lineHeight: 'normal',
    },
    ...isSelected?{
        backgroundImage: `linear-gradient(to right, ${theme.palette.secondary.light}, ${theme.palette.primary.light})`,
    }:{},
    '&:hover': {
        backgroundImage: `linear-gradient(to right, ${theme.palette.secondary.light}, ${theme.palette.primary.light})`,
    },
}));

const DropdownItem: React.FC<IProps> = (props)=>
{
    const itemContainer = React.useRef<HTMLDivElement>();

    // Make sure the selected item is visible (for when the user selects an item using arrow keys)
    React.useEffect(()=>{
        if(props.isSelected && itemContainer.current)
            itemContainer.current?.scrollIntoView({behavior: 'smooth'});
    }, [props.isSelected])

    return (<ItemContainer
        ref={itemContainer}
        tabIndex={0}
        isSelected={props.isSelected}
        onClick={()=>props.onSelect(props.credential)}
    >
        <Typography component='div' sx={{fontWeight: 'bold'}}>{props.credential.title}</Typography>
        <Typography component='div' variant='caption'>{props.credential.username}</Typography>
    </ItemContainer>);
};

export default DropdownItem;

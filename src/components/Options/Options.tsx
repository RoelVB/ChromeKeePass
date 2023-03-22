import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from '../redux/Store';
import { loadSettings } from '../redux/Settings';
import Box from '@mui/material/Box';
import PageHeader from './PageHeader';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Grid, { GridProps } from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import { ExtensionName } from '../../classes/Constants';
import Connection from './Connection';
import Wrapper from '../Wrapper';
import Behaviour from './Behaviour';
import Appearance from './Appearance';

export interface IProps
{
    
}

export const PaperGrid: React.FC<React.PropsWithChildren<{gridProps?: GridProps}>> = (props)=>
{
    const isLoading = useAppSelector(state=>state.settings.isLoading);

    if(isLoading)
        return (<Skeleton sx={{minHeight: 48}} />)
    else
    {
        return (<Paper>
            <Grid container sx={{minHeight: 48, p: 2}} {...props.gridProps}>
                {props.children}
            </Grid>
        </Paper>);
    }
};

const Options: React.FC<IProps> = (props)=>
{
    const [selectedTab, setSelectedTab] = React.useState<'connection'|'behaviour'>('connection');
    const errorMessage = useAppSelector(state=>state.settings.errorMessage);
    const dispatch = useAppDispatch();

    React.useEffect(()=>{
        // Update the page title (for Edge users)
        document.title = ExtensionName;

        // Load settings
        dispatch(loadSettings());
    }, []);

    return (<Wrapper sx={{minHeight: '100vh'}}>
        <PageHeader />

        <Container sx={{mt: 2}}>
            {errorMessage !== undefined ?
                <Alert>{errorMessage || 'An unknown error occured'}</Alert>
            : null}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selectedTab} onChange={(ev,val)=>setSelectedTab(val)}>
                    <Tab sx={{minHeight: 'auto'}} label='Connection' icon={<ElectricalServicesIcon />} iconPosition='start' value='connection' />
                    <Tab sx={{minHeight: 'auto'}} label='Behaviour' icon={<FindInPageIcon />} iconPosition='start' value='behaviour' />
                    <Tab sx={{minHeight: 'auto'}} label='Appearance' icon={<FormatPaintIcon />} iconPosition='start' value='appearance' />
                </Tabs>
            </Box>

            <Box sx={{mt: 2}}>
                {selectedTab === 'connection' ?
                    <Connection />
                : selectedTab === 'behaviour' ?
                    <Behaviour />
                : selectedTab === 'appearance' ?
                    <Appearance />
                : null}
            </Box>
        </Container>

        <Box sx={{color: 'GrayText', textAlign: 'center', p: 2}}>
            {ExtensionName} version: {VERSION}
        </Box>
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
    reactContainer.render(<Provider store={store}>
        <Options {...props} />
    </Provider>);

    return reactContainer.unmount;
};

export default Options;

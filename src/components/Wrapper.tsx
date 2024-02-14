import React from  'react';
import { unstable_ClassNameGenerator as ClassNameGenerator } from '@mui/material/className';
import { styled, createTheme, ThemeProvider, SxProps } from '@mui/material/styles';
import Box from '@mui/material/Box';

/** Create our theme */
const ckpTheme = createTheme({
    palette: {
        // mode: window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light',
        primary: {
            main: '#5274d1',
            contrastText: 'white',
        },
        secondary: {
            main: '#dae1f5',
        },
    },
    typography: { // We need to use em instead of rem (because rem in influenced by the site's fontsize)
        h1: {fontSize: '6em'},
        h2: {fontSize: '3.75em'},
        h3: {fontSize: '3em'},
        h4: {fontSize: '2.125em'},
        h5: {fontSize: '1.5em'},
        h6: {fontSize: '1.25em'},
        subtitle1: {fontSize: '1em'},
        subtitle2: {fontSize: '0.875em'},
        body1: {fontSize: '1em'},
        body2: {fontSize: '0.875em'},
        button: {fontSize: '0.875em'},
        caption: {fontSize: '0.75em'},
        overline: {fontSize: '0.75em'},
    },
});

// Insert CKP style vars into DOM
if(!document.getElementById('CKP-vars'))
{
    const style = document.createElement('style');
    style.id = 'CKP-vars';
    style.innerHTML = `:root {
        --CKP-secondary: ${ckpTheme.palette.secondary.main};
        --CKP-primaryDark: ${ckpTheme.palette.primary.dark};
    }`;

    document.head.append(style);
}

/** Add a prefix to all MUI classes */
ClassNameGenerator.configure(componentName=>`CKP-${componentName}`);

/** Make a box that gets rid of all the page's styling */
const StyleRevert = styled(Box)(({ theme })=>({
    all: 'revert',
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.default,
    fontSize: '16px',
    textAlign: 'left',
    img: {
        all: 'revert',
    },
}));

/** Our wrapper with our theme and without the page's styling */
const Wrapper: React.FC<React.PropsWithChildren<{sx?: SxProps}>> = (props)=>(
    <ThemeProvider theme={ckpTheme}>
        <StyleRevert sx={props.sx}>
            {props.children}
        </StyleRevert>
    </ThemeProvider>
)

export default Wrapper;

## ChromeKeePass Build Instructions

1. You need to have [NodeJS](https://nodejs.org) installed

2. Run the command `npm install` in the project directory to install all dependencies

3. The build result is always in the `/dist` directory. There are three build commands:

    1. `npm run dev`: This builds the project including source maps (for easy debugging)
    2. `npm run watch`: This does the same as `dev`, but this command keeps watching for changes in source files and automatically rebuilds when a change is detected
    3. `npm run prod`: This creates a production build. This means it is minified en without source maps

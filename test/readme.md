# ChromeKeePass automated tests

CKP tests make use of a custom KeePassHttp implementation ([Mock-KeePassHttp](https://github.com/RoelVB/Mock-KeePassHttp)). 

# Run tests
To run basic tests, just run `npm test`

## Site specific tests
You can also run site specific tests (found in the `test/sites` folder) by running `npm run test:all`

### Limit site specific tests
It's also possible to only run certain site specific tests and/or skip the standard tests:
`npm test -- --skipStandard --includeSites=Google,Microsoft`
> The included site name should match the filename, so "Google" means it will run `test/sites/Google.ts`

### Define logins
Logins are defined in environment variables (you can also put them in a `.env` file in the projects root).

Logins will have to be defined like:
```
TESTSITE_GOOGLE={"username":"gmail@gmail.com","password":"Welcome01","url":"https://accounts.google.com"}
```
The variable name will always have to start with `TESTSITE_`.

# Run test webserver
You can run the test webserver locally with the command `npm run test:webserver`. This will offer some different basic webpages to manually test during development.

## Change the port
By default the webserver will run on port `8080`. You can change this by adding a `--port=1234` argument to the command, example: `npm run test:webserver -- --port=1234` will make it use port 1234.

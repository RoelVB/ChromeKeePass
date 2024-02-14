import http from 'http';
import fs from 'fs';
import Setup, { ILogin } from 'mock-keepasshttp/src/server/setup';

export type Request = http.IncomingMessage;
export type Response = http.ServerResponse<http.IncomingMessage> & {req: http.IncomingMessage};

export default class Webserver
{
    #server: http.Server;
    #validLogins: ILogin[] = [];

    static start(...args: ConstructorParameters<typeof Webserver>): Promise<Webserver>
    {
        return new Webserver(...args).#start();
    }

    constructor(public readonly port: number = 8080)
    {
        this.#server = http.createServer(this.#listener.bind(this));
    }

    async #start(): Promise<Webserver>
    {
        // Start the webserver
        return new Promise<Webserver>((resolve, reject)=>{
            const server = this.#server.listen(this.port);
            server.on('listening', ()=>{
                resolve(this);
            });
            server.on('error', reject);
        });
    }

    stop()
    {
        this.#server.close();
    }

    getUrl(type: 'Default'|'HiddenPassword'|'PasswordOnly'|'HiddenForm'|'GeneratedForm'|'TextOnly' = 'Default'): string
    {
        return `http://localhost:${this.port}/login${type}.html`;
    }

    get urlBasicAuth(): string
    {
        return `http://dummyuser@localhost:${this.port}/basic`;
    }

    /**
     * Set available logins
     * @param count Number of logins to add
     * @param validLogins Array of valid login indexes (undefined = everything is valid)
     * @param additionalLogins Add custom logins
     */
    setLogins(count: number, validLogins?: number[], additionalLogins?: ILogin[])
    {
        // Generate `count` logins
        const generatedLogins: ILogin[] = Array.from({length: count}).map((val,i)=>({
            uuid: `ws${i}`, name: `Webserverlogin ${i}`, username: `testuser${i}`, password: `P@ssword${i}`,
        }));

        if(additionalLogins?.length)
            generatedLogins.push(...additionalLogins);

        // Add logins to KeePassHttp
        Setup.addLogins([{
            url: this.getUrl(),
            logins: generatedLogins,
        }]);

        // Set valid logins
        if(validLogins)
            this.#validLogins = generatedLogins.filter((login,i)=>validLogins.includes(i));
        else
            this.#validLogins = generatedLogins;
    }

    #validateLogin(username: string, password: string): boolean
    {
        return this.#validLogins.some(login=>(login.username === username && login.password === password));
    }

    async #listener(req: Request, res: Response)
    {
        if(req.url === '/basic') // Basic auth test
        {
            if(req.headers.authorization && req.headers.authorization.startsWith('Basic '))
            {
                const [username, password] = Buffer.from(req.headers.authorization.substring(6), 'base64').toString().split(':');
                if(this.#validateLogin(username, password))
                {
                    res.end('Login successful');
                    return;
                }
            }
            
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Please login"');
            res.end('Unauthorized');
        }
        else // Return our login page
        {
            if(req.method === 'POST')
            {
                const params = new URLSearchParams(await this.#getRequestBody(req));
                if(this.#validateLogin(params.get('username') || '', params.get('password')!))
                    res.end('Login successful');
                else
                {
                    res.statusCode = 401;
                    res.end('Invalid login');
                }
            }
            else
            {
                const file = `./test/assets${req.url}`;
                if(fs.existsSync(file))
                    res.end(fs.readFileSync(file).toString('utf8'));
                else
                {
                    res.statusCode = 404;
                    res.end('Page not found');
                }
            }
        }
    }

    #getRequestBody(req: Request): Promise<string>
    {
        return new Promise<string>((resolve, reject)=>{
            let body = '';
            req.on('data', data=>body+=data);
            req.on('end', ()=>{
                resolve(body);
            });
            req.on('error', error=>{
                reject(error);
            });
        });
    }

}

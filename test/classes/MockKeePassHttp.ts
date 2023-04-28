import { Server, setLogger, Setup } from 'mock-keepasshttp/src';
import Env from './Env';

export default class MockKeePassHttp
{
    static kphPort = 1337;
    static #server: Server;

    static start(): Promise<void>
    {
        setLogger((level, msg, ...optionalParams)=>{
            // Ignore logging
        });
        this.#server = new Server(this.kphPort);
        return this.#server.start();
    }

    static close()
    {
        this.#server.stop();
    }

    static async autoSetup()
    {
        const logins = Env.getLogins();

        Setup.clear();
        Setup.addLogins(logins);
    }
}

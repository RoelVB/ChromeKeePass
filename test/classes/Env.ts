require('dotenv').config();
import type { ISetupLogins } from 'mock-keepasshttp/src/server/setup';

export default class Env
{
    static getLogins(): ISetupLogins[]
    {
        const output: ISetupLogins[] = [];

        for(const key in process.env)
        {
            if(key.startsWith('TESTSITE_'))
            {
                try {
                    const json: {username?: string, password?: string, url?: string} = JSON.parse(process.env[key]!);
                    if(json.username && json.password && json.url)
                    {
                        output.push({
                            url: json.url,
                            logins: [{
                                username: json.username,
                                password: json.password,
                                name: `${key.substring(9)} | ${json.username}`,
                                uuid: key.substring(9),
                            }],
                        });
                    }
                } catch(error) {
                    // ENV var is probably invalid JSON
                }
            }
        }

        return output;
    }
}

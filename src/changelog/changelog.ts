
export interface IChangelog
{
    versions: {
        version: `2.${number}.${number}`|'current',
        changes: {
            type: 'fix'|'new'|'improvement',
            description: string;
        }[];
    }[];
}

import changelog from './changelog.json';
export default changelog as IChangelog;

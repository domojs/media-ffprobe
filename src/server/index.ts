import * as akala from '@akala/server';
import { Client, Connection } from '@akala/json-rpc-ws';
import { scrapper, Media } from '@domojs/media';
import { scrapper as ffprobe } from './scrapper';
export * from './scrapper';

akala.injectWithNameAsync(['$isModule', '$agent.api/@domojs/media'], function (isModule: akala.worker.IsModule, client: Client<Connection>)
{
    if (isModule('@domojs/media-ffprobe'))
    {
        var s = akala.api.jsonrpcws(scrapper).createClient(client, {
            scrap: function (media: Media)
            {
                return ffprobe(media).then(() =>
                {
                    return media;
                });
            }
        }).$proxy();
        s.register({ type: 'video', priority: 20 });
    }
});
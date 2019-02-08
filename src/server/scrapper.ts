import * as akala from '@akala/server';
import * as path from 'path';
import * as ffbinaries from 'ffbinaries';
import { Media } from '@domojs/media';
import * as jsons from 'JSONStream';
import bl = require('bl');
import { spawn } from 'child_process';

const log = akala.log('domojs:media:ffprobe');

function ffprobe(filePath, opts)
{
    var params = [];
    params.push('-show_streams', '-show_chapters', '-show_format', '-print_format', 'json', filePath);

    var info;
    var stderr;

    return new Promise<any>((resolve, reject) =>
    {
        var ffprobe = spawn(opts.path, params);
        ffprobe.once('close', function (code)
        {
            if (!code)
            {
                resolve(info);
            } else
            {
                var err = stderr.split('\n').filter(Boolean).pop();
                reject(new Error(err));
            }
        });

        ffprobe.stderr.pipe(bl(function (err, data)
        {
            stderr = data.toString();
        }));

        ffprobe.stdout
            .pipe(jsons.parse())
            .once('data', function (data)
            {
                info = data;
            });
    });
}

var ffprobeBin = new Promise<{ path: string, found: boolean }>((resolve, reject) =>
{
    var bin = ffbinaries.locateBinariesSync('ffprobe', { paths: [path.resolve('../../', __dirname)] });
    if (!bin.ffprobe.found)
    {
        log('downloading ffprobe')
        ffbinaries.downloadBinaries(undefined, { components: ['ffprobe'], destination: path.resolve('../../', __dirname) }, function (error, result)
        {
            if (error)
                log(error);
            else
                log(result);
            bin = ffbinaries.locateBinariesSync('ffprobe', { paths: [path.resolve('../../', __dirname)] });
            if (bin.ffprobe.found)
                resolve(bin.ffprobe);
            else
                reject(JSON.stringify(bin));
        })
    }
    else
        resolve(bin.ffprobe);
});
export function scrapper(media: Media)
{
    return ffprobeBin.then(function (bin)
    {
        return new Promise((resolve, reject) =>
        {
            ffprobe(media.path, { path: bin.path }).then(function (result)
            {
                media.length = Number(result.format.duration);
                if (!media.tokens)
                    media.tokens = [];
                for (var stream of result.streams)
                {
                    if (!~media.tokens.indexOf(stream.codec_name))
                        media.tokens.push(stream.codec_name);
                    if (stream.codec_type == 'video')
                    {
                        media.type = 'video';
                        if (media.type == 'video' && result.format.duration > 4000)
                            if (!media.subType)
                                media.subType = 'movie'
                            else
                                media.subType = 'tvshow'
                    }
                }

                resolve(media);
            });
        })
    })
}
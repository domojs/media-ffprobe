import * as debug from 'debug';
debug.enable('domojs:media:ffprobe')
import { scrapper } from './scrapper';


scrapper({ path: "\\\\ana\\Dropbox\\Westworld.S02E08.VOSTFR.1080p.AMZN.WEB-DL.DDP5.1.H.264-MYSTERiON.mkv", type: 'video', id: null }).then(function (media)
{
    console.log(media);
});
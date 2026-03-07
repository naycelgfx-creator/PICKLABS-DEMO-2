const https = require('https');
const fs = require('fs');

const fetchImageInfo = (filename, outPath) => {
    const api = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${filename}&prop=imageinfo&iiprop=url&format=json`;
    https.get(api, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                const pages = parsed.query.pages;
                const pageId = Object.keys(pages)[0];
                const url = pages[pageId].imageinfo[0].url;
                console.log(`Downloading ${filename} from ${url}`);
                https.get(url, fileRes => {
                    const file = fs.createWriteStream(outPath);
                    fileRes.pipe(file);
                    file.on('finish', () => { file.close(); });
                });
            } catch (e) {
                console.error(`Failed for ${filename}`, e.message);
            }
        });
    });
};

const fetchCommonsImageInfo = (filename, outPath) => {
    const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${filename}&prop=imageinfo&iiprop=url&format=json`;
    https.get(api, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                const pages = parsed.query.pages;
                const pageId = Object.keys(pages)[0];
                const url = pages[pageId].imageinfo[0].url;
                console.log(`Downloading ${filename} from ${url}`);
                https.get(url, fileRes => {
                    const file = fs.createWriteStream(outPath);
                    fileRes.pipe(file);
                    file.on('finish', () => { file.close(); });
                });
            } catch (e) {
                console.error(`Failed for ${filename}`, e.message);
            }
        });
    });
};

fetchImageInfo('Women%27s_Tennis_Association_logo_(2020).svg', 'public/wta.svg');
fetchImageInfo('ATP_Tour_logo.svg', 'public/atp.svg');
fetchImageInfo('US_Open_(tennis)_logo.svg', 'public/us-open.svg');

fetchCommonsImageInfo('NASCAR_Cup_Series_logo.svg', 'public/nascar-cup.svg');
fetchCommonsImageInfo('NASCAR_Xfinity_Series_logo.svg', 'public/nascar-xfinity.svg');
fetchCommonsImageInfo('NASCAR_Craftsman_Truck_Series_logo.svg', 'public/nascar-truck.svg');

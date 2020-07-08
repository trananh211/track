var express = require("express");
const puppeteer = require('puppeteer');
var app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.listen(process.env.PORT || 3000);

let track = async (url) => {
    try {
        // const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        // const page = await browser.newPage();

        let browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        let page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
        await page.setViewport({width: 1920, height: 1080});
        await page.setRequestInterception(true);

        page.on('request', (req) => {
            if (req.resourceType() === 'image') {
                req.abort();
            } else {
                req.continue();
            }
        });
        await page.goto(url);
		await page.waitForSelector('.jcTrackContainer .tracklist-item');
		await page.waitFor(10000);
		await page.click(".jcTrackContainer .tracklist-item");
		
		let results = await page.evaluate(() => {
            let items = document.querySelectorAll('.jcTrackContainer .tracklist-item');
            let links = [];
            items.forEach((item) => {

                let carrier_from = "";
                try {
                    carrier_from = item.querySelector('div.from .base-info i').innerText;
                } catch (err) {}

                let carrier_to = "";
                try {
                    carrier_to = item.querySelector('div.to .base-info i').innerText;
                } catch (err) {}

                links.push({
                    title: item.querySelector('p.text-uppercase').innerText,
                    value: item.querySelector('p.text-capitalize').getAttribute('title'),
                    carrier_from: carrier_from,
                    carrier_to: carrier_to
                });
            });
            return links;
        });
        await browser.close();
        return Promise.resolve(results);
    } catch (e) {
        return Promise.reject(e);
    }
}

/*
let filter = (result) => {
    result = result.toLowerCase();
    let str = 'nothing';
    if ( result.indexOf('delivered') !== -1) {
        str = 'delivered';
    } else if ( result.indexOf('not found') !== -1) {
        str = 'not-found';
    } else if ( result.indexOf('in transit') !== -1) {
        str = 'in-transit';
    } else if ( result.indexOf('pick up') !== -1) {
        str = 'pick-up';
    } else if ( result.indexOf('undelivered') !== -1) {
        str = 'undelivered';
    } else if ( result.indexOf('alert') !== -1) {
        str = 'alert';
    } else if ( result.indexOf('expired') !== -1) {
        str = 'expired';
    }
    return str;
}
*/
// console.log(filter('Pick up'));

app.get('/', function (req, res) {
   res.render('index');
});

app.get('/api/track/:id', function (req, res) {
    var url = 'https://t.17track.net/en#nums=';
    let link = url + req.params.id;
    track(link)
        .then(rest => {
            // console.log(rest);
            res.json(rest);
        })
        .catch(err => res.send(err));
});

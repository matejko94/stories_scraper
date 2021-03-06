const puppeteer = require('puppeteer');

const n_articles = 5;

class Parse {


    constructor() {
        this.url = "https://www.cnet.com/"
    }

    /**
     * Extract all articles from first page
     * */
    extractTopArticles(page) {
        return new Promise(async (resolve, reject) => {
            try {

                await page.goto(this.url);

                page.on('console', consoleObj => console.log(consoleObj));
                let urls = await page.evaluate(() => {
                    let results = [];
                    let items = document.querySelectorAll('div.col-5');
                    items.forEach((item) => {
                        var img;
                        if (item.getElementsByTagName('img').length != 0) {
                            img = item.getElementsByTagName('img')[0].getAttribute('src')
                        }

                        results.push({
                            header: item.getElementsByTagName('a')[0].text,
                            url: item.getElementsByTagName('a')[0].href,
                            short_summary: item.getElementsByTagName('a')[1].text,
                            img: img
                        });

                    });

                    return results;
                })
                return resolve(urls);
            } catch (e) {
                return reject(e);
            }
        })
    }

    /**
     * Extract content from specific article.
     * */
    async extractContentFromArticle(page, params) {
        try {

            await page.goto(params.url);

            let urls = await page.evaluate(() => {
                let author = document.querySelector('a.author');
                let a;
                let category;
                let formattedDate;

                if (author != null) {
                    a = author.getElementsByTagName('span')[0].innerHTML;
                }

                if (document.querySelector('span.formattedDate') != null) {
                    formattedDate = document.querySelector('span.formattedDate').innerHTML;
                }

                if (document.querySelector('a.bc-2') != null) {
                    category = document.querySelector('a.bc-2').innerHTML;
                }

                let tagList;
                var array = []
                if (document.querySelector('div.tagList') != null){
                    tagList = document.querySelector('div.tagList')
                    var aType = tagList.getElementsByTagName('a');
                    if (aType != null) {
                        for (var i = 0; i < aType.length; i++) {
                            array.push(aType[i].innerHTML)
                        }
                    }
                }

                console.log(a);
                console.log(formattedDate);

                return {author: a, category: category, date: formattedDate, tag: array}
            })
            return Object.assign({}, params, urls);
        } catch (e) {
            console.log(e)
            return null;
        }

    }


    /**
     * Handle parsing and put in the proper format
     */
    async parseWebPage(callback) {
        var l = []
        const browser = await puppeteer.launch({devtools: true});
        const page = await browser.newPage();

        var t = this;
        t.extractTopArticles(page).then(async function (results) {
            let topArticles = n_articles;
            if (results.length < n_articles) {
                topArticles = results.length;
            }

            for (var i = 0; i < topArticles; i++) { //TODO should be changed and chacked
                console.log(results[i])
                let data = await t.extractContentFromArticle(page, results[i])
                l.push(data)
            }
            browser.close();
            callback(l, null);

            },
            function (error) {
                console.log(error)
                callback(null, error);
            })

    }

}

exports.Parse = Parse
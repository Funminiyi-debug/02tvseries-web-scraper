const log = string => console.log(string);
const puppeteer = require("puppeteer");
const allHDLinks = [];

const downloadSeason1 = async (
  season,
  getHrefs,
  navigateToList,
  seasonDetails
) => {
  const site = season.link;
  // try {
  const launchConfig = { headless: false };
  // const site = inputtedLink;
  const gotoConfig = {
    waitUntil: "networkidle2",
    timeout: 0,
  };

  //   ALL FUNCTIONS

  const getAllEpisodes = async site => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const allEpisodes = [];
    let pageExist = false;
    let otherPages;
    log("Entering the season page");
    await page.goto(site, gotoConfig);
    log("waiting for selector");
    page.waitForSelector(".data a");
    await page
      .waitForSelector(".pagination a")
      .then(() => {
        pageExist = true;
        log("pagination selector found");
      })
      .catch(err => {
        log(" pagination not found ");
        otherPages = [];
      });
    // getting the pages
    if (pageExist) {
      log("conditional ran");
      const pages = await page.evaluate(() => {
        const selectors = document.querySelectorAll(".pagination a");
        return Array.from(selectors).map(selector => selector.href);
      });

      const otherPagePromises = pages.map(async item => {
        const items = await navigateToList(item);
        return items;
      });
      otherPages = Promise.all(otherPagePromises);
    }

    log("getting links for all episodes in page1");
    const FirstPage = await page.evaluate(getHrefs);
    await browser.close();
    return { FirstPage, otherPages };
  };

  //   // TO DOWNLOAD AN EPISODE
  const navigateToEpisode = async episode => {
    const allLinks = await navigateToList(episode.link);
    // log(allLinks.link);
    const HDLink = await allLinks[1].link;
    return { episode: episode.episode, link: HDLink };
  };

  // THE REAL CODE
  const allPagesEpisodes = await getAllEpisodes(site);
  const firstPage = await allPagesEpisodes.FirstPage;
  const otherPages = await allPagesEpisodes.otherPages;

  const flattenArray = (array1, array2) => {
    const general = [...array2, ...array1];
    const flattenedGeneral = general.flat(Infinity);
    return flattenedGeneral;
  };
  const episodes = flattenArray(firstPage, otherPages);
  seasonDetails.noOfEpisodes = episodes.length;
  const HDLinkPromises = episodes.map(async episode => {
    return navigateToEpisode(episode);
  });
  const everything = await Promise.all(HDLinkPromises);
  log(everything);
  return everything;
};

module.exports = downloadSeason1;

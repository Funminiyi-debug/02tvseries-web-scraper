const puppeteer = require("puppeteer");
const downloadSeason1 = require("./downloadSeason");
const log = string => console.log(string);

// let searchSeries = `sons of anarchy`;

const gotoConfig = {
  waitUntil: "networkidle2",
  timeout: 0,
};

const launchConfig = { headless: false };
// TO GET REFS OF ALL EPISODES OR FORMAT
const getHrefs = () => {
  const episodes = document.querySelectorAll(".data a");
  const items = Array.from(episodes).map(episode => {
    return { episode: episode.innerHTML, link: episode.href };
  });
  return items;
};

// navigate to list
const navigateToList = async site => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(site, gotoConfig);
    log(`waiting for selector`);
    await page
      .waitForSelector(".data a")
      .then(() => log(`selector ".data a" found`))
      .catch(err => log(err));

    const results = await page.evaluate(() => {
      const selectors = document.querySelectorAll(".data a");
      const items = Array.from(selectors).map(selector => {
        return { link: selector.href, episode: selector.innerHTML };
      });
      return items;
    });

    await browser.close();
    return results;
  } catch (error) {
    log(error);
    process.exit(1);
  }
};

// LIST ALL SERIES ON 02TV
const listSeriesAndGenres = async () => {
  // get link
  const getLinksToSeriesAndGenres = async () => {
    const link = `https://o2tvseries.com/`;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    try {
      log(`entering o2tvseries.com`);
      await page.goto(link, gotoConfig);
    } catch (error) {
      log(error);
      process.exit(1);
    }

    const selector = ".top_bar a";

    log(`waiting for selectors`);
    await page
      .waitForSelector(selector)
      .then(() => log(`selector found`))
      .catch(err => log(err));

    const topBarLinks = await page.evaluate(() => {
      const topBarLinksSelector = document.querySelectorAll(`.top_bar a`);
      return Array.from(topBarLinksSelector).map(item => item.href);
    });

    await browser.close();
    log(`top bar links obtained`);
    return topBarLinks;
  };

  const topBarLinks = await getLinksToSeriesAndGenres();
  const linkToAllSeries = topBarLinks[1];
  const linkToAllGenres = topBarLinks[2];

  log(`getting all series `);
  const allSeries = await navigateToList(linkToAllSeries);
  // log(`getting all genres `);
  // const { text: allGenres } = await navigateToList(linkToAllGenres);

  return {
    allSeries: allSeries,
    // allGenres: allGenres,
  };
};

// to navigate to season
const navigateToSeason = async site => {
  const allSeasons = await navigateToList(site);
  return allSeasons;
};

// MAIN FUNCTION RUNNER
const search = async (searchSeries, allSeries) => {
  if (allSeries.length <= 0) {
    allSeries = await listSeriesAndGenres();
  }
  const capitalizedSearchTerm = string => {
    const words = string.toLowerCase().trim().split(" ");
    const capitalized = words
      .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(" ");
    return capitalized;
  };
  searchSeries = capitalizedSearchTerm(searchSeries);
  const getSerieRef = () => {
    const item = allSeries.find(member => {
      if (capitalizedSearchTerm(member.episode) === searchSeries) return member;
    });
    if (!item) return undefined;
    log(item);
    return item.link;
  };
  const valueToTest = await getSerieRef();
  if (valueToTest === undefined) {
    log(`${searchSeries} not found!!!!`);
    return;
  }
  // const genreRef = `https://o2tvseries.com/search/genre/${genreTest
  //   .split(" ")
  //   .join("-")}`;
  log(`getting all seasons to ${searchSeries}`);
  const allSeasons = await navigateToSeason(valueToTest);
  return { allSeasons };
};

const downloadSeason = async season => {
  const seasonDetails = {
    season: "",
    noOfEpisodes: "",
  };
  seasonDetails.season = season;

  log(seasonDetails);
  const episodes = await downloadSeason1(
    season,
    getHrefs,
    navigateToList,
    seasonDetails
  );
  seasonDetails.episodes = episodes;
  log(episodes);
  return { episodes };
};
exports.downloadSeason = downloadSeason;
exports.search = search;
exports.listSeriesAndGenres = listSeriesAndGenres;
// MAIN JS HAS
// downloadSeason
// search series
// listAllSeriesAndGenres

import Axios from "axios";
const INDEXER = "https://api.thegraph.com/subgraphs/name/rolliq/rolliq";
function createFakeGraphData(numberOfDay) {
  let fakeData = [];

  for (let i = 0; i < numberOfDay; i++) {
    let date = new Date();
    date.setDate(date.getDate() - numberOfDay + i);
    fakeData.push({
      TVLChange: Math.floor(Math.random() * 100000),
      id: i,
      lastGoodPrice: Math.random() * 100 + 1700,
      isTVLChangeNegative: Math.random() < 0.5,
      thisDayGainsFromStaking: Math.floor(Math.random() * 100000),
      thisDayGainsFromSupplying: Math.floor(Math.random() * 100000),
      thisDayRUSDBorrowed: Math.floor(Math.random() * 100000),
      thisDayValueLocked: Math.floor(Math.random() * 100000),
      thisDayTroveCount: Math.floor(Math.random() * 1000),
      date: date.getMonth() + 1 + "/" + date.getDate(),
    });
  }
  fakeData = fakeData.map((el) => {
    return {
      ...el,
      TVLChange: el.isTVLChangeNegative ? -el.TVLChange : el.TVLChange,
      thisDayValueLockedInUsd: el.lastGoodPrice * el.thisDayValueLocked,
      thisDayGainsFromStakingInUsd:
        el.lastGoodPrice * el.thisDayGainsFromStaking,
      thisDayGainsFromSupplyingInUsd:
        el.lastGoodPrice * el.thisDayGainsFromSupplying,
    };
  });
  return fakeData;
}
async function getAllData() {
  let data = JSON.stringify({
    query: `
    query MyQuery {
      dailyUpdates{
        TVLChange
        id
        isTVLChangeNegative
        thisDayGainsFromStaking
        thisDayGainsFromSupplying
        thisDayRUSDBorrowed
        thisDayValueLocked
        thisDayTroveCount
      }
    }
    `,
    variables: {},
  });

  const json = await Axios.post(INDEXER, data).catch((error) => error.response);
  return json.data.data.dailyUpdates;
}
async function getDataForLastNDays(numberOfDay) {
  let data = JSON.stringify({
    query: `
    query MyQuery($numberOfDay : Int) {
      dailyUpdates(first: $numberOfDay,orderBy: id, orderDirection: desc) {
        TVLChange
        id
        isTVLChangeNegative
        thisDayGainsFromStaking
        thisDayGainsFromSupplying
        thisDayRUSDBorrowed
        thisDayValueLocked
        thisDayTroveCount
      }
    }
    `,
    variables: {
      numberOfDay,
    },
  });

  const json = await Axios.post(INDEXER, data).catch((error) => error.response);
  return json.data.data.dailyUpdates.reverse();
}
export default {
  createFakeGraphData,
  getAllData,
  getDataForLastNDays,
};

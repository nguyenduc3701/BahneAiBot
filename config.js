const questionTypes = {
  IS_PLAY_GAME: "isPlayGame",
  IS_WATCH_ADS: "isWatchAds",
  IS_DO_TASK: "isDoTask",
  IS_DAILY_CLAIM: "isDailyClaim",
  IS_AUTO_UPGRADE_GAME_RESOURCE: "isAutoUpgradeGameResource",
};

const METHOD = {
  GET: "get",
  POST: "post",
  PUT: "put",
  PATCH: "patch",
  DELETE: "delete",
};

const questions = [
  {
    type: questionTypes.IS_DAILY_CLAIM,
    question: "Do you want to claim daily?(y/n): ",
  },
  {
    type: questionTypes.IS_DO_TASK,
    question: "Do you want to do task?(y/n): ",
  },
  {
    type: questionTypes.IS_WATCH_ADS,
    question: "Do you want to watch ads?(y/n): ",
  },
  {
    type: questionTypes.IS_PLAY_GAME,
    question: "Do you want to play game?(y/n): ",
  },
  {
    type: questionTypes.IS_AUTO_UPGRADE_GAME_RESOURCE,
    question: "Do you want auto upgrade game resource?(y/n): ",
  },
];

const BalanceToUpgrade = 10000000;
const ToolName = "Bahne Ai";

module.exports = {
  questions,
  questionTypes,
  ToolName,
  METHOD,
  BalanceToUpgrade,
};

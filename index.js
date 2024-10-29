const colors = require("colors");
const { questions, ToolName, METHOD, BalanceToUpgrade } = require("./config");

const BaseRoot = require("./ultils");

class Tools extends BaseRoot {
  constructor() {
    super();
    this.toolsName = ToolName || "";
    this.version = "0.1.1";
    this.waitingTime = 0;
    this.waitingEnergyTime = null;
    this.waitingAds75k = null;
    this.userInfo = null;
    this.waitingClaimTime = null;
    this.socialsJoined = [];
    this.softWares = [];
    this.settings = null;
    this.syncInfo = null;
    this.clans = [];
    this.questionStatuses = {
      isPlayGame: false,
      isWatchAds: false,
      isDoTask: false,
      isDailyClaim: false,
      isAutoUpgradeGameResource: false,
    };
  }

  renderQuestions = async () => {
    for (let i = 0; i < questions.length; i++) {
      const questionAnswer = await this.askQuestion(questions[i].question);
      this.questionStatuses[questions[i].type] =
        questionAnswer.toLowerCase() === "y" ?? true;
    }
  };

  addingWaitingTime = (extraTime) => {
    if (this.waitingTime < extraTime) {
      this.waitingTime = this.waitingTime + (extraTime - this.waitingTime);
    }
  };

  processAccount = async (queryId, dataUser) => {
    this.log(colors.yellow(`====== [Process Account] ======`));
    const token = await this.login(queryId, dataUser);
    await this.sleep(1000);
    if (token) {
      await this.startEarning();
      await this.sleep(1000);
      await this.buildHeader({ "Sec-Fetch-Site": "same-site" }, [
        "Sec-Fetch-Site",
      ]);
      await this.sleep(1000);
      await this.joinClan();
      await this.sleep(1000);
      if (
        this.questionStatuses.isDoTask ||
        this.questionStatuses.isDailyClaim
      ) {
        await this.dailyCheckInClaim();
        await this.sleep(1000);
      }
      if (this.questionStatuses.isDoTask) {
        await this.resolveTask(queryId, dataUser, token);
        await this.sleep(1000);
      }
      if (this.questionStatuses.isDailyClaim) {
        await this.farmingClaim(queryId, dataUser, token);
        await this.sleep(1000);
      }
      if (this.questionStatuses.isPlayGame) {
        await this.playGame(queryId, dataUser, token);
        await this.sleep(1000);
      }
      if (this.questionStatuses.isWatchAds) {
        await this.watchAds(queryId, dataUser, token);
        await this.sleep(1000);
      }
      if (this.questionStatuses.isConnectWallet) {
        await this.connectWallets(queryId, dataUser, token);
        await this.sleep(1000);
      }
      if (this.questionStatuses.isAutoUpgradeGameResource) {
        await this.upgradeResourceSoftware(queryId, dataUser, token);
        await this.sleep(1000);
      }
    }
  };

  login = async (queryId, dataUser) => {
    this.log(colors.yellow(`====== [Login] ======`));
    const loginHeader = this.buildHeaderBahne();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.bahne.ai/api/users/${dataUser.id}`,
        null,
        loginHeader
      );

      if (response && response.data.success) {
        this.log(colors.green(`\Login Bahne Ai Succesfully!`));
        if (response.data.user) {
          this.userInfo = response.data.user;
          this.socialsJoined = response.data.user.socialsJoined;
          this.softWares = response.data.user.software;
        }
        return response.data.user;
      }
    } catch (error) {
      this.log(colors.red(`Fail to login Bahne Ai!`));
      return;
    }
  };

  startEarning = async () => {
    this.log(colors.yellow(`====== [Start Earning] ======`));
    await this.getSyncInformation();
    await this.sleep(1000);
    if (!this.syncInfo) {
      this.log(colors.red(`Not found sync information!`));
      return;
    }
    const header = this.getHeader();
    const request = {
      userid: this.userInfo._id,
      balance: this.syncInfo.balance,
      todayEarnings: this.syncInfo.todayEarnings,
      lastActivityTime: new Date().valueOf(),
      isEarningActive: true,
      dailyEarnings: this.syncInfo.dailyEarnings,
      spins: this.syncInfo.spins,
      usdt: this.syncInfo.usdt,
      tons: this.syncInfo.tons,
      prevReferrals: this.syncInfo.prevReferrals,
    };
    try {
      const response = await this.callApi(
        METHOD.POST,
        "https://bahne.zapto.org/syncLocalStorage",
        request,
        header
      );
      if (response && response.data.message) {
        this.log(colors.green(response.data.message));
      } else {
        this.log(colors.red(`Fail to start earning!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to start earning!`));
    }
  };

  getSyncInformation = async () => {
    const header = this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://bahne.zapto.org/syncLocalStorage?name=${this.userInfo._id}`,
        null,
        header
      );
      if (response && response.data) {
        this.log(colors.green("Get sync information successfully!"));
        this.syncInfo = response.data;
      } else {
        this.log(colors.red("Fail to get sync information!"));
      }
    } catch (error) {
      this.log(colors.red("Fail to get sync information!"));
    }
  };

  joinClan = async () => {
    this.log(colors.yellow(`====== [Join Clan] ======`));
    await this.sleep(1000);
    const isJoined = await this.getUserClanInfo();
    await this.sleep(1000);
    if (isJoined) {
      return;
    }
    await this.getListClans();
    await this.sleep(1000);
    let idxClan = 0;
    let retries = 3;
    while (retries > 0) {
      await this.sleep(1000);
      const choiceClan = this.clans[idxClan] || null;
      if (!choiceClan) {
        this.log(colors.red(`Not found any clan!`));
        return;
      }
      const header = this.getHeader();
      const request = { tg_id: this.userInfo.tg_id, clanId: choiceClan.clanId };
      try {
        const response = await this.callApi(
          METHOD.POST,
          `https://api.bahne.ai/api/users/clan/join`,
          request,
          header
        );
        if (response && response.data.success) {
          this.log(colors.green(`Join clan ${choiceClan.name} successfully!`));
          retries = 0;
          return;
        } else {
          this.log(colors.red(`Fail to join clan! Try other clan...`));
          idxClan = Math.floor(Math.random() * 100) + 1;
          retries = retries - 1;
        }
      } catch (error) {
        this.log(colors.red(`Fail to join clan! Try other clan...`));
        idxClan = Math.floor(Math.random() * 100) + 1;
        retries = retries - 1;
      }
    }
  };

  getListClans = async () => {
    const header = this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.bahne.ai/api/users/clan/leaderboard`,
        null,
        header
      );
      if (response && response.data.success) {
        this.log(colors.green(`Get clan list information successfully!`));
        if (response.data.clans) {
          this.clans = response.data.clans;
        }
      } else {
        this.log(colors.red(`Fail to join clan!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to join clan!`));
    }
  };

  getUserClanInfo = async () => {
    const header = this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.bahne.ai/api/users/clan/${this.userInfo._id}`,
        null,
        header
      );
      if (response && response.data.success) {
        this.log(colors.green(`User already joined clan!`));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  dailyCheckInClaim = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Daily Checkin Claim] ======`));
    const header = this.getHeader();
    const request = {
      tg_id: this.userInfo.tg_id,
      index: this.userInfo.streak - 1,
    };
    try {
      const response = await this.callApi(
        METHOD.POST,
        "https://api.bahne.ai/api/users/claimDailyReward",
        request,
        header
      );
      if (response && response.data.success) {
        this.log(colors.green(`${response.data.message}`));
        if (response.data.user) {
          this.userInfo = response.data.user;
        }
      } else {
        this.log(colors.red(`Fail to claim daily reward!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to claim daily reward!`));
    }
  };

  watchAds = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Watch Ads] ======`));
    await this.claimWatchAds50K(dataUser);
    await this.sleep(1000);
    await this.claimWatchAds75K(dataUser);
  };

  claimWatchAds50K = async (dataUser) => {
    this.log(colors.yellow(`====== [Watch Ads 50k] ======`));
    const header = this.getHeader();
    const request = { coinBalance: this.userInfo.coinBalance + 50000 };
    try {
      const response = await this.callApi(
        METHOD.PUT,
        `https://api.bahne.ai/api/users/${dataUser.id}`,
        request,
        header
      );
      if (response && response.data.success) {
        this.log(colors.green(`User claimed watch ads 50k successfully.`));
        if (response.data.user) {
          this.userInfo = response.data.user;
        }
      } else {
        this.log(colors.red(`Fail to claim watch ads 50k!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to claim watch ads 50k!`));
    }
    this.addingWaitingTime(60);
  };

  claimWatchAds75K = async (dataUser) => {
    this.log(colors.yellow(`====== [Watch Ads 75k] ======`));
    if (this.waitingAds75k && this.waitingAds75k > new Date()) {
      this.log(colors.red(`Not time to claim watch ads 75k yet.`));
      return;
    }
    const header = this.getHeader();
    const request = { coinBalance: this.userInfo.coinBalance + 75000 };
    try {
      const response = await this.callApi(
        METHOD.PUT,
        `https://api.bahne.ai/api/users/${dataUser.id}`,
        request,
        header
      );
      if (response && response.data.success) {
        this.log(colors.green(`User claimed watch ads 75k successfully.`));
        if (response.data.user) {
          this.userInfo = response.data.user;
        }
        if (!this.waitingAds75k) {
          this.log(colors.cyan(`Wait 3 minutes to watch ads 75k again.`));
          this.waitingAds75k = this.addSecondsToDatetime(new Date(), 3 * 60);
        }
        if (this.waitingAds75k && this.waitingAds75k < new Date()) {
          this.waitingAds75k = null;
        }
      } else {
        this.log(colors.red(`Fail to claim watch ads 75k!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to claim watch ads 75k!`));
    }
    this.addingWaitingTime(3 * 60);
  };

  farmingClaim = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Farm Claim] ======`));
    const header = this.getHeader();
    const dailyClaim = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
    const request = {
      coinBalance: this.userInfo.coinBalance + dailyClaim,
      dailyCoinBalance: this.userInfo.dailyCoinBalance + dailyClaim,
      weeklyCoinBalance: this.userInfo.weeklyCoinBalance + dailyClaim,
      overallCoinBalance: this.userInfo.overallCoinBalance + dailyClaim,
      claimableMineReward: this.userInfo.claimableMineReward,
    };
    try {
      const response = await this.callApi(
        METHOD.PUT,
        `https://api.bahne.ai/api/users/${dataUser.id}`,
        request,
        header
      );
      if (response && response.data.success) {
        this.log(colors.green(`Claim daily successfully!`));
        if (response.data.user) {
          this.userInfo = response.data.user;
        }
      } else {
        this.log(colors.red(`Fail to claim daily!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to claim daily!`));
    }
  };

  updateEnergyNumber = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Update Energy] ======`));
    const header = this.getHeader();
    const request = {
      coinBalance: this.userInfo.coinBalance,
      weeklyCoinBalance: this.userInfo.weeklyCoinBalance,
      dailyCoinBalance: this.userInfo.dailyCoinBalance,
      overallCoinBalance: this.userInfo.overallCoinBalance,
      energy: this.userInfo.maxEnergy,
    };
    try {
      const response = await this.callApi(
        METHOD.PUT,
        `https://api.bahne.ai/api/users/${dataUser.id}`,
        request,
        header
      );
      if (response && response.data.success) {
        this.log(colors.green(`Update energy successfully!`));
        if (response.data.user) {
          this.userInfo = response.data.user;
        }
      } else {
        this.log(colors.red(`Fail to update energy!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to update energy!`));
    }
  };

  playGame = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Play Game] ======`));
    const maxEnergy = this.userInfo.maxEnergy;
    const rechargeSpeed = this.userInfo.rechargeSpeed;
    const rechargeSeconds = rechargeSpeed * maxEnergy;

    if (this.waitingEnergyTime && this.waitingEnergyTime > new Date()) {
      this.log(colors.red(`Not enough energy to play.`));
      return;
    }
    if (
      !this.waitingEnergyTime ||
      (this.waitingEnergyTime && this.waitingEnergyTime < new Date())
    ) {
      await this.updateEnergyNumber(queryId, dataUser, token);
      this.waitingEnergyTime = null;
      await this.sleep(1000);
    }

    const header = this.getHeader();
    while (this.userInfo.energy > 100) {
      let energy = this.userInfo.energy;
      let coinBalance = this.userInfo.coinBalance;
      const multitap = this.userInfo.multitap;
      let totalTaps = this.userInfo.totalTaps;

      const usingEnergy =
        energy > 100 && energy < 300
          ? energy
          : Math.floor(Math.random() * (300 - 200 + 1)) + 200;
      const earningPerTap = usingEnergy * multitap;

      this.log(`========================================================`);
      this.log(colors.green(`Coin Balance: ${colors.white(coinBalance)}`));
      this.log(colors.green(`Energy: ${colors.white(energy)}`));
      this.log(colors.green(`Taps: ${colors.white(usingEnergy)}`));

      try {
        const request = {
          coinBalance: coinBalance + earningPerTap,
          energy: energy - usingEnergy,
          totalTaps: totalTaps + earningPerTap,
        };

        const response = await this.callApi(
          METHOD.PUT,
          `https://api.bahne.ai/api/users/${dataUser.id}`,
          request,
          header
        );

        if (response && response.data.success) {
          this.log(`========================================================`);
          this.log(colors.green(`Claim tapping successfully!`));
          if (response.data.user) {
            this.userInfo = response.data.user;
          }
        } else {
          this.log(colors.red(`Fail to claim tapping: ${error.message}`));
        }
      } catch (error) {
        this.log(colors.red(`Fail to claim tapping: ${error.message}`));
      }
    }
    if (!this.waitingEnergyTime) {
      this.log(
        colors.cyan(`Recovering energy. Wait 3 minutes to continue play game.`)
      );
      this.waitingEnergyTime = this.addSecondsToDatetime(
        new Date(),
        Number(rechargeSeconds)
      );
    }
  };

  getTotalClaimTaskNum = (tasks) => {
    return tasks.filter((t) => !t.claimed).length;
  };

  resolveTask = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Resolve Task] ======`));
    if (this.waitingClaimTime && this.waitingClaimTime > new Date()) {
      this.log(colors.red(`Not time to claim yet.`));
      return;
    }
    const taskSocialNo_0 = this.socialsJoined[0] || null;
    if (taskSocialNo_0 && taskSocialNo_0.tasks.length) {
      // get number of task not claimed
      const notClaimedTask = this.getTotalClaimTaskNum(taskSocialNo_0.tasks);
      if (notClaimedTask < 1) {
        this.log(
          colors.green(`Don't have tasks to claimed: ${notClaimedTask}`)
        );
      }
      if (notClaimedTask > 0) {
        // loop task not claimed
        this.log(colors.green(`Task going to claim: ${notClaimedTask}`));
        for (let i = 0; i < notClaimedTask; i++) {
          await this.sleep(1000);
          let wrkSocialsJoined = [...this.socialsJoined];
          wrkSocialsJoined = wrkSocialsJoined.map(async (i) => {
            const reqSocials = { ...i };
            const isClaimTaskDone = !reqSocials.tasks.some(
              (i) => !i.done && !i.claimed
            );
            if (!isClaimTaskDone) {
              const wrkTasks = [...reqSocials.tasks];
              //update tasks with new tasks
              reqSocials.task = this.updateFisrtTaskToClaimed(wrkTasks);
              return reqSocials;
            }
            return reqSocials;
          });
          // call api claim for task
          await this.callApiResolveTask(dataUser, wrkSocialsJoined, i);
        }
      }
    } else {
      this.log(colors.cyan(`Resolved all tasks!`));
      return;
    }
    if (!this.waitingClaimTime) {
      this.log(colors.cyan(`Check tasks success. Wait 10 minutes to claim.`));
      this.waitingClaimTime = this.addSecondsToDatetime(new Date(), 10 * 60);
    }
    if (this.waitingClaimTime && this.waitingClaimTime < new Date()) {
      this.waitingClaimTime = null;
    }
    return;
  };

  callApiResolveTask = async (dataUser, socialsJoined, idx) => {
    this.log(colors.yellow(`====== [Claim Task no.${idx + 1}] ======`));
    const header = this.getHeader();
    const request = {
      socialsJoined: socialsJoined,
    };
    if (this.waitingClaimTime && this.waitingClaimTime < new Date()) {
      request.coinBalance = this.userInfo.coinBalance;
      request.dailyCoinBalance = this.userInfo.dailyCoinBalance;
      request.weeklyCoinBalance = this.userInfo.weeklyCoinBalance;
      request.overallCoinBalance = this.userInfo.overallCoinBalance;
    }
    try {
      const response = await this.callApi(
        METHOD.PUT,
        `https://api.bahne.ai/api/users/${dataUser.id}`,
        request,
        header
      );
      if (response && response.data.success) {
        if (this.waitingClaimTime && this.waitingClaimTime < new Date()) {
          this.log(colors.green(`Claim task no.${idx + 1} successfully!`));
        } else {
          this.log(colors.green(`Check task no.${idx + 1} successfully!`));
        }
        if (response.data.user) {
          this.userInfo = response.data.user;
          this.socialsJoined = response.data.user.socialsJoined;
        }
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail to claim task no.${idx + 1}!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to claim task no.${idx + 1}!`));
    }
  };

  updateFisrtTaskToClaimed = (tasks) => {
    const wrkTasks = [...tasks];
    const taskToUpdate = wrkTasks.find((task) => !task.claimed || !task.done);
    if (taskToUpdate) {
      if (this.waitingClaimTime && this.waitingClaimTime < new Date()) {
        taskToUpdate.claimed = true;
      }
      taskToUpdate.done = true;
      taskToUpdate.doneAt = new Date().toISOString();
      return wrkTasks;
    }

    return null;
  };

  connectWallets = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Connect Wallets] ======`));
    const wallets = this.getWalletFile();
    if (!wallets.length) return;
    const header = this.getHeader();
  };

  buildHeaderBahne = () => {
    const excludeKey = ["Content-Type", "Sec-Fetch-Site", "User-Agent"];
    const addional = {
      Origin: "https://app.bahne.ai",
      Referer: "https://app.bahne.ai/",
      "Sec-Fetch-Site": "cross-site",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
    };
    return this.buildHeader(addional, excludeKey);
  };

  upgradeResourceSoftware = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Upgrade Resource Game] ======`));
    if (this.userInfo.coinBalance < BalanceToUpgrade) {
      this.log(colors.cyan("Coin balance not met require balance!"));
      return null;
    }
    const header = this.getHeader();
    await this.getSettings();
    await this.sleep(1000);
    if (!this.settings || !this.softWares.length) {
      this.log(colors.red("Fail to get settings or software!"));
      return null;
    }
    const settingSoftware = [...this.softWares];
    const currentGreatestLevel = settingSoftware.reduce(
      (max, item) => Math.max(max, item.level),
      -Infinity
    );
    while (this.userInfo.coinBalance > 500000) {
      await this.sleep(1000);
      try {
        const request = await this.buildSoftWareRequest(currentGreatestLevel);
        if (!request) {
          return;
        }
        const response = await this.callApi(
          METHOD.PUT,
          `https://api.bahne.ai/api/users/${dataUser.id}`,
          request,
          header
        );
        if (response && response.data.success) {
          if (response.data.user) {
            this.userInfo = response.data.user;
            this.softWares = response.data.user.software;
            this.log(
              colors.green(
                `Upgrade resource successfully! | Coin Balance left: ${response.data.user.coinBalance}`
              )
            );
          }
        } else {
          this.log(colors.red("Fail to upgrade resource!"));
        }
      } catch (error) {
        this.log(colors.red("Fail to upgrade resource!"));
      }
    }
  };

  buildSoftWareRequest = (currentGreatestLevel) => {
    const userSoftware = [...this.softWares];
    const settingSoftware = [...this.settings.software];
    const softwareToUpdate = userSoftware.find((i) => i.level < 20);
    if (!softwareToUpdate) {
      this.log(colors.red(`Can't find any software can update!.`));
      return null;
    }
    const nextLevel = softwareToUpdate.level + 1;
    softwareToUpdate.level = nextLevel;
    const software = settingSoftware.find(
      (i) => i._id === softwareToUpdate.categoryId
    );
    if (software) {
      const level = [...software.levels];
      const nextLevelSettingSoftWare = level.find((i) => i._id === nextLevel);
      if (this.userInfo.coinBalance < nextLevelSettingSoftWare.price) {
        this.log(
          colors.red(`Not enough to upgrade software ${software.name}!.`)
        );
        return null;
      }
      if (!nextLevelSettingSoftWare) {
        this.log(colors.red(`Software is max level!.`));
        return null;
      }
      this.log(
        colors.yellow(`=== [Upgrade for software ${software.name}.] ===`)
      );
      return {
        coinBalance: this.userInfo.coinBalance - nextLevelSettingSoftWare.price,
        profitPerHour:
          this.userInfo.profitPerHour + nextLevelSettingSoftWare.perHourAddOn,
        software: userSoftware,
      };
    }
    return null;
  };

  getSettings = async (queryId, dataUser, token) => {
    const header = this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        "https://api.bahne.ai/api/setting",
        null,
        header
      );
      if (response && response.data.success) {
        this.log(colors.green(`Get settings sucessfully!`));
        if (response.data.setting) {
          this.settings = response.data.setting;
        }
      } else {
        this.log(colors.red(`Fail to get settings!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to get settings!`));
    }
  };

  async main() {
    this.renderFiglet(this.toolsName, this.version);
    await this.sleep(1000);
    await this.renderQuestions();
    if (
      !this.questionStatuses.isAutoUpgradeGameResource &&
      !this.questionStatuses.isPlayGame &&
      !this.questionStatuses.isWatchAds &&
      !this.questionStatuses.isDoTask &&
      !this.questionStatuses.isDailyClaim
    ) {
      return;
    }
    await this.sleep(1000);
    while (true) {
      const data = this.getDataFile();

      if (!data || data.length < 1) {
        this.log(
          colors.red(`Don't have any data. Please check file data.txt!`)
        );
        await this.sleep(1000);
      }
      for (let i = 0; i < data.length; i++) {
        const queryId = data[i];
        const dataUser = await this.extractUserData(queryId);
        await this.sleep(1000);
        this.log(
          colors.cyan(
            `----------------------=============----------------------`
          )
        );
        this.log(
          colors.cyan(
            `Working with user #${i + 1} | ${dataUser.user.first_name} ${
              dataUser.user.last_name
            }`
          )
        );
        await this.processAccount(queryId, dataUser.user);
      }
      const extraMinutes = 1 * 60;
      await this.countdown(this.waitingTime + extraMinutes);
    }
  }
}

const client = new Tools();
client.main().catch((err) => {
  client.log(err.message, "error");
});

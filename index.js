const colors = require("colors");
const { questions, ToolName, METHOD, BalanceToUpgrade } = require("./config");

const BaseRoot = require("./ultils");

class Tools extends BaseRoot {
  constructor() {
    super();
    this.toolsName = ToolName || "";
    this.version = "1.0";
    this.waitingTime = 0;
    this.userInfo = null;
    this.waitingClaimTime = null;
    this.socialsJoined = [];
    this.softWares = [];
    this.settings = null;
    this.questionStatuses = {
      isPlayGame: false,
      isWatchAds: false,
      isDoTask: false,
      isDailyClaim: false,
      isAutoUpgradeGameResource: false,
    };
  }

  async renderQuestions() {
    for (let i = 0; i < questions.length; i++) {
      const questionAnswer = await this.askQuestion(questions[i].question);
      this.questionStatuses[questions[i].type] =
        questionAnswer.toLowerCase() === "y" ?? true;
    }
  }

  processAccount = async (queryId, dataUser) => {
    this.log(colors.yellow(`====== [Process Account] ======`));
    const token = await this.login(queryId, dataUser);
    await this.sleep(1000);
    if (token) {
      await this.buildHeader({ "Sec-Fetch-Site": "same-site" }, [
        "Sec-Fetch-Site",
      ]);
      await this.sleep(1000);
      await this.dailyCheckInClaim();
      await this.sleep(1000);
      if (this.questionStatuses.isDoTask) {
        await this.resolveTask(queryId, dataUser, "token");
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
    this.log(colors.yellow(`====== [Watch Ads #1] ======`));
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
    this.waitingTime = this.waitingTime + 60;
  };

  claimWatchAds75K = async (dataUser) => {
    this.log(colors.yellow(`====== [Watch Ads #2] ======`));
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
      } else {
        this.log(colors.red(`Fail to claim watch ads 75k!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to claim watch ads 75k!`));
    }
    this.waitingTime = this.waitingTime + 3 * 60;
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

  playGame = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Play Game] ======`));
    const maxEnergy = this.userInfo.maxEnergy;
    const rechargeSpeed = this.userInfo.rechargeSpeed;
    const rechargeSeconds = rechargeSpeed * maxEnergy;

    if (this.userInfo.energy < 100) {
      this.log(colors.red(`Not enough energy to play.`));
      return;
    }

    const header = this.buildHeaderBahne();
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
    this.waitingTime = this.waitingTime + Number(rechargeSeconds);
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
      this.log(colors.red(`Can't find any tasks to claim`));
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
    if (this.userInfo.coinBalance < BalanceToUpgrade) {
      this.log(colors.yellow("Coin balance not met require balance!"));
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
    const softwareToUpdate = userSoftware.find(
      (i) => i.level < currentGreatestLevel
    );
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
    await this.sleep(1000);
    const data = this.getDataFile();

    if (!data || data.length < 1) {
      this.log(colors.red(`Don't have any data. Please check file data.txt!`));
      await this.sleep(1000);
    }

    while (true) {
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
      const extraMinutes = 2 * 60;
      await this.countdown(this.waitingTime + extraMinutes);
    }
  }
}

const client = new Tools();
client.main().catch((err) => {
  client.log(err.message, "error");
});

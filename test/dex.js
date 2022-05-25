const { expect } = require("chai");
const { ethers } = require("hardhat");

const SIDE = {
  BUY: 0,
  SELL: 1,
};

describe("Dex contract", () => {
  let dex, dai, bat, rep, zrx;

  const [DAI, BAT, REP, ZRX] = ["DAI", "BAT", "REP", "ZRX"].map((ticker) =>
    ethers.utils.formatBytes32String(ticker)
  );

  beforeEach(async () => {
    [deployer, trader1, trader2, ...accounts] = await ethers.getSigners();

    console.log(
      "---deployer, trader1, trader2 =>",
      deployer.address,
      trader1.address,
      trader2.address
    );

    const Dex = await ethers.getContractFactory("Dex");
    dex = await Dex.deploy();

    console.log("---dex.address =>", dex.address);

    [Dai, Bat, Rep, Zrx] = await Promise.all([
      await ethers.getContractFactory("Dai"),
      await ethers.getContractFactory("Bat"),
      await ethers.getContractFactory("Rep"),
      await ethers.getContractFactory("Zrx"),
    ]);

    [dai, bat, rep, zrx] = await Promise.all([
      await Dai.deploy(),
      await Bat.deploy(),
      await Rep.deploy(),
      await Zrx.deploy(),
    ]);

    console.log(
      "---contracts addresses =>",
      dai.address,
      bat.address,
      rep.address,
      zrx.address
    );

    await Promise.all([
      dex.addToken(DAI, dai.address),
      dex.addToken(BAT, bat.address),
      dex.addToken(REP, rep.address),
      dex.addToken(ZRX, zrx.address),
    ]);

    console.log("#1");
    const seedTokenBalance = async (token, trader) => {
      console.log("#11");

      await token.faucet(trader.address, 1000);

      console.log("#12");

      await token.connect(trader).approve(dex.address, 1000);
      console.log("#13");
    };

    console.log("#2");

    await Promise.all(
      [dai, bat, rep, zrx].map((token) => seedTokenBalance(token, trader1))
    );
    await Promise.all(
      [dai, bat, rep, zrx].map((token) => seedTokenBalance(token, trader2))
    );

    console.log("#3");

    console.log("#4");
  });

  describe("Deployment", () => {
    it("should deposit tokens", async () => {
      console.log("#51");
      await dex.connect(trader1).deposit(100, DAI);

      console.log("#52");

      const balance = await dex.traderBalances(trader1.address, DAI);
      console.log("#53, balance =>", balance);

      expect(balance).to.eq(100);
      console.log("#54");
    });

    it("should NOT deposit tokens if token does not exist", async () => {
      console.log("#61 ");

      await expect(
        dex
          .connect(trader1)
          .deposit(
            100,
            ethers.utils.formatBytes32String("TOKEN-DOES-NOT-EXIST")
          )
      ).to.be.revertedWith("this token does not exist");

      console.log("#62");
    });

    it("should withdraw tokens", async () => {
      console.log("#71");
      await dex.connect(trader1).deposit(100, DAI);

      console.log("#72");
      await dex.connect(trader1).withdraw(100, DAI);

      console.log("#73");
      const [balanceDex, balanceDai] = await Promise.all([
        dex.traderBalances(trader1.address, DAI),
        dai.balanceOf(trader1.address),
      ]);

      console.log("#74 balanceDex", balanceDex);
      expect(balanceDex).to.eq(0);

      console.log("#75 balanceDai", balanceDai);
      expect(balanceDai).to.eq(1000);
    });

    it("should NOT withdraw tokens if token does not exist", async () => {
      console.log("#81");

      await expect(
        dex
          .connect(trader1)
          .withdraw(
            1000,
            ethers.utils.formatBytes32String("TOKEN-DOES-NOT-EXIST")
          )
      ).to.be.revertedWith("this token does not exist");

      console.log("#82");
    });
  });
});

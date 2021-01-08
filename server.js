const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const Web3 = require("web3");
const BigNumber = require("bignumber.js");

const routerABI = require("./IUniswapRouter.json");
const factoryABI = require("./IUniswapFactory.json");

app.use(bodyParser.json());
const port = 3000;

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    "https://mainnet.infura.io/v3/8b8d0c60bfab43bc8725df20fc660d15"
  )
);

const factoryRouter = new web3.eth.Contract(
  factoryABI.abi,
  "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
);

const contractRouter = new web3.eth.Contract(
  routerABI.abi,
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/swap", async function (req, res) {
  console.log(req.body);
  const data = req.body;
  const amount = new BigNumber(data.amount1).multipliedBy(10).pow(18);
  console.log("amount", amount);
  // Get the pair address for two tokens
  const pairAddress = await factoryRouter.methods
    .getPair(data.address1, data.address2)
    .call();

  console.log(pairAddress, "pairAddress");
  let path;
  // Check whether the pair exists
  if (pairAddress !== "0x0000000000000000000000000000000000000000") {
    path = [data.address1, data.address2];
  } else {
    // Make an indirect swap from token a to token b via WETH
    path = [
      data.address1,
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      data.address2,
    ];
  }
  console.log("path", path);
  // Deadline after 20 mintues
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  // Get a quote price for token A - token B swap
  const resp = await contractRouter.methods
    .getAmountsOut(amount.toString(), path)
    .call();

  console.log("resp", resp);

  // Get data for the swap call
  const callData = await contractRouter.methods.swapExactTokensForTokens(
      amount.toString(),
      resp[2],
      path,
      data.to,
      deadline.toString()
    )
    .encodeABI();

  console.log("callData", callData);

  res.send({'callData': callData});
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

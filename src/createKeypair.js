import * as fs from "fs";
import * as anchor from "@project-serum/anchor";

const account = anchor.web3.Keypair.generate();

fs.writeFileSync("./keypair.json", JSON.stringify(account));

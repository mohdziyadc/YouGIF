// import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import kp from "./keypair.json";
import { Buffer } from "buffer";

// Constants
const TWITTER_HANDLE = "_mohdziyad";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
  "https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp",
  "https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g",
  "https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g",
  "https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp",
  "https://media.giphy.com/media/o6FWop1Gbuyly/giphy.gif",
];

const { SystemProgram, Keypair } = web3;

window.Buffer = Buffer; //????
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
const programId = new PublicKey("6sUhuv3YKP3zfyZzsbEJ8YJuJ55swS6xBmU7u4GnXshs");
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed", //Similar to blockConfirmations
};

const App = () => {
  const [walletAddress, setWalletAddress] = useState();
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  const walletConnectedCheck = async () => {
    if (window?.solana?.isPhantom) {
      console.log("Phantom wallet found!");
      const response = await window.solana.connect({ onlyIfTrusted: true }); //doesn't pop up phantom if app is trusted

      console.log("Connected with Public Key:", response.publicKey.toString());

      setWalletAddress(response.publicKey.toString());
    } else {
      alert("Solana object not found! Get a Phantom Wallet 👻");
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect(); //pops up phantom
      console.log("Connected with Public Key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const getProgram = async () => {
    const provider = getProvider();
    const idl = await Program.fetchIdl(programId, provider);
    return new Program(idl, programId, provider);
  };

  const getGifList = async () => {
    try {
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (e) {
      console.log("Error in getGifList: ", e);
      setGifList(null);
    }
  };

  //Initialize the base Account
  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();
      console.log("Provider: ", provider);

      console.log("ping");
      await program.methods
        .initialize()
        .accounts({
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([baseAccount])
        .rpc();
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log("Gif link:", inputValue);
      // setGifList([...gifList, inputValue]);
      try {
        const provider = getProvider();
        const program = await getProgram();

        await program.methods
          .addGif(inputValue)
          .accounts({
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
          })
          .signers([])
          .rpc();

        console.log("GIF successfully sent to program", inputValue);
      } catch (e) {}
      setInputValue("");
    } else {
      console.log("Empty input. Try again.");
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await walletConnectedCheck();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF List....");
      getGifList();
      console.log("GIF List: ", gifList);
    }
  }, [walletAddress]);
  return (
    <div className="App">
      <p className="header p-4">🫵 You GIF</p>
      <p className="sub-text ">View your GIF collection in the metaverse ✨</p>
      {gifList == null ? (
        <div className="p-12">
          <button
            className="text-white submit-gif-button py-2 px-4 w-128 rounded-md"
            onClick={async () => {
              await createGifAccount();
            }}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      ) : walletAddress ? (
        <div className="p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              console.log("Form submitted");
              sendGif();
            }}
          >
            <input
              placeholder="Enter GIF link"
              type={"text"}
              value={inputValue}
              onChange={onInputChange}
              className="p-2 rounded-md w-64"
            />

            <button
              type="submit"
              className=" bg-gradient-to-r from-indigo-500 to-cyan-400  text-white m-4 py-2 w-24 rounded-md"
            >
              Submit
            </button>
          </form>
          <div className="grid grid-cols-4 gap-4">
            {gifList?.map((gif) => (
              <div
                className=" rounded overflow-hidden shadow-lg bg-white"
                key={gif}
              >
                {console.log("GIF: ", gif)}
                <img src={gif.gifLink} alt={gif} className=" w-full h-80" />
                <div className="  bg-blue-900 flex flex-row items-center  justify-center ">
                  <p className="text-slate-200 px-2 py-3 font-mono">
                    Submitted by:{" "}
                  </p>
                  <p className="font-bold font-mono text-transparent bg-gradient-to-r from-yellow-300 to-pink-500  bg-clip-text">
                    {" "}
                    {gif.userAddress.toString().slice(0, 4) +
                      "...." +
                      gif.userAddress.toString().slice(39, 44)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-2/3 w-screen flex justify-center items-center ">
          <button
            className="cta-button connect-wallet-button "
            onClick={connectWallet}
          >
            Connect to Wallet❤️
          </button>
        </div>
      )}

      <footer className="flex flex-row justify-center items-center">
        {/* <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} /> */}
        <a
          className="footer-text"
          href={TWITTER_LINK}
          target="_blank"
          rel="noreferrer"
        >{`🪴 built by Ziyad with ❤️`}</a>
      </footer>
    </div>
  );
};

export default App;

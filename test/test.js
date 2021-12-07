const Base58 = require("base-58");
const {Token, TOKEN_PROGRAM_ID} = require("@solana/spl-token");
const {web3, Wallet} = require("@project-serum/anchor");

const testFeePayerSecretKey = 'EGeG7Q6j8DedNW1ayFJW6a1eqUYCVobJ3CkKMxGPUb3vZLfHJhYDy2YrY8bwrNy2kZvqRPduFn8KXUUxJtqEPB3'
const testMasterSecretKey = '5rfnMoHXULH1fvcvdeBNwNLCJjDrNjd5UoqQZiNxzxJ1DFXTAWj8HRJNzxh4kaoeSnjZvaGZ8yLYAvuX7W1SEfxQ'


// 3rpycwRea4yGvcE5inQNX1eut4wEpeVCZohkEiBXY3PB
const testFeePayerWallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode(testFeePayerSecretKey)))
// 8HZtsjLbS5dim8ULfVv83XQ6xp4oMph2FpzmsLbg2aC4
const testMasterWallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode(testMasterSecretKey)))
const connection = new web3.Connection("http://127.0.0.1:8899/")

// 2B8SUxUHwUMCaGBR564L5KLDGJ7SyjbZDzXZifbvrhdv
const user1Wallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode('4EHnNBG9jfvU2RE5bgXd9Fzn6bbKTnDdvVeQmJScpLTFyMyAy7QcLdnLuxEz7fqJLbHdZg6pZggGmumPX8hbA5Qg')))
// 6qbhYEGCMihaQiRt66oTMDgvCm2VY23vJsETGN6rs8z1
const user2Wallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode('4TQEhMh7ujM8yoEKxEv6d5dWciCPhErAMP2FuLS2xTX9B3VrwZUDJVubVVby46yQGkcmWD2vvcv7pyrQDJxu96yb')))
const bicSpl = new Token(connection, new web3.PublicKey('QFPUz4angQxy3nFM82y3UwdUsr9EVPWN4JNt2iWHcN2'), TOKEN_PROGRAM_ID, testFeePayerWallet.payer)

async function transferBIC(fromWallet, toAddress, amount) {
    const fromAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(fromWallet.publicKey)
    const toAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(toAddress)
    const feePayerAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(testFeePayerWallet.publicKey)
    // Simple transfer
    // await bicSpl.transfer(fromAssociatedAddress.address, toAssociatedAddress.address, fromWallet.publicKey, [fromWallet.payer], amount)
    // console.log('asdasdsa')
    // Transfer BIC to fee payer for cost
    const instructions = [
        Token.createTransferInstruction(
            bicSpl.programId,
            fromAssociatedAddress,
            toAssociatedAddress,
            fromWallet.publicKey,
            [],
            amount
        ),
        Token.createTransferInstruction(
            bicSpl.programId,
            fromAssociatedAddress,
            feePayerAssociatedAddress,
            fromWallet.publicKey,
            [],
            1
        ),
    ];
    console.log('bicSpl.programId: ', bicSpl.programId.toBase58())
    console.log('fromAssociatedAddress: ', fromAssociatedAddress.toBase58())
    // let tx = new web3.Transaction().add(...instructions)
    //
    // tx.feePayer = testFeePayerWallet.payer.publicKey
    //
    // tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
    // // console.log('tx: ', tx)
    // // await fromWallet.signTransaction(tx)
    // // console.log('signer1: ', tx.signatures[0].publicKey)
    // // console.log('signer1: ', tx.signatures[1].publicKey)
    // // tx.partialSign(testFeePayerWallet.payer)
    //
    // tx.partialSign(fromWallet.payer)
    // console.log('tx: ', tx)
    //
    // const receipt = await connection.sendTransaction(tx, [fromWallet.payer, testFeePayerWallet.payer], {skipPreflight: false})
    // console.log('receipt: ', receipt)
}

transferBIC(user1Wallet, user2Wallet.publicKey, 10)

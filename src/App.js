import {useState} from 'react';
import {Col, Row, Label, Button, Collapse, Card, CardBody, CardText, CardTitle, CardLink} from 'reactstrap';
import {web3, Wallet, Provider, BN} from '@project-serum/anchor';
import Base58 from 'base-58';
import { TOKEN_PROGRAM_ID, Token, u64 } from "@solana/spl-token";

function App() {
    // State
    const testFeePayerSecretKey = 'EGeG7Q6j8DedNW1ayFJW6a1eqUYCVobJ3CkKMxGPUb3vZLfHJhYDy2YrY8bwrNy2kZvqRPduFn8KXUUxJtqEPB3'
    const testMasterSecretKey = '5rfnMoHXULH1fvcvdeBNwNLCJjDrNjd5UoqQZiNxzxJ1DFXTAWj8HRJNzxh4kaoeSnjZvaGZ8yLYAvuX7W1SEfxQ'
    const [newKeypair, setNewKeypair] = useState({})
    const [balances, setBalances] = useState([0,0,0,0])
    const [bicInfo, setBicInfo] = useState({})
    const [signatureLog, setSignatureLog] = useState([]);
    const [isShowLog, setIsShowLow] = useState(false);

    // 3rpycwRea4yGvcE5inQNX1eut4wEpeVCZohkEiBXY3PB
    const testFeePayerWallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode(testFeePayerSecretKey)))
    // 8HZtsjLbS5dim8ULfVv83XQ6xp4oMph2FpzmsLbg2aC4
    const testMasterWallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode(testMasterSecretKey)))
    // const connection = new web3.Connection("http://127.0.0.1:8899/") //local net
    const connection = new web3.Connection("https://api.devnet.solana.com/") // dev net

    // 2B8SUxUHwUMCaGBR564L5KLDGJ7SyjbZDzXZifbvrhdv
    const user1Wallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode('4EHnNBG9jfvU2RE5bgXd9Fzn6bbKTnDdvVeQmJScpLTFyMyAy7QcLdnLuxEz7fqJLbHdZg6pZggGmumPX8hbA5Qg')))
    // 6qbhYEGCMihaQiRt66oTMDgvCm2VY23vJsETGN6rs8z1
    const user2Wallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode('4TQEhMh7ujM8yoEKxEv6d5dWciCPhErAMP2FuLS2xTX9B3VrwZUDJVubVVby46yQGkcmWD2vvcv7pyrQDJxu96yb')))
    const bicSpl = new Token(connection, new web3.PublicKey('TVS2vUYedu5SPHzanWVKWmoQKGbwPeuT3QB9JBpCrLm'), TOKEN_PROGRAM_ID, testFeePayerWallet.payer)

    const maxValue = new u64("18446744073709551615")
    // Logic function
    const createBic = async () => {
        const mint = web3.Keypair.generate();
        console.log('mint: ', mint.publicKey.toBase58())
        console.log('lamport: ', await connection.getMinimumBalanceForRentExemption(82))
        const instructions = [
            web3.SystemProgram.createAccount({
                fromPubkey: testFeePayerWallet.publicKey,
                newAccountPubkey: mint.publicKey,
                space: 82,
                lamports: await connection.getMinimumBalanceForRentExemption(82),
                programId: TOKEN_PROGRAM_ID,
            }),
            Token.createInitMintInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                0,
                testMasterWallet.publicKey,
                null
            ),
        ];
        let tx = new web3.Transaction().add(...instructions)
        tx.feePayer = testFeePayerWallet.payer.publicKey
        console.log('testFeePayerWallet.payer.publicKey: ', testFeePayerWallet.payer.publicKey.toBase58())

        // tx.feePayer = testMasterWallet.payer.publicKey
        console.log('testMasterWallet.payer.publicKey: ', testMasterWallet.payer.publicKey.toBase58())

        tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash

        tx.partialSign(testFeePayerWallet.payer)
        // tx.partialSign(testMasterWallet.payer)

        tx.partialSign(mint)

        console.log('tx: ', tx)
        // const rec = await testFeePayerKeyProvider.send(tx)
        // console.log('rec: ', rec)
        const rawTx = tx.serialize()

        console.log('rawTx: ', rawTx)
        const receipt = await connection.sendRawTransaction(rawTx)
        console.log('receipt: ', receipt)
        setSignatureLog(signatureLog.concat(receipt))
        // const status = (await connection.confirmTransaction(receipt)).value;
        // console.log('status: ', status)
        // const txInfo = await connection.getTransaction(receipt, {commitment: "confirmed"})
        // console.log('txInfo: ', txInfo)
        alert(`create bic success bic address: ${mint.publicKey.toBase58()}`)
        // const txResult = await testFeePayerKeyProvider.send(tx)
        // console.log('txResult: ', txResult)

    }

    const load = async (signature) => {
        if(signature) {
            const status = (await connection.confirmTransaction(signature)).value;
            console.log('status: ', status)
        }
        setBalances(await Promise.all([
            connection.getBalance(user1Wallet.publicKey),
            connection.getBalance(user2Wallet.publicKey),
            connection.getBalance(testFeePayerWallet.publicKey),
            connection.getBalance(testMasterWallet.publicKey),
            bicSpl.getOrCreateAssociatedAccountInfo(user1Wallet.publicKey),
            bicSpl.getOrCreateAssociatedAccountInfo(user2Wallet.publicKey),
            bicSpl.getOrCreateAssociatedAccountInfo(testFeePayerWallet.publicKey),
        ]))
        setBicInfo(await bicSpl.getMintInfo())
    }

    const mintBic = async (toWallet, amount) => {
        const toAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(toWallet.publicKey)
        // const masterAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(testMasterWallet.publicKey)
        // Simple mint approve
        // await bicSpl.mintTo(toAssociatedAddress.address, testMasterWallet.publicKey, [testMasterWallet.payer], amount)
        // await bicSpl.approve(toAssociatedAddress.address, masterAssociatedAddress.address, toWallet.publicKey, [toWallet.payer], maxValue)

        // Mint and approve at once
        const instructions = [
            Token.createMintToInstruction(
                bicSpl.programId,
                bicSpl.publicKey,
                toAssociatedAddress.address,
                testMasterWallet.publicKey,
                [],
                amount
            ),
            Token.createApproveInstruction(
                bicSpl.programId,
                toAssociatedAddress.address,
                testMasterWallet.publicKey,
                toWallet.publicKey,
                [],
                maxValue
            ),
        ];

        let tx = new web3.Transaction().add(...instructions)

        tx.feePayer = testFeePayerWallet.payer.publicKey

        tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
        tx.partialSign(testFeePayerWallet.payer)
        tx.partialSign(testMasterWallet.payer)
        tx.partialSign(toWallet.payer)
        const rawTx = tx.serialize()

        console.log('rawTx: ', rawTx)
        const receipt = await connection.sendRawTransaction(rawTx)
        console.log('receipt: ', receipt)
        setSignatureLog(signatureLog.concat(receipt))
        await load(receipt)
    }

    const transferBIC = async (fromWallet, toAddress, amount) => {
        const fromAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(fromWallet.publicKey)
        const toAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(toAddress)
        const feePayerAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(testFeePayerWallet.publicKey)
        // Simple transfer
        // await bicSpl.transfer(fromAssociatedAddress.address, toAssociatedAddress.address, fromWallet.publicKey, [], amount)

        // Transfer BIC to fee payer for cost
        const instructions = [
            Token.createTransferInstruction(
                bicSpl.programId,
                fromAssociatedAddress.address,
                toAssociatedAddress.address,
                fromWallet.publicKey,
                [],
                amount
            ),
            Token.createTransferInstruction(
                bicSpl.programId,
                fromAssociatedAddress.address,
                feePayerAssociatedAddress.address,
                fromWallet.publicKey,
                [],
                1
            ),

        ];
        let tx = new web3.Transaction().add(...instructions)

        tx.feePayer = testFeePayerWallet.payer.publicKey

        tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
        tx.partialSign(testFeePayerWallet.payer)
        tx.partialSign(fromWallet.payer)
        console.log('tx: ', tx)

        const receipt = await connection.sendTransaction(tx, [fromWallet.payer, testFeePayerWallet.payer], {skipPreflight: false})
        setSignatureLog(signatureLog.concat(receipt))
        console.log('receipt: ', receipt)
        await load(receipt)
    }

    const recoverTransfer = async (fromAddress, toAddress, amount) => {
        const fromAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(fromAddress)
        const toAssociatedAddress = await bicSpl.getOrCreateAssociatedAccountInfo(toAddress)
        // await bicSpl.transfer(fromAssociatedAddress.address, toAssociatedAddress.address, user1Wallet.publicKey, [testMasterWallet.payer], amount)
        // const info = await bicSpl.getAccountInfo(fromAssociatedAddress.address)
        // console.log('info: ', info)
        // console.log('info: ', info.delegate.toBase58())
        // console.log('info: ', info.delegatedAmount.toString())

        // create with instructions
        const instructions = [
            Token.createTransferInstruction(
                bicSpl.programId,
                fromAssociatedAddress.address,
                toAssociatedAddress.address,
                testMasterWallet.publicKey,
                [testMasterWallet.payer],
                amount
            )
        ]

        let tx = new web3.Transaction().add(...instructions)

        tx.feePayer = testFeePayerWallet.payer.publicKey

        tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
        tx.partialSign(testFeePayerWallet.payer)
        tx.partialSign(testMasterWallet.payer)
        console.log('tx: ', tx)
        const rawTx = tx.serialize()

        console.log('rawTx: ', rawTx)
        const receipt = await connection.sendRawTransaction(rawTx)
        console.log('receipt: ', receipt)
        setSignatureLog(signatureLog.concat(receipt))
        await load(receipt)

    }

    const createBicAssociatedAccount = async (keypair) => {
        const bicAssociatedPublicKey = await Token.getAssociatedTokenAddress(
            bicSpl.associatedProgramId,
            bicSpl.programId,
            bicSpl.publicKey,
            keypair.publicKey
            // new web3.PublicKey("2B8SUxUHwUMCaGBR564L5KLDGJ7SyjbZDzXZifbvrhdv")
        )
        console.log('bicAssociatedPublicKey: ', bicAssociatedPublicKey.toBase58())

        const accountInfo = await connection.getAccountInfo(bicAssociatedPublicKey)
        console.log('accountInfo: ', accountInfo)
        if(accountInfo && accountInfo.owner) {
            alert(`Cannot create account because it own by ${accountInfo.owner.toBase58()}`)
        } else {
            const tx = new web3.Transaction().add(Token.createAssociatedTokenAccountInstruction(
                bicSpl.associatedProgramId,
                bicSpl.programId,
                bicSpl.publicKey,
                bicAssociatedPublicKey,
                keypair.publicKey,
                testFeePayerWallet.publicKey
            ))
            tx.feePayer = testFeePayerWallet.payer.publicKey
            tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
            tx.partialSign(testFeePayerWallet.payer)
            console.log('tx: ', tx)

            const rawTx = tx.serialize()

            const receipt = await connection.sendRawTransaction(rawTx)
            console.log('receipt: ', receipt)

            setSignatureLog(signatureLog.concat(receipt))
            alert(`Create account ${bicAssociatedPublicKey.toBase58()}`)
        }
    }

    return (
        <div className="App">
            <Row>
                <Col>
                    <Label>Generate keypair</Label>
                    <br/>
                    <Button onClick={() => {
                        setNewKeypair(web3.Keypair.generate())
                    }}>Generate</Button>
                    {newKeypair.publicKey && <Button onClick={() => createBicAssociatedAccount(newKeypair)}>Create BIC Associated Account</Button>}
                </Col>
                <Col>
                    <h4>Secret key: {newKeypair.secretKey && Base58.encode(newKeypair.secretKey)}</h4>
                    <h4>Public key: {newKeypair.secretKey && newKeypair.publicKey.toBase58()}</h4>
                </Col>

            </Row>
            <Row>
                <Label>Signature logs</Label>
                <Button onClick={() => setIsShowLow(!isShowLog)}>Show signature logs</Button>
                <Collapse isOpen={isShowLog}>
                    <Card>
                        <CardBody>
                            {signatureLog.map(e => <CardLink href={`https://explorer.solana.com/tx/${e}?cluster=devnet`} target="_blank">{e}</CardLink>)}
                        </CardBody>
                    </Card>
                </Collapse>
            </Row>

            <Row>
                <Label>Spl token</Label>
                <Card>
                    <Button onClick={() => createBic()}>Create BIC</Button>
                    <Button onClick={() => load()}>Load</Button>
                </Card>
                <Card>
                    <CardBody>
                        <CardTitle>BIC</CardTitle>
                        <CardText>ProgramId: {bicSpl.programId.toBase58()}</CardText>
                        <CardText>Public key: {bicSpl.publicKey.toBase58()}</CardText>
                        <CardText>Mint: {bicInfo.mintAuthority && bicInfo.mintAuthority.toBase58()}</CardText>
                        <CardText>Decimals: {bicInfo.decimals}</CardText>
                        <CardText>Supply: {bicInfo.supply && bicInfo.supply.toString()}</CardText>

                    </CardBody>
                </Card>

                <Label>User Wallet</Label>

                <Row>
                    <Col md={6}>
                        <Card>
                            <CardBody>
                                <CardTitle>User 1</CardTitle>
                                <CardTitle>Address: {user1Wallet.publicKey.toBase58()}</CardTitle>
                                <CardText>Balances: {balances[0]} nSOL</CardText>
                                <CardTitle>BIC Associated Address: {balances[4] && balances[4].address.toBase58()}</CardTitle>
                                <CardTitle>BIC balance: {balances[4] && balances[4].amount.toString()} BIC</CardTitle>
                            </CardBody>
                            <CardBody>
                                <Button onClick={() => transferBIC(user1Wallet, user2Wallet.publicKey, 10)}>Transfer 10 BIC to user 2</Button>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card>
                            <CardBody>
                                <CardTitle>User 2</CardTitle>
                                <CardTitle>Address: {user2Wallet.publicKey.toBase58()}</CardTitle>
                                <CardText>Balances: {balances[1]} nSOL</CardText>
                                <CardTitle>BIC Associated Address: {balances[5] && balances[5].address.toBase58()}</CardTitle>
                                <CardTitle>BIC balance: {balances[5] && balances[5].amount.toString()} BIC</CardTitle>
                            </CardBody>
                            <CardBody>
                                <Button onClick={() => transferBIC(user2Wallet, user1Wallet.publicKey, 10)}>Transfer 10 BIC to user 1</Button>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Label>System Wallet</Label>
                <Row>
                    <Col md={6}>
                        <Card>
                            <CardBody>
                                <CardTitle>FeePayer wallet</CardTitle>
                                <CardTitle>Address: {testFeePayerWallet.publicKey.toBase58()}</CardTitle>
                                <CardText>Balances: {balances[2]} nSOL</CardText>
                                <CardText>{balances[2]/Math.pow(10,9)} SOL</CardText>
                                <CardTitle>BIC Associated Address: {balances[6] && balances[6].address.toBase58()}</CardTitle>
                                <CardTitle>BIC balance: {balances[6] && balances[6].amount.toString()} BIC</CardTitle>
                            </CardBody>
                            <CardBody>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card>
                            <CardBody>
                                <CardTitle>Master (Recover) wallet</CardTitle>
                                <CardTitle>Address: {testMasterWallet.publicKey.toBase58()}</CardTitle>
                                <CardText>Balances: {balances[3]} nSOL</CardText>
                                <CardText>{balances[3]/Math.pow(10,9)} SOL</CardText>
                            </CardBody>
                            <CardBody>
                                <Button onClick={() => mintBic(user1Wallet, 1000)}>Mint 1000 BIC to user 1</Button>
                                <Button onClick={() => mintBic(user2Wallet, 1000)}>Mint 1000 BIC to user 2</Button>
                            </CardBody>
                            <CardBody>
                                <Button onClick={() => recoverTransfer(user1Wallet.publicKey, user2Wallet.publicKey, 10)}>Transfer 10 BIC from user 1 to user 2</Button>
                                <Button onClick={() => recoverTransfer(user2Wallet.publicKey, user1Wallet.publicKey, 10)}>Transfer 10 BIC from user 2 to user 1</Button>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Row>
            <Row>

            </Row>
        </div>
    );
}

export default App;

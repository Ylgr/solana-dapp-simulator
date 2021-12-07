import {useState} from 'react';
import {Col, Row, Label, Button, Container, Card, CardBody, CardText, CardTitle} from 'reactstrap';
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
        alert(`create bic success bic address: ${mint.publicKey.toBase58()}`)
        // const txResult = await testFeePayerKeyProvider.send(tx)
        // console.log('txResult: ', txResult)

    }

    const load = async () => {
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

        await load()
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
        console.log('receipt: ', receipt)
        await load()
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
        await load()

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
                </Col>
                <Col>
                    <h4>Secret key: {newKeypair.secretKey && Base58.encode(newKeypair.secretKey)}</h4>
                    <h4>Public key: {newKeypair.secretKey && newKeypair.publicKey.toBase58()}</h4>
                </Col>

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
                                <CardText>Balances: {balances[0]} SOL</CardText>
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
                                <CardText>Balances: {balances[1]} SOL</CardText>
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
                                <CardText>Balances: {balances[2]} SOL</CardText>
                                <CardText>{balances[2]} BIC</CardText>
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
                                <CardText>Balances: {balances[3]} SOL</CardText>
                                <CardText>{balances[3]} BIC</CardText>
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

import {useState} from 'react';
import {Col, Row, Label, Button, Container, Card, CardBody, CardText, CardTitle} from 'reactstrap';
import {web3, Wallet, Provider} from '@project-serum/anchor';
import Base58 from 'base-58';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

function App() {
    // State
    const testFeePayerSecretKey = 'EGeG7Q6j8DedNW1ayFJW6a1eqUYCVobJ3CkKMxGPUb3vZLfHJhYDy2YrY8bwrNy2kZvqRPduFn8KXUUxJtqEPB3'
    const testMasterSecretKey = '5rfnMoHXULH1fvcvdeBNwNLCJjDrNjd5UoqQZiNxzxJ1DFXTAWj8HRJNzxh4kaoeSnjZvaGZ8yLYAvuX7W1SEfxQ'
    const [newKeypair, setNewKeypair] = useState({})
    const [balances, setBalances] = useState([0,0,0,0])
    const [bicInfo, setBicInfo] = useState({})
    const testFeePayerWallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode(testFeePayerSecretKey)))
    const testMasterWallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode(testMasterSecretKey)))
    const connection = new web3.Connection("http://127.0.0.1:8899/")
    // const testFeePayerKeyProvider = new Provider(connection, testFeePayerWallet, {})

    const user1Wallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode('4EHnNBG9jfvU2RE5bgXd9Fzn6bbKTnDdvVeQmJScpLTFyMyAy7QcLdnLuxEz7fqJLbHdZg6pZggGmumPX8hbA5Qg')))
    const user2Wallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode('4TQEhMh7ujM8yoEKxEv6d5dWciCPhErAMP2FuLS2xTX9B3VrwZUDJVubVVby46yQGkcmWD2vvcv7pyrQDJxu96yb')))
    const bicSpl = new Token(connection, new web3.PublicKey('DM6TvKdR7izbUqEb9xEdA77he9t6vimiKZT6Lqvt24YV'), TOKEN_PROGRAM_ID, testFeePayerWallet.payer)

    const balanceData = {}
    // Logic function
    const createBic = async () => {
        const mint = web3.Keypair.generate();
        console.log('mint: ', mint.publicKey.toBase58())
        console.log('lamport: ', await connection.getMinimumBalanceForRentExemption(82))
        let instructions = [
            web3.SystemProgram.createAccount({
                fromPubkey: testMasterWallet.publicKey,
                newAccountPubkey: mint.publicKey,
                space: 82,
                lamports: await connection.getMinimumBalanceForRentExemption(82),
                programId: TOKEN_PROGRAM_ID,
            }),
            Token.createInitMintInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                0,
                testFeePayerWallet.publicKey,
                null
            ),
        ];
        let tx = new web3.Transaction().add(...instructions)
        tx.feePayer = testFeePayerWallet.payer.publicKey
        console.log('testFeePayerWallet.payer.publicKey: ', testFeePayerWallet.payer.publicKey.toBase58())

        // tx.feePayer = testMasterWallet.payer.publicKey
        console.log('testMasterWallet.payer.publicKey: ', testMasterWallet.payer.publicKey.toBase58())

        tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash

        await testFeePayerWallet.signTransaction(tx)
        // await testMasterWallet.signTransaction(tx)
        // console.log('tx: ', tx)

        tx.partialSign(testFeePayerWallet.payer)
        tx.partialSign(testMasterWallet.payer)
        // tx.partialSign(mint)
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
        // setBalances(await Promise.all([
        //     connection.getBalance(user1Wallet.publicKey),
        //     connection.getBalance(user2Wallet.publicKey),
        //     connection.getBalance(testFeePayerWallet.publicKey),
        //     connection.getBalance(testMasterWallet.publicKey),
        // ]))
        const t = await bicSpl.getMintInfo()
        setBicInfo(t)
        console.log('t: ', t)

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
                                <CardText>{balances[0]} BIC</CardText>
                            </CardBody>
                            <CardBody>
                                <Button>Transfer 1 BIC to user 2</Button>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card>
                            <CardBody>
                                <CardTitle>User 2</CardTitle>
                                <CardTitle>Address: {user2Wallet.publicKey.toBase58()}</CardTitle>
                                <CardText>Balances: {balances[1]} SOL</CardText>
                                <CardText>{balances[1]} BIC</CardText>
                            </CardBody>
                            <CardBody>
                                <Button>Transfer 1 BIC to user 1</Button>
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
                                <Button>Mint 1000 BIC to user 1</Button>
                                <Button>Mint 1000 BIC to user 2</Button>
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

import {useState} from 'react';
import {Col, Row, Label, Button, Container} from 'reactstrap';
import {web3, Wallet, Provider} from '@project-serum/anchor';
import Base58 from 'base-58';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

function App() {
    // State
    const testMasterSecretKey = 'EGeG7Q6j8DedNW1ayFJW6a1eqUYCVobJ3CkKMxGPUb3vZLfHJhYDy2YrY8bwrNy2kZvqRPduFn8KXUUxJtqEPB3'
    const testRecoverSecretKey = '5rfnMoHXULH1fvcvdeBNwNLCJjDrNjd5UoqQZiNxzxJ1DFXTAWj8HRJNzxh4kaoeSnjZvaGZ8yLYAvuX7W1SEfxQ'
    const bicSpl = null
    const [newKeypair, setNewKeypair] = useState({})
    const testMasterWallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode(testMasterSecretKey)))
    const testRecoverWallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode(testRecoverSecretKey)))
    const connection = new web3.Connection("http://127.0.0.1:8899/")
    // const testMasterKeyProvider = new Provider(connection, testMasterWallet, {})

    // const user1Wallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode('4EHnNBG9jfvU2RE5bgXd9Fzn6bbKTnDdvVeQmJScpLTFyMyAy7QcLdnLuxEz7fqJLbHdZg6pZggGmumPX8hbA5Qg')))
    // const user2Wallet = new Wallet(web3.Keypair.fromSecretKey(Base58.decode('4TQEhMh7ujM8yoEKxEv6d5dWciCPhErAMP2FuLS2xTX9B3VrwZUDJVubVVby46yQGkcmWD2vvcv7pyrQDJxu96yb')))
    const bicPublicKey = 'DM6TvKdR7izbUqEb9xEdA77he9t6vimiKZT6Lqvt24YV'

    // Logic function
    const createBic = async () => {
        const mint = web3.Keypair.generate();
        console.log('mint: ', mint.publicKey.toBase58())
        console.log('lamport: ', await connection.getMinimumBalanceForRentExemption(82))
        let instructions = [
            web3.SystemProgram.createAccount({
                fromPubkey: testRecoverWallet.publicKey,
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
        tx.feePayer = testMasterWallet.payer.publicKey
        console.log('testMasterWallet.payer.publicKey: ', testMasterWallet.payer.publicKey.toBase58())

        // tx.feePayer = testRecoverWallet.payer.publicKey
        console.log('testRecoverWallet.payer.publicKey: ', testRecoverWallet.payer.publicKey.toBase58())

        tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash

        await testMasterWallet.signTransaction(tx)
        // await testRecoverWallet.signTransaction(tx)
        // console.log('tx: ', tx)

        tx.partialSign(testMasterWallet.payer)
        tx.partialSign(testRecoverWallet.payer)
        // tx.partialSign(mint)
        console.log('tx: ', tx)
        // const rec = await testMasterKeyProvider.send(tx)
        // console.log('rec: ', rec)
        const rawTx = tx.serialize()

        console.log('rawTx: ', rawTx)
        const receipt = await connection.sendRawTransaction(rawTx)
        console.log('receipt: ', receipt)
        alert(`create bic success bic address: ${mint.publicKey.toBase58()}`)
        // const txResult = await testMasterKeyProvider.send(tx)
        // console.log('txResult: ', txResult)

    }
    // Effect function

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
                {bicSpl ? <div>

                    </div> : <div>
                        <Button onClick={() => createBic()}>Create BIC</Button>

                    </div>
                }
            </Row>
            <Row>

            </Row>
        </div>
    );
}

export default App;

import {useState} from 'react';
import {Col, Row, Label, Button, Container} from 'reactstrap';
import {web3, Wallet, Provider} from '@project-serum/anchor';
import Base58 from 'base-58';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

function App() {
    // State
    const testMasterSecretKey = 'EGeG7Q6j8DedNW1ayFJW6a1eqUYCVobJ3CkKMxGPUb3vZLfHJhYDy2YrY8bwrNy2kZvqRPduFn8KXUUxJtqEPB3'
    const testMasterRecoverKey = '5rfnMoHXULH1fvcvdeBNwNLCJjDrNjd5UoqQZiNxzxJ1DFXTAWj8HRJNzxh4kaoeSnjZvaGZ8yLYAvuX7W1SEfxQ'
    const bicSpl = null
    const [newKeypair, setNewKeypair] = useState({})
    const testMasterSecretKeyProvider = new Wallet(web3.Keypair.fromSecretKey(Base58.encode("testMasterSecretKey")))
    // Logic function
    const createBic = async () => {
        const mint = web3.Keypair.generate();
        const keypair = web3.Keypair.generate()
        const lamportss = await Provider.connection.getMinimumBalanceForRentExemption(82)
        console.log('lamportss: ', lamportss)
        let instructions = [
            web3.SystemProgram.createAccount({
                fromPubkey: keypair.publicKey,
                newAccountPubkey: mint,
                space: 82,
                lamports: await Provider.connection.getMinimumBalanceForRentExemption(82),
                programId: TOKEN_PROGRAM_ID,
            }),
            Token.createInitMintInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                0,
                testMasterSecretKeyProvider.publicKey,
                null
            ),
        ];
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

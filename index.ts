import { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  Transaction 
} from '@solana/web3.js';
import axios from 'axios';
import bs58 from 'bs58';

// 1. الإعدادات الأساسية وعناوين Jito
const JITO_DEVNET_URL = 'https://devnet.block-engine.jito.wtf/api/v1/bundles';
const JITO_TIP_ACCOUNT = new PublicKey('Cw8CFyTXAx9E6Yg8g33ztE5f4JpycH6s48cfB9S4xgxt'); // حساب Devnet Tip

async function sendJitoBundle() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // 2. محفظة الباحث (Searcher Keypair)
    // استبدل هذا بمفتاحك الخاص الآمن لاحقاً
    const searcherKeypair = Keypair.generate(); 

    console.log("تجهيز المعاملات داخل الحزمة...");

    // 3. بناء معاملة الـ MEV الخاصة ببروتوكول Dollar1usd (مثال: arbitrage أو swap)
    const mevTransaction = new Transaction();
    // (أضف التعليمات البرمجية الخاصة ببروتوكولك هنا...)

    // 4. بناء معاملة البخشيش (Jito Tip Transaction)
    const tipTransaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: searcherKeypair.publicKey,
            toPubkey: JITO_TIP_ACCOUNT,
            lamports: 100000, // قيمة الـ Tip بالـ Lamports
        })
    );

    // 5. جلب أحدث Blockhash وتوقيع المعاملات
    const { blockhash } = await connection.getLatestBlockhash();
    
    mevTransaction.recentBlockhash = blockhash;
    mevTransaction.feePayer = searcherKeypair.publicKey;
    mevTransaction.sign(searcherKeypair);

    tipTransaction.recentBlockhash = blockhash;
    tipTransaction.feePayer = searcherKeypair.publicKey;
    tipTransaction.sign(searcherKeypair);

    // 6. تحويل المعاملات الموقعة إلى صيغة Base58 المطلوبة من Jito
    const serializedMevTx = bs58.encode(mevTransaction.serialize());
    const serializedTipTx = bs58.encode(tipTransaction.serialize());

    // 7. إرسال الحزمة عبر الـ RPC الخاص بـ Jito Block Engine
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [
            [serializedMevTx, serializedTipTx] // ترتيب التنفيذ من اليسار إلى اليمين
        ]
    };

    try {
        console.log("جاري إرسال الحزمة إلى Jito Block Engine...");
        const response = await axios.post(JITO_DEVNET_URL, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log("تم إرسال الحزمة بنجاح! معرف الحزمة (Bundle ID):", response.data.result);
    } catch (error) {
        console.error("خطأ أثناء إرسال الحزمة:", error);
    }
}

sendJitoBundle();

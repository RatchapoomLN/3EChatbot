const functions = require("firebase-functions");
const request = require("request-promise");
const config = require("./config.json");

//[1]เพิ่ม dialogflow-fulfillment library
//[7] เพิ่ม Payload
const { WebhookClient, Payload } = require("dialogflow-fulfillment");

//[8] เพิ่ม firebase-admin และ initial database
const firebase = require("firebase-admin");
firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: config.databaseURL
});
var db = firebase.firestore();

//ตั้งค่า region และปรับ timeout และเพิ่ม memory
const region = "asia-east2";
const runtimeOptions = {
  timeoutSeconds: 4,
  memory: "2GB"
};

//ทำ webhook request url
exports.webhook = functions
  .region(region)
  .runWith(runtimeOptions)
  .https.onRequest(async (req, res) => {
    console.log("LINE REQUEST BODY", JSON.stringify(req.body.originalDetectIntentRequest.payload.data.source.userId));
    console.log("DATA", JSON.stringify(req.body));
    const UUID = req.body.originalDetectIntentRequest.payload.data.source.userId;
    
    //[2] ประกาศ ตัวแปร agent
    const agent = new WebhookClient({ request: req, response: res });
//Register สมัครสมาชิก
      const cityRef = db.collection('Member').doc(UUID);
    const doc = await cityRef.get();
      if (!doc.exists) {
       console.log('No such document!');
       const data = {
        Id : UUID,
        Coin : Number(0)
      };
      // Add a new document in collection "cities" with ID 'LA'
      const res = await db.collection('Member').doc(UUID).set(data);
      } else {
       console.log('Document data:', doc.data());
      }
//Register สมัครสมาชิก //End

//[4] ทำ function view menu เพื่อแสดงผลบางอย่างกลับไปที่หน้าจอของ bot
    const Bag = async agent => {
//[5] เพิ่ม flex message
//[9] แก้ไข flex message ให้ dynamic ได้
      return db
        .collection("Member").doc(UUID).get().then(snapshot => {
      let flexMenuMsg = {
        type: "flex",
        altText: "Flex Message",
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "โปรดตรวจสอบ ข้อมูลก่อนทำการโอน",
                weight: "bold",
                size: "md",
                color: "#CF9200FF"
              }
            ]
          },
          hero: {
            type: "image",
            url:"https://zxing.org/w/chart?cht=qr&chs=350x350&chld=L&choe=UTF-8&chl="+snapshot.data().Id,
            size: "xl",
            aspectMode: "cover"
          },
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              {
                type: "text",
                text: "3E Coin",
                size: "sm",
                weight: "bold"
              },
              {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: []
              }
            ]
          }
        }
      };

//[6] ปรับการตอบกลับ ให้ตอบกลับผ่าน flex message ด้วย Payload

      return db
        .collection("Member").doc(UUID).get().then(snapshot => {
          console.log("TEST DATA : " + JSON.stringify(snapshot))
          let itemData = {
            type: "box",
            layout: "baseline",
            spacing : "sm",
            contents: [
              {
                type: "text",
                text: snapshot.data().Id,
                size: "xxs",
                wrap: true,
              },
              {
                type: "text",
                text: snapshot.data().Coin + " Coin",
                size: "sm",
                align: "end",
                color: "#AAAAAA"
              }
            ]
          };
          flexMenuMsg.contents.body.contents[1].contents.push(itemData);
          const payloadMsg = new Payload("LINE", flexMenuMsg, {
            sendAsMessage: true
          });
          return agent.add(payloadMsg);
        })
      })
          .catch(error => {
            return response.status(500).send({
              error: error
            });
          });
        };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var uid = "";
const Send = async agent => {
  //[5] เพิ่ม flex message
  //[9] แก้ไข flex message ให้ dynamic ได้
        
        let flexSend = {
          "type": "text",
          "text": "** กรุณาส่ง ID Wallet **"
        };
        const payloadM = new Payload("LINE", flexSend, {
          sendAsMessage: true
        });
        return agent.add(payloadM);
      };
      ////////////////////////////////////////////////////
      console.log("test",req.body.originalDetectIntentRequest.payload.data.message.text[0]);
if(req.body.originalDetectIntentRequest.payload.data.message.text[0] =="U"){
const Textu = req.body.originalDetectIntentRequest.payload.data.message.text;
const city = db.collection('Member').doc(Textu);
const doc = await city.get();
  if (!doc.exists) {
   console.log('UID',Textu);
   lineReply(
    { type: "text", text: "ไม่พบ ID Wallet ที่คุณจะส่ง กรุณาลองใหม่อีกครั้ง" }
  );
  }
  // Add a new document in collection "cities" with ID 'LA'
   else {
   Textu = uid;
   lineReply(
    { type: "text", text: "UID ที่จะส่งคือ",uid }
  );
  }}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      ////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //[3] ทำ intent map เข้ากับ function
    let intentMap = new Map();
    intentMap.set("My-Bag", Bag);
    intentMap.set("Send",Send);
    
    agent.handleRequest(intentMap);
  });



//function สำหรับ reply กลับไปหา LINE โดยต้องการ reply token และ messages (array)
const lineReply = (replyToken, messages) => {
  const body = {
    replyToken: replyToken,
    messages: messages
  };
  return request({
    method: "POST",
    uri: `${config.lineMessagingApi}/reply`,
    headers: config.lineHeaders,
    body: JSON.stringify(body)
  });
};
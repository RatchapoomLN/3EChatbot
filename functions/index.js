const functions = require("firebase-functions");
const request = require("request-promise");
const config = require("./config.json");

//เพิ่ม dialogflow-fulfillment library // เพิ่ม Payload
const { WebhookClient, Payload } = require("dialogflow-fulfillment");

// เพิ่ม firebase-admin และ initial database
const firebase = require("firebase-admin");
firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: config.databaseURL
});
var db = firebase.firestore();

//ตั้งค่า region และปรับ timeout และเพิ่ม memory
const region = "asia-southeast1";
const runtimeOptions = {
  timeoutSeconds: 4,
  memory: "2GB"
};

//ทำ webhook request url
exports.webhook = functions.region(region).runWith(runtimeOptions).https.onRequest(async (req, res) => {

    console.log("UserID ของคุณ", JSON.stringify(req.body.originalDetectIntentRequest.payload.data.source.userId));

    const UUID = req.body.originalDetectIntentRequest.payload.data.source.userId;
    //[2] ประกาศ ตัวแปร agent
    const agent = new WebhookClient({ request: req, response: res });

//Register สมัครสมาชิก
      const cityRef = db.collection('Member').doc(UUID);
    const doc = await cityRef.get();
      if (!doc.exists) {
       console.log('No such document!');
       const data = {
        Id : UUID,Coin : Number(0),send : "",givecoin : Number(),pass : ""
      };
      const res = await db.collection('Member').doc(UUID).set(data);
      } else {
       console.log('Document data:', doc.data());
      }
//Register สมัครสมาชิก //End

//[4] ทำ function view menu เพื่อแสดงผลบางอย่างกลับไปที่หน้าจอของ bot
    const viewMenu = async agent => {
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
                text: "My Bag กระเป๋าเหรียญ",
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
const fallback = async agent => {

 const textin = req.body.originalDetectIntentRequest.payload.data.message.text;// รับ input ผ่าน fallback
 const chack = db.collection('Member').doc(textin); //ตรวจสอบฐานข้อมูลของเจ้าของบัญชี
 const chacknow = await chack.get();//นำข้อมูลมาเปรียบเทียบ

 if(textin[0] =="U" && textin[32] !=""){////////เงื่อนไข UserID ที่มีในระบบและไม่มี
    if(!chacknow.exists){/////////////// ถ้า Userid ที่กรอกเข้ามาไม่ตรงกัน
      console.log("ไม่พบ UserID นี้");
      let flexsendf ={
        "type": "text",
        "text": "** ไม่พบ UserID นี้ **"
      };
    const payloadsendf = new Payload("LINE", flexsendf, {
      sendAsMessage: true
    });
    return agent.add(payloadsendf);
    }
    else{/////////////////// Userid ที่กรอกมา มีอยู่ใน database
    console.log(" UserID นี้สามารถใช้ได้",textin);
    db.collection("Member").doc(UUID).update({send : textin})
      let flexsend ={
        "type": "text",
        "text": "** UserID นี้สามารถใช้ได้ **\n** กรุณากรอกจำนวนเหรียญที่ต้องการโอน **",
      };
    const payloadsend = new Payload("LINE", flexsend, {
      sendAsMessage: true
    });
    return agent.add(payloadsend);
    }
  }

var num =parseInt(textin);///////แปลงค่า string เป็นค่า number (ตอนแรกตัวเลขเป็นค่า string)
console.log(doc.data().Coin);///////////////เช็คค่าเหรียญที่เรามี
console.log(doc.data().pass);///////////////เช็คค่า pass ว่ามันผ่านหรือไม่ ที่พร้อมจะแสดงหน้าโอน
console.log("เทส",num);////////////////////เทสค่า number ที่รับเข้ามา
  if(doc.data().Coin >=num){///////////////ตรวจสอบว่าเหรียญเรามีพอกับเหรียญที่ต้องการโอนหรือไม่ ถ้าพอ
      console.log("จำนวนนี้ใช้ได้",num);/////////////// พอที่จะโอน
      await db.collection("Member").doc(UUID).update({givecoin : Number(num),pass : "T"})
      return db.collection("Member").doc(UUID).get().then(snapshot => {
      let flexcoin ={
          "type": "flex",
          "altText":"Flex Message",
          "contents":{
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "โปรดตรวจสอบ ข้อมูลก่อนทำการโอน",
                  "weight": "bold",
                  "size": "md",
                  "color": "#CF9200FF"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": "https://3e-trading.com/assets/img/category/category_1586579923.png",
              "size": "xl",
              "aspectRatio": "20:13",
              "aspectMode": "cover",
              "backgroundColor": "#FFFFFFFF",
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ID Wallet",
                  "weight": "bold",
                  "size": "sm",
                  "align": "start",
                  "contents": []
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "spacing": "sm",
                  "margin": "xs",
                  "contents": [
                    {
                      "type": "box",
                      "layout": "vertical",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "จาก :"+snapshot.data().Id,
                          "size": "xs",
                          "color": "#AAAAAA",
                          "contents": []
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "horizontal",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "ส่งถึง :"+snapshot.data().send,
                          "size": "xs",
                          "color": "#AAAAAA",
                          "contents": []
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "horizontal",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "จำนวนเหรียญ :"+snapshot.data().givecoin,
                          "size": "xs",
                          "color": "#AAAAAA",
                          "contents": []
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "spacing": "sm",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "ยืนยัน",
                    "text": "ยืนยัน"
                  },
                  "height": "sm",
                  "style": "link"
                },
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "ยกเลิก",
                    "text": "ยกเลิก"
                  },
                  "height": "sm",
                  "style": "link"
                }
              ]
            }
            

          }
      };
    const payloadcoin = new Payload("LINE", flexcoin, {
      sendAsMessage: true
    });
    return agent.add(payloadcoin);
  })
    }
  else{/////////////// ไม่พอที่จะโอน
      console.log("เหรียญคงเหลือไม่เพียงพอ");
      let flexcoinf ={
        "type": "text",
        "text": "** เหรียญคงเหลือไม่เพียงพอ **\n** กรุณากรอกเหรียญที่เพียงพอต่อการโอน **",
      };
    const payloadcoinf = new Payload("LINE", flexcoinf, {
      sendAsMessage: true
    });
    return agent.add(payloadcoinf);
    }
          };
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const Comform = async agent => {

  const cityRef = db.collection('Member').doc(UUID);
  const doc = await cityRef.get();

  const textin = req.body.originalDetectIntentRequest.payload.data.message.text;// รับ input ผ่าน fallback
  const chacky = db.collection('Member').doc(doc.data().send);
  const chackyt = await chacky.get();//นำข้อมูลมาเปรียบเทียบ
  const chackT = doc.data().pass;
  var numi =parseInt(doc.data().Coin);
  var numy =parseInt(doc.data().givecoin);
  var numyt =parseInt(chackyt.data().Coin);

  console.log("มายังมาแล้วนะ");
  console.log(chackT);
  if(chackT == "T"){/////////////ตรวจว่ายืนยันตกลงแลกเปลี่ยนแล้ว
    console.log("โอนแล้วน้าาา");
    var nowcoin = numi-numy;
    var sendcoin = numyt+numy;
    console.log("test",nowcoin);
    console.log(sendcoin);
    db.collection("Member").doc(doc.data().send).update({Coin : Number(sendcoin) })
    db.collection("Member").doc(UUID).update({Coin : Number(nowcoin) })
    let flexcom ={
      "type": "template",
      "altText": "this is a buttons template",
      "template": {
        "type": "buttons",
        "thumbnailImageUrl": "https://3e-trading.com/assets/img/category/category_1586579923.png",
        "text": "   ** โอนเงินเรียบร้อยแล้วนะ **",
        "actions": [
          {
            "type": "message",
            "label": "สลิป",
            "text": "สลิป"
          }
        ]
      }
    };
  const payloadcom = new Payload("LINE", flexcom, {
    sendAsMessage: true
  });
  return agent.add(payloadcom);
  
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const slip = async agent => {

  return db.collection("Member").doc(UUID).get().then(snapshot => {
    let slipc ={
        "type": "flex",
        "altText":"Flex Message",
        "contents":{
          "type": "bubble",
          "direction": "ltr",
          "header": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "ประวัติการโอน",
                "weight": "bold",
                "size": "md",
                "color": "#CF9200FF"
              }
            ]
          },
          "hero": {
            "type": "image",
            "url": "https://3e-trading.com/assets/img/category/category_1586579923.png",
            "size": "xl",
            "aspectRatio": "20:13",
            "aspectMode": "cover",
            "backgroundColor": "#FFFFFFFF",
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "ID Wallet",
                "weight": "bold",
                "size": "sm",
                "align": "start",
                "contents": []
              },
              {
                "type": "box",
                "layout": "vertical",
                "spacing": "sm",
                "margin": "xs",
                "contents": [
                  {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "จาก :"+snapshot.data().Id,
                        "size": "xs",
                        "color": "#AAAAAA",
                        "contents": []
                      }
                    ]
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "ส่งถึง :"+snapshot.data().send,
                        "size": "xs",
                        "color": "#AAAAAA",
                        "contents": []
                      }
                    ]
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "จำนวนเหรียญ :"+snapshot.data().givecoin,
                        "size": "xs",
                        "color": "#AAAAAA",
                        "contents": []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
    };
  const payloadslipc = new Payload("LINE", slipc, {
    sendAsMessage: true
  });
  db.collection("Member").doc(UUID).update({givecoin : Number(0),pass : "",send : "" })
  return agent.add(payloadslipc);
})
           };


    
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const Comformf = async agent => {

  console.log("ยกเลิกแล้วน้าาาาา");
  db.collection("Member").doc(UUID).update({givecoin : Number(0),pass : "",send : "" })
  let flexcomf ={
    "type": "text",
    "text": "** ยกเลิกรายการแล้ว หากจะทำรายการอีกครั้งให้เริ่มสแกนใหม่ได้เลย! **",
  };
const payloadcomf = new Payload("LINE", flexcomf, {
  sendAsMessage: true
});
return agent.add(payloadcomf);
           };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //[3] ทำ intent map เข้ากับ function
    let intentMap = new Map();
    intentMap.set("My-Bag", viewMenu);
    intentMap.set("fallback", fallback);
    intentMap.set("Confirmform-Yes", Comform);
    intentMap.set("Confirmform-No", Comformf);
    intentMap.set("slip", slip );
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
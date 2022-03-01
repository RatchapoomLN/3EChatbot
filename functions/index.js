//ฟังก์ชั่นภายนอก
const functions = require('firebase-functions');
const request = require("request-promise");
const axios = require("axios");



//databaseUrl
const databaseul = "https://e-coin-64820.firebaseio.com";

//ตั้งค่า region และปรับ timeout และเพิ่ม memory
const region = "asia-southeast1";
const runtimeOptions = {
  timeoutSeconds: 4,
  memory: "2GB"
};

//[8] เพิ่ม firebase-admin และ initial database
const firebase = require("firebase-admin");
firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: databaseul
});
var db = firebase.firestore();



//LINE
const LINE_MESSAGING_API = "https://api.line.me/v2/bot";
const LINE_ACCESS_TOKEN = 'zgVGiHj9jEbJhPrlqp8N17kTb7QKgnjruqiUNSX3hMazgKe0LhWMKp0CLayR4eWva8OIe5T+vOrwaK3R1Lfyx4CG6k63zwvCHK28GfcQYw9msAO9xaSN9Qj4EsJ4k6wg6pT2Q8VqPfjlnTn9o9WTugdB04t89/1O/w1cDnyilFU=';
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${LINE_ACCESS_TOKEN}`
};

//////////////////*************///////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.lineBot = functions.region(region).runWith(runtimeOptions).https.onRequest(async(request, response) => {

  //Out put Test บน Webhook (firebase)
  console.log(request.body.events[0].source.userId); //Userid
  const UUID = request.body.events[0].source.userId; //ประกาศตัวแปร Userid
  console.log(request.body.events[0].message.text); //input line
  const Textin = request.body.events[0].message.text;//ประกาศตัวแปร input line

//Register สมัครสมาชิก
const cityRef = db.collection('Member').doc(UUID);
const doc = await cityRef.get();
  if (!doc.exists) {
   console.log('ไม่พบข้อมูลจะทำการเพิ่มข้อมูลไอดีนี้ให้');
   const data = {
    Id : UUID,
    Coin : Number(0)
  };
  const res = await db.collection('Member').doc(UUID).set(data);} 
  else {
   console.log('Document data:', doc.data());//แสดงข้อมูลของ Userid นี้
  }
//Register สมัครสมาชิก //End


  if (request.method === "POST") {
    const messageType = request.body.events[0].message.type;

    if (messageType == 'text') {
      const textMessage = request.body.events[0].message.text;

    }
  }
  
//////////************************//////////

let data = {
  replyToken: token,
  messages: [{
    type: 'text',
    text: 'Hello World'
  }]
};

if(Textin == 'รับเหรียญ'){
  axios.post('https://api.line.me/v2/bot/message/reply', data, {
    headers: headers
  }).then((res) => {
    console.log(res)
  }).catch((error) => {
    console.log(error)
  });
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
return response.status(200).send(request.method)
});

const reply = (token, payload) => {
  return axios({
    method: "post",
    url: `${LINE_MESSAGING_API}/message/reply`,
    headers: LINE_HEADER,
    data: JSON.stringify({
      replyToken: token,
      messages: [payload]
    })
  });
};
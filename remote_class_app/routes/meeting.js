const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();

const id = '7ab8b490-382b-492e-bb0a-9324c3f9f86a'; // replace with your app id from the dashboard
const secret = 'S6MaSxEOJoQlM9JnfgowvhVbdsWIV9bz4WKW7fsftzc='; // replace with your own secret from the dashboard


//Meeting_Infomation
let channelName = "";
let deskRows = 10;
let deskCols = 5;
let teacher_audio_id;
let teacher_video_id;

const deskInfo = [];
for (let i = 0; i < deskRows * deskCols; i++) {
  deskInfo.push({desknum : i + 1, name : ""});
}

/* GET home page. */
router.get('/join_teacher', function(req, res, next) {
  res.render('meeting/join_teacher.ejs', { 
    title: 'Meeting Top Page',
    form : {
      channelName : "",
      memberName : "",
      deskColumns : "",
      deskRaws : ""
    }
  });
});

router.post('/join_teacher', function(req, res, next) {
  const request = req;
  const response = res;

  channelName = request.body.channelName;
  const memberName = request.body.memberName;
  deskCols = request.body.deskCols;
  deskRows = request.body.deskRows;
  let job = "teacher";
  const form = {
    channelName,
    memberName,
    deskInfo,
    job
  }

  response.render('meeting/meeting.ejs', {
    title : "meeting",
    form,
  });

});

router.get('/join', function(req, res, next) {
  res.render('meeting/join.ejs', { 
    title: 'Meeting Top Page',
    form : {
      channelName : "",
      memberName : "",
      myChair : "",
      deskInfo
    }
  });
});

router.post('/join', (req, res, next) => {
  const request = req;
  const response = res;
    
  const channelName = request.body.channelName;
  const memberName = request.body.memberName;
  const myChair = request.body.myChair;
  let job = "teacher";
  deskInfo[myChair - 1].name = memberName;
  const form = {
    channelName,
    memberName,
    deskInfo,
    job
  }

  response.render('meeting/meeting.ejs', {
    title : "meeting",
    form,
  });

});

router.post('/getToken', (req, res, next) => {
  console.log("getTokenのPOST処理を行います。");
  const response = res;
  const request = req;
  const sessionToken = request.body.sessionToken;
  const channelName = request.body.channelName;
  const memberName = request.body.memberName;
  
  // CORS設定（クロスオリジンリクエストを許可）
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json');

  //sessionTokenのチェックを行う
  if(sessionToken != '4CXS0f19nvMJBYK05o3toTWtZF5Lfd2t6Ikr2lID') { 
    res.status(401).send('Authentication Failed');
  } else {
    console.log("sessionの確認が取れました。")
  }
  const makeToken = () => {
    const iat = Math.floor(Date.now() / 1000);
    const exp = Math.floor(Date.now() / 1000) + 36000; // 10h=60*60*10
    return calculateAuthToken("*", "*", iat, exp);
  }
  const tokenToSend = JSON.stringify(makeToken)
  const credential = {
    authToken: makeToken()
  };

  // データをクライアント（静的プログラム）に送信
  res.send(credential);
});
router.post('/getDeskInfo', (req, res, next) => {

  const deskInformation = {
    deskInfo
  };
  console.log(deskInformation);

  // データをクライアント（静的プログラム）に送信
  res.send(deskInformation);
});

router.post('getClassroom', (req, res, next) => {
  console.log("getClassroomのPOST処理を行います。");
  
  console.log("getClassroomのPOST処理を行いました。");
})


const calculateAuthToken = (channelName, memberName, iat, exp) => {
  return jwt.sign({
    jti: crypto.randomUUID(),
    iat: iat,
    exp: exp,
    scope: {
      app: {
        id: id,
        turn: true,
        actions: ["read"],
        channels: [
          {
            id: "*",
            name: channelName,
            actions: ["write"],
            members: [
              {
                id: "*",
                name: memberName,
                actions: ["write"],
                publication: {
                  actions: ["write"],
                },
                subscription: {
                  actions: ["write"],
                },
              },
            ],
            sfuBots: [
              {
                actions: ["write"],
                forwardings: [
                  {
                    actions: ["write"]
                  }
                ]
              }
            ]
          },
        ],
      },
    },
  }, secret);
}

module.exports = router;
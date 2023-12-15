//エレメントの取得
const ClassroomCanvas = document.getElementById('classroomCanvas');
const DirectionalCanvas  =document.getElementById('directionCanvas');

//canvasコンテキストの取得
const class_ctx = ClassroomCanvas.getContext('2d');
const dir_ctx = DirectionalCanvas.getContext('2d');

//ズームの設定を行うパラメータ
const ZoomScale = 2 //ズームする倍率

const zoomedX = ClassroomCanvas.width / 3;
const zoomedY = ClassroomCanvas.height / 3;
const zoomedWidth = ClassroomCanvas.width / 3;
const zoomedHeight = ClassroomCanvas.height / 3;

let zoomflag = false;
let originalImageData = null;
let desk_obj = [];



//HTTPリクエストのURL
const getToken_url = "/meeting/getToken";
const getDeskInfo_url = "/meeting/getDeskInfo"

//作成したイベント
const fetchAuthTokenEventName = "fetchAuthTokenEvent";
const fetchDeskInfoEventName = "fetchDeskInfoEvent";
const hitStudentEventName = "hitStudentEventName"; 

//作成したイベントのイベントとしての登録
const fetchAuthTokenEvent = new Event(fetchAuthTokenEventName);
const fetchDeskInfoEvent= new Event(fetchDeskInfoEventName)
const hitStudentEvent = new Event(hitStudentEventName);

//Skywayのクラスを擬似的なimport
const { uuidV4, nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory} = skyway_room;
const socket = io();
//fetchする際のパラメータの記述
const fetchParam = {
	method : 'POST',
	headers: {
    'Content-Type': 'application/json',
  }
}

let deskInfo;

//ページがロードされた際の処理
window.onload = () => {
	let getToken = "kimono"; //受け取ったトークンを受け取る変数
	const header = document.getElementById('header');
	const roomName = header.children[1].children[0].textContent;
	const myName = header.children[2].children[0].textContent;
	
	getDeskInfo();
    // drawDirectionalArc(DirectionalCanvas, "rgba(255, 0, 0, 0.3)", desk_obj[22].x, desk_obj[22].y, 150);

	const authentication = async () => {
		fetchParam.body = JSON.stringify({
			sessionToken : '4CXS0f19nvMJBYK05o3toTWtZF5Lfd2t6Ikr2lID',
			channelName : roomName,
			memberName : myName
		});
		await fetch(getToken_url, fetchParam)
			.then(response => {
				console.log("Tokenをゲットするfetch()を行いました。");
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(credential => {
				console.log("authToken : " + credential.authToken);
				getToken = credential.authToken;
				document.dispatchEvent(fetchAuthTokenEvent);
			})
			.catch(error => {
				console.log('Fetchエラー:', error);
			});
	}
	authentication();
	getDeskInfo();

	//tokenをフェッチしてきた際にルームが作成されるようにする。
	document.addEventListener(fetchAuthTokenEventName, async () => {
		const token = getToken;

		const localVideo = document.getElementById('local-video');
		const buttonArea = document.getElementById('button-area');
		const myId = document.getElementById('my-id');
		const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream(
			{
				video: { 
					height: 640,
					width: 360, 
					frameRate: 15 
				},
			}
		);
	
		const joinMeeting = async () => {
			console.log("joinMeeting()を実行します。");
			const context = await SkyWayContext.Create(token);
			console.log("contextを作成");
			const room = await SkyWayRoom.FindOrCreate(context, {
				type:'p2p',
				name : roomName
			});
			console.log("roomを作成");
	
			const member = await room.join();
			console.log(myName + "さんが入室しました。");
			myId.children[0].textContent=member.id;
	
			console.log("publishを試みます。");
			await member.publish(audio);
			await member.publish(video, {
				encodings: [
					// 複数のパラメータをセットする
					{ maxBitrate: 10_000, scaleResolutionDownBy: 8 },
					{ maxBitrate: 680_000, scaleResolutionDownBy: 1 },
				],
				maxSubscribers : 99,
			});
			console.log("publishが正常に実行されました。");
			
			const subscribeAndAttach = (publication) => {
				if (publication.publisher.id === member.id) return;
	
				const subscribeButton = document.createElement('button');
				const unsubscribeButton = document.createElement('button');
	
				subscribeButton.textContent = `subscribe :  ${publication.publisher.id}: ${publication.contentType}`;
				unsubscribeButton.textContent = `unsubscribe : ${publication.publisher.id}: ${publication.contentType}`;
	
				subscribeButton.className = `${publication.publisher.id}`;
				unsubscribeButton.className = `${publication.publisher.id}`;
	
	
				buttonArea.appendChild(subscribeButton);
				buttonArea.appendChild(unsubscribeButton);
	
				subscribeButton.onclick = async () => {
					console.log("subscribeButton()が押されました。");
					const { subscription, stream } = await member.subscribe(publication.id);
					let newMedia;
					switch (stream.track.kind) {
						case 'video':
							newMedia = document.createElement('video');
							newMedia.playsInline = true;
							newMedia.autoplay = true;
							break;
						case 'audio':
							newMedia = document.createElement('audio');
							newMedia.controls = true;
							newMedia.autoplay = true;
							newMedia.style.display = "none";
							break;
						default:
							return;
					}
					unsubscribeButton.onclick = async () => {
						console.log("unsunscribeButton()が押されました。");
						member.unsubscribe(subscription.id);
						newMedia.remove();
						console.log("unsunscribeButton()が正常に実行されました。");
					}
					newMedia.className = `${publication.publisher.id}_remoteMedia`;
					stream.attach(newMedia);
					remoteMediaArea.appendChild(newMedia);
					console.log("subscribeButton()が実行されました。");
				};
	
			};
	
			const deleteSubscribeAndUnsubscribe = (member) => {
				console.log("イベントが発火されました。");
	
				let buttons = document.getElementsByClassName(member.id);
				let remoteMedias = document.getElementsByClassName(member.id + "_remoteMedia");
	
				for(let i=0, len=buttons.length; i < len; i++){
					console.log(buttons[i]);
					buttons[i].remove();
				}
	
				for(let i=0, len=remoteMedias.length; i < len; i++){
					console.log(remoteMedias[i]);
					remoteMedias[i].remove();
				}
				
				
				console.log("イベントの発火が終了しました。");
	
			}
			
			room.onMemberLeft.add((e) => deleteSubscribeAndUnsubscribe(e.member));
			room.onClosed.add((e) => deleteSubscribeAndUnsubscribe(e.member));
	
			room.publications.forEach(subscribeAndAttach);
			room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
	
			console.log("joinMeeting()を実行しました。");
		}
		
		joinMeeting();
		video.attach(localVideo); // 3
		await localVideo.play(); // 4

	});
}

document.addEventListener(hitStudentEventName, async () => {
    console.log("\n\n\n\n");
    console.log("test");
    console.log("\n\n\n\n");
})

//classroomを描画する関数
function drawClassroom() {
	// 描画領域のクリアを行う
	class_ctx.clearRect(0, 0, ClassroomCanvas.width, ClassroomCanvas.height);

	// 背景を描画
	drawBackGround()
    
	// 教卓を描画
	drawTeacherDesk()
    
	//生徒の机を描画
	drawStudentsDesk()

	//接触判定の机の点
	drawCollisionDetectionPoints()
	

	function drawBackGround() {
        class_ctx.fillStyle = 'lightblue'; // 背景色
	    class_ctx.fillRect(0, 0, ClassroomCanvas.width, ClassroomCanvas.height);
    }
	function drawTeacherDesk() {
        class_ctx.fillStyle = 'brown'; // 教卓の色
        //真ん中に描画するためのパラメータ
        const teachingDeskStartPointX = ClassroomCanvas.width / 3;
        const teachingDeskStartPointY = ClassroomCanvas.height / 20;
        const teachingDeskSizeX = ClassroomCanvas.width / 3;
        const teachingDeskSizeY = ClassroomCanvas.height / 12;
        class_ctx.fillRect(teachingDeskStartPointX, teachingDeskStartPointY, teachingDeskSizeX, teachingDeskSizeY); // 教卓の位置とサイズを指定
    }
	function drawStudentsDesk() {
		const deskStartPointX = ClassroomCanvas.width / 8;
		const deskStartPointY = ClassroomCanvas.height / 6;
	
		const deskRows = 10; // 行数
		const deskCols = 5; // 列数
	
		const deskWidth = 5 * ( (3 * ClassroomCanvas.width) / (4 * deskCols) ) / 6; // 机の幅
		const deskHeight = 5 * ( (3 * ClassroomCanvas.height) / (4 * deskRows) ) / 6;// 机の高さ
		const deskGapWidth =  (3 * ClassroomCanvas.width) / (4 * (deskCols - 1) ) / 6;
		const deskGapHeight = ( (3 * ClassroomCanvas.height) / (4 * deskRows) ) / 6;
		
		
		let nums = 0;
		// 机を並べて描画
		console.log(deskInfo);
		for (let row = 0; row < deskRows; row++) {
			for (let col = 0; col < deskCols ; col++) {
				nums += 1;
				class_ctx.fillStyle = 'green'; // 生徒の机の色
				const x = deskStartPointX + col * (deskWidth + deskGapWidth); // 机のX座標
				const y = deskStartPointY + row * (deskHeight + deskGapHeight); // 机のY座標
				class_ctx.fillRect(x, y, deskWidth, deskHeight); // 机を描画
				class_ctx.fillStyle = "black";
				class_ctx.fillText(nums + ' : ' + deskInfo[nums - 1].name, x + deskGapWidth, y + deskGapHeight);
				desk_obj.push({x: (deskWidth / 2 + x), y : (deskHeight / 2 + y) })
			}
		}
	}
	function drawCollisionDetectionPoints() {
		for(let num = 0, len = desk_obj.length; num < len; num ++) {
			drawPoints(ClassroomCanvas, "red", desk_obj[num].x, desk_obj[num].y, 2)
		}
	}
}
function drawDirectionalArc(canvas, color, x, y, radius) {
	const dctx = canvas.getContext('2d');
    const rotationChanger = document.getElementById("fanRotationRange");
    const sizeChanger = document.getElementById("fanSizeRange");
	//扇形の初期設定
	const ArcParam = {
		centerX: x,
		centerY: y,
		fanRadius: radius,
		fanColor: color,
		startAngle: Math.PI / 2,
		fanAngle:  Math.PI / 3,
		endAngle: null,
        rotation: 0
	};
	ArcParam.endAngle = ArcParam.startAngle + ArcParam.fanAngle;
	
    //ヒット判定を行う点
	const desknum = 29;
	const px = desk_obj[desknum - 1].x;
	const py = desk_obj[desknum - 1].y;
	function calcAngleAll() {
		for (let i = 0; i < desk_obj.length; i++) {
			console.log("");
			console.log(i + 1 + "の机との値");
			console.log("centerX : " + ArcParam.centerX);
			console.log("centerY : " + ArcParam.centerY);
			console.log("pointX : " + desk_obj[i].x );
			console.log("pointY : " + desk_obj[i].y );
			console.log("angle : " + Math.atan2(desk_obj[i].x - ArcParam.centerX, desk_obj[i].y - ArcParam.centerY) * 180 / Math.PI);
			console.log("");
		}
	}
	// calcAngleAll();
	function drawFan() {
		dctx.clearRect(0, 0, canvas.width, canvas.height);
		dctx.save();
		dctx.translate(ArcParam.centerX, ArcParam.centerY);
        dctx.rotate(ArcParam.rotation);
		dctx.beginPath();
		dctx.moveTo(0, 0);
		dctx.arc(0, 0, ArcParam.fanRadius, ArcParam.startAngle, ArcParam.endAngle);
		dctx.lineTo(0, 0);
		dctx.closePath();
		dctx.fillStyle = ArcParam.fanColor;
		dctx.fill();
		dctx.restore();
	}
	function calcAngleRadianToDegree(angle) {
		return 180 * angle / Math.PI;
	}
	function isHitStudents(pointX, pointY) {
		drawPoints(DirectionalCanvas, "rgba(255, 255, 0, 0.5)" , pointX, pointY, 20);
		//ある点と扇形の中心との距離を求める。
		const point_distance = Math.sqrt((pointX - ArcParam.centerX) ** 2 + (pointY - ArcParam.centerY) ** 2);
		console.log("point_distance : " + point_distance);
		const angle = Math.atan2(pointX - ArcParam.centerX, pointY - ArcParam.centerY);
		console.log("centerX : " + ArcParam.centerX);
		console.log("centerY : " + ArcParam.centerY);
		console.log("pointX : " + pointX);
		console.log("pointY : " + pointY);
		console.log("angle : " + calcAngleRadianToDegree(angle));

		console.log("");
		console.log("radius : " + ArcParam.fanRadius);
		console.log("startAngle : " + calcAngleRadianToDegree(ArcParam.startAngle));
		console.log("fanAngle : " + calcAngleRadianToDegree(ArcParam.fanAngle));
		console.log("rotation : " + calcAngleRadianToDegree(ArcParam.rotation));
		console.log("");

		//ある点が半径内にあるかを判定
		if (point_distance <= ArcParam.fanRadius) {
			console.log("半径が届く位置にある。");
			//角度が描画している扇形の角度内にあるか
			const rotationPoint = ArcParam.rotation;

			if(angle >= ArcParam.rotation && angle <= rotationPoint + ArcParam.fanAngle) {
				console.log("角度以内にある");
                document.dispatchEvent(hitStudentEvent);
				return true;
			} else {
				console.log("角度以内にない");
			}
		} else {
			console.log("半径が届く位置にない。")
		}
		return false;
	}

    rotationChanger.addEventListener('input', () => {
        ArcParam.rotation = parseInt(rotationChanger.value) * (Math.PI / 180); // ラジアンに変換
        drawFan();
		isHitStudents(px, py);
    })
    sizeChanger.addEventListener('input', () => {
        ArcParam.fanRadius = sizeChanger.value;
        drawFan();
    })
    drawFan();
}
//canvasを指定して、点を描画するもの
function drawPoints(canvas, color, x, y, radius) {
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = color;
	// 円を描画する前にパスを開始
	ctx.beginPath();
	
	// 指定された点を中心とする円を描画
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	
	// 円を塗りつぶす場合は以下の行を有効化
	ctx.fill();
  
	// 円を描画する
	ctx.stroke();
}

async function getDeskInfo(){
	fetchParam.body = JSON.stringify({deskInfo});
	await fetch(getDeskInfo_url, fetchParam)
			.then(response => {
				console.log("deskInfoをゲットするfetch()を行いました。");
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(deskInformation => {
				console.log("deskInfo : " + deskInformation.deskInfo);
				deskInfo = deskInformation.deskInfo;
				document.dispatchEvent(fetchDeskInfoEvent);
			})
			.catch(error => {
				console.log('Fetchエラー:', error);
			});
	
	drawClassroom();

}


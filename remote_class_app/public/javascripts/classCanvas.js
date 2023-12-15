//HTTPリクエストのURL
const getDeskInfo_url = "/meeting/getDeskInfo"

//作成したイベント
const fetchDeskInfoEventName = "fetchDeskInfoEvent";

//作成したイベントのイベントとしての登録
const fetchDeskInfoEvent= new Event(fetchDeskInfoEventName);

const socket = io();

//エレメントの取得
const ClassroomCanvas = document.getElementById('classroomCanvas');

//canvasコンテキストの取得
const class_ctx = ClassroomCanvas.getContext('2d');

let deskInfo;
getDeskInfo();

//classroomを描画する関数
function drawClassroom() {
    const desk_obj = [];
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
        class_ctx.fillStyle = "#E2EEFE"; // 背景色
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
		for (let row = 0; row < deskRows; row++) {
			for (let col = 0; col < deskCols ; col++) {
				nums += 1;
				class_ctx.fillStyle = 'green'; // 生徒の机の色
				const x = deskStartPointX + col * (deskWidth + deskGapWidth); // 机のX座標
				const y = deskStartPointY + row * (deskHeight + deskGapHeight); // 机のY座標
				class_ctx.fillRect(x, y, deskWidth, deskHeight); // 机を描画
				class_ctx.fillStyle = "black";
				class_ctx.fillText('name : ' + nums, x + deskGapWidth, y + deskGapHeight);
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

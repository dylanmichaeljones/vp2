	const express = require("express");
const dateTime = require("./dateTime");
const fs = require("fs");
//et saada k6ik p2ringud k2tte
const bodyparser = require("body-parser");
//andmebaasi andmed
const dbInfo = require("../../vp2024config");
//andmebaasiga suhtlemine
const mysql = require("mysql2");
//fotode yleslaadimiseks
const multer = require("multer");
//fotomanipulatsiooniks
const sharp = require("sharp");

const app = express();

//m22ran view mootori
app.set("view engine", "ejs");
//m22ran avalike failide kausta
app.use(express.static("public"));
//kasutame body-parserit p2ringute parsimiseks (kui ainult tekst, siis false, kui ka pildid jms, siis true
app.use(bodyparser.urlencoded({extended: true}));
//seadistame fotode yleslaadimiseks vahevara (middleware), mis m22rab kataloogi, kuhu laetakse
const upload = multer({dest: "./public/gallery/orig"});

//loon andmebaasiyhenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

app.get("/", (req, res)=>{
	//res.send("Express läks käima!");
	//console.log(dbInfo.configData.host);
	res.render("index");
});

app.get("/timenow", (req, res)=>{
	const dateNow = dateTime.dateFormattedEt();
	const weekDayNow = dateTime.weekDayEt();
	const timeNow = dateTime.timeFormattedEt();
	res.render("timenow",{nowWD: weekDayNow, nowD: dateNow, nowT: timeNow
	});
});

app.get("/vanasonad", (req, res)=>{
	let folkWisdom = [];
	fs.readFile("public/textfiles/vanasonad.txt", "utf8", (err, data)=>{
		if(err){
			throw err;
		}
		else {
			folkWisdom = data.split(";");
			res.render("justlist", {h2: "Vanasõnad", listData: folkWisdom
			});
		}
	});
});

app.get("/regvisit", (req, res)=>{
	res.render("regvisit");
});

app.post("/regvisit", (req, res)=>{
	//console.log(req.body);
	//avan txt faili selliselt, et kui seda pole olemas, luuakse
	const dateNow = dateTime.dateFormattedEt();
	const timeNow = dateTime.timeFormattedEt();
	fs.open("public/textfiles/log.txt", "a", (err, file) => {
		if(err){
			throw err;
		}
		else {
			fs.appendFile("public/textfiles/log.txt", req.body.firstNameInput + " " + req.body.lastNameInput + " " + timeNow + " " + dateNow + ";", (err)=>{
				if(err){
					throw err;
				}
				else {
					console.log("Faili kirjutati!");
					res.render("regvisit");
				}
			});
		}
	});
	//res.render("regvisit");
	});

app.get("/visitlog", (req, res)=>{
	let visitLog = [];
	fs.readFile("public/textfiles/log.txt", "utf8", (err, data)=>{
	if(err){
			throw err;
		}
		else {
			visitLog = data.split(";");
			res.render("visitlog", {h2: "Registreeritud külastused", listData: visitLog
			});
		}
	});
});

app.get("/regvisitdb", (req, res)=>{
	//res.render("regvisitdb");
	let notice = "";
	let firstName = "";
	let lastName = "";
	res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
});
app.post("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	//kontrollin kas k6ik vajalikud andmed on olemas
	if(!req.body.firstNameInput || !req.body.lastNameInput){
		//console.log("Osa andmeid puudub!");
		notice = "Osa andmeid on puudu!";
		firstName = req.body.firstNameInput;
		lastName = req.body.lastNameInput;
		lastName = req.body.lastNameInput;
		res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
	}
	else {
		let sqlReq = "INSERT INTO vp2visitlog (first_name, last_name) VALUES(?,?)";
		conn.query(sqlReq, [req.body.firstNameInput, req.body.lastNameInput], (err, sqlRes)=>{
			if(err){
				notice = "Tehnilistel p6hjustel andmeid ei sisestatud";
				res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
				throw err;
			}
			else {
				notice = "Andmed salvestati!";
				//res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
				res.redirect("/")
			}
		});
	}
});

app.get("/visitlogdb", (req, res)=>{
	let visitlogdb = []
	let sqlReq = "SELECT first_name, last_name FROM vp2visitlog";
	conn.query(sqlReq, (err, sqlRes)=>{
		if (err){
			throw err;
		}
		else {
			res.render("visitlogdb", {h2: "Registreeritud külastused (andmebaasist)", listData: sqlRes
			});
		}
	});
});

app.get("/eestifilm", (req, res)=>{
	res.render("eestifilm");
});

app.get("/eestifilm/tegelased", (req, res)=>{
	//loond andmebaasip2ringu
	let sqlReq = "SELECT first_name, last_name, birth_date FROM person";
	conn.query(sqlReq, (err, sqlRes)=>{
		if(err){
			res.render("tegelased", {persons: {first_name: "Ei", last_name: "leidnud", birth_date: "VIGA"}});
			//throw err;
		}
		else {
			//console.log(sqlRes);
			res.render("tegelased", {persons: sqlRes});
		}
	});
	//res.render("tegelased");
});

app.get("/eestifilm/filmid", (req, res)=>{
	let sqlReq = "SELECT title, production_year, duration FROM movie";
	conn.query(sqlReq, (err, sqlRes)=>{
		if(err){
			throw err;
		}
		else {
			res.render("filmid", {movies: sqlRes});
		}
	});	
});

app.get("/eestifilm/lisa", (req, res)=>{
	res.render("addmovieperson");
});


app.get("/photoupload", (req, res)=>{
	res.render("photoupload");
});

app.post("/photoupload", upload.single("photoInput"), (req, res)=>{
	console.log(req.body);
	console.log(req.file);
	const fileName = "vp_" + Date.now() + ".jpg";
	fs.rename(req.file.path, req.file.destination + "/" + fileName, (err)=>{
		console.log("Faili nime muutmise viga: " + err);
	});
	sharp(req.file.destination + "/" + fileName).resize(800, 600).jpeg({quality: 90}).toFile("./public/gallery/normal/" + fileName);
	sharp(req.file.destination + "/" + fileName).resize(100, 100).jpeg({quality: 90}).toFile("./public/gallery/thumb/" + fileName);
	//salvestame info andmebaasi
	let sqlReq = "INSERT into vp2photos (file_name, orig_name, alt_text, privacy, user_id) VALUES(?,?,?,?,?)";
	const userId = 1;
	conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId], (err, result)=>{
		if(err) {
			throw(err);
		}
		else {
			res.render("photoupload");
		}
	});
});

app.get("/gallery", (req, res)=>{
	let sqlReq = "SELECT file_name, alt_text FROM vp2photos WHERE privacy == ? AND deleted is NULL ORDER BY id";
	const privacy = 3;
	let photoList = [];
	conn.query(sqlReq, [privacy], (err, result)=>{
		if(err) {
			throw(err);
		}
		else {
			console.log(result);
			//photoList.push({href:
			//result.foreach(photo)=>{
				photoList.push({href: "gallery/thumb/" + photo.file_name, alt: photo.alt_text});
			}
			res.render("gallery", {listData: sqlRes});
		}
	});
}); 


app.listen(5206);
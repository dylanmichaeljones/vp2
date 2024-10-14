const express = require("express");
const dateTime = require("./dateTime");
const fs = require("fs");
//et saada k6ik p2ringud k2tte
const bodyparser = require("body-parser");
//andmebaasi andmed
const dbInfo = require("../../vp2024config");
//andmebaasiga suhtlemine
const mysql = require("mysql2");

const app = express();

//m22ran view mootori
app.set("view engine", "ejs");
//m22ran avalike failide kausta
app.use(express.static("public"));
//kasutame body-parserit p2ringute parsimiseks (kui ainult tekst, siis false, kui ka pildid jms, siis true
app.use(bodyparser.urlencoded({extended: false}));

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
	fs.open("public/textfiles/log.txt", "a", (err, file) => {
		if(err){
			throw err;
		}
		else {
			fs.appendFile("public/textfiles/log.txt", req.body.firstNameInput + " " + req.body.lastNameInput + ";", (err)=>{
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

app.get("/regvisitdb", (req, res)=>{
	res.render("regvisitdb");
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

app.get("/eestifilm/lisa", (req, res)=>{
	res.render("addperson");
});


app.listen(5256);
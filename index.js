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
//paroolide krypteerimiseks
const bcrypt = require("bcrypt");
//sessioonihaldur
const session = require("express-session");
//asynkroonsuse v6imaldaja
const asyn = require("async");

const app = express();

//m22ran view mootori
app.set("view engine", "ejs");
//m22ran avalike failide kausta
app.use(express.static("public"));
//kasutame body-parserit p2ringute parsimiseks (kui ainult tekst, siis false, kui ka pildid jms, siis true
app.use(bodyparser.urlencoded({extended: true}));
//seadistame fotode yleslaadimiseks vahevara (middleware), mis m22rab kataloogi, kuhu laetakse
const upload = multer({dest: "./public/gallery/orig"});
//sessioonihaldur
app.use(session({secret: "minuAbsoluutseltSalajaneVõti", saveUninitialized: true, resave: true
}));
//let mySession;

//loon andmebaasiyhenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

//uudiste osa eraldi ruuteriga
const newsRouter = require("./routes/newsRouter");
app.use("/news", newsRouter);

const movieRouter = require("./routes/movieRouter");
app.use("/eestifilm", movieRouter);

app.get("/", (req, res)=>{
	//res.send("Express läks käima!");
	//console.log(dbInfo.configData.host);
	res.render("index");
});

app.post("/", (req, res)=>{
	let notice = null;
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log("Sisselogimise andmed pole täielikud!");
		notice = "Sisselogimise andmeid on puudu!";
		res.render("index", {notice: notice});
	}
	else {
		let sqlReq = "SELECT id, password FROM vp2users WHERE email = ?";
		conn.execute(sqlReq, [req.body.emailInput], (err, result)=>{
			if(err){
				notice = "Tehnilise vea tõttu ei saa sisse logida!";
				console.log(err);
				res.render("index", {notice: notice});
			}
			else {
				if(result[0] != null){
					//kontrollime, kas sisselogimisel sisestatud paroolist saaks sellise räsi nagu andmebaasist
					bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
						if(err){
							notice = "Tehnilise vea tõttu andmete kontrollimisel ei saa sisse logida!";
							console.log(err);
							res.render("index", {notice: notice});
						}
						else {
							//kui võrdlustulemus on positiivne
							if(compareresult){
								notice = "Oledki sisseloginud!";
								//v6tame sessiooni kasutusele
								//mySession = req.session;
								//mySession.userId = result[0].id;
								req.session.userId = result [0].id;
								//res.render("index", {notice: notice});
								res.redirect("/home");
							}
							else {
								notice = "Kasutajatunnus ja/või parool oli vale!";
								res.render("index", {notice: notice});
							}
						}
					});
				}
				else {
					notice = "Kasutajatunnus või parool oli vale!";
					res.render("index", {notice: notice});
				}
			}
		});
	}
	//res.render("index");
});

app.get("/home", checkLogin, (req, res)=>{
	console.log("Sisse on loginud kasutaja: ", req.session.userId);
	res.render("home");
});

app.get("/signup", (req, res)=>{
	res.render("signup");
});

app.get("/logout", (req, res)=>{
	req.session.destroy();
	//mySession = null;
	res.redirect("/");
});

app.post("/signup", (req, res)=>{
	let notice = "Ootan andmeid";
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput){
		console.log("Andmeid on puudu või paroolid ei kattu!");
		notice = "Andmeid on puudu või paroolid ei kattu!";
		res.render("signup", {notice: notice});
	}
	else {
		notice = "Andmed korras!";
		let email = "SELECT email from vp2users WHERE email = ?";
		conn.query(email,[req.body.emailInput], (err, results) => {
			if (err) {
                notice = "Tehniline viga, kasutajat ei loodud.";
                res.render("signup", { notice: notice });
			} else if (results.length > 0) {	
                notice = "Selle emailiga on juba kasutaja loodud!";
                res.render("signup", { notice: notice });
			} else {
				bcrypt.genSalt(10, (err, salt)=>{
				if(err){
					notice = "Tehniline viga, kasutajat ei loodud.";
					res.render("signup", {notice: notice});
				} else {
					bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash)=>{
						if(err){
							notice = "Tehniline viga parooli krypteerimisel, kasutajat ei loodud.";
							res.render("signup", {notice: notice});
						}
						else {
							let sqlReq = "INSERT INTO vp2users (first_name, last_name, birth_date, gender, email, password) VALUES(?,?,?,?,?,?)";
							conn.execute(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result)=>{
								if(err){
									notice = "Tehniline viga andmebaasi kirjutamisel, kasutajat ei loodud.";
									res.render("signup", {notice: notice});
								}
								else {
									notice = "Kasutaja " + req.body.emailInput + " edukalt loodud!";
									res.render("signup", {notice: notice});
								}
								});
							}
						});	
					}
				});
			}
		});		
	}
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

// app.get("/eestifilm", (req, res)=>{
	// res.render("eestifilm");
// });

// app.get("/eestifilm/tegelased", (req, res)=>{
	// //loon andmebaasip2ringu
	// let sqlReq = "SELECT id, first_name, last_name, birth_date FROM person";
	// conn.query(sqlReq, (err, sqlRes)=>{
		// if(err){
			// res.render("tegelased", {persons: {first_name: "Ei", last_name: "leidnud", birth_date: "VIGA"}});
			// //throw err;
		// }
		// else {
			// //console.log(sqlRes);
			// res.render("tegelased", {persons: sqlRes});
		// }
	// });
	// //res.render("tegelased");
// });

// app.get("/eestifilm/personrelations/:id", (req, res)=>{
	// console.log(req.params.id);
	// res.render("personrelations");
// });

// app.get("/eestifilm/filmid", (req, res)=>{
	// let sqlReq = "SELECT title, production_year, duration FROM movie";
	// conn.query(sqlReq, (err, sqlRes)=>{
		// if(err){
			// throw err;
		// }
		// else {
			// res.render("filmid", {movies: sqlRes});
		// }
	// });	
// });

// app.get("/eestifilm/lisa", (req, res)=>{
	// res.render("addmovieperson");
// });

// app.get("/eestifilm/lisaseos", (req, res)=>{
	// //kasutades async moodulit, panen mitu andmebaasip2ringut paraleelselt toimima
	// //loon SQL p2ringute (lausa tegevuste ehk funktsioonide) loendi
	// const myQueries = [
		// function(callback){
			// conn.execute(("SELECT id, first_name, last_name, birth_date FROM person"), (err, result)=>{
				// if(err){
					// return callback(err);
				// }
				// else {
					// return callback(null, result);
				// }
			// });
		// },
		// function(callback){
			// conn.execute(("SELECT id, title, production_year FROM movie"), (err, result)=>{
				// if(err){
					// return callback(err);
				// }
				// else {
					// return callback(null, result);
				// }
			// });
		// },
	// ];
	// //paneme need tegevused paralleelselt t66le, tulemuse saab siis, kui k6ik tehtud
	// //v2ljundiks yks koondlist
	// asyn.parallel(myQueries, (err, results)=>{
		// if(err){
			// throw err;
		// }
		// else {
			// console.log(results);
			// res.render("addrelations", {personList: results[0]});
		// }
	// });
	// /*let sqlReq = "SELECT id, first_name, last_name, birth_date FROM person";
	// conn.execute(sqlReq, (err, result)=>{
		// if(err){
			// throw err;
		// }
		// else {
			// console.log("result");
			// res.render("addrelations", {personList: result});
		// }
	// });
	// res.render("addrelations");
	// /*/
// });


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
	let sqlReq = "SELECT id, file_name, alt_text FROM vp2photos WHERE privacy = ? AND deleted is NULL ORDER BY id DESC";
	const privacy = 3;
	let photoList = [];
	conn.execute(sqlReq, [privacy], (err, result)=>{
		if(err) {
			throw(err);
		}
		else {
			console.log(result);
			//photoList.push({href:
			//result.foreach(photo)=>{
			for(let i = 0; i< result.length; i++){
				photoList.push({id: result[i].id, href: "/gallery/thumb/", filename: result[i].file_name, alt: result[i].alt_text});
			}
			console.log(photoList);
			res.render("gallery", {listData: photoList});
		}
	}); 
});

function checkLogin(req, res, next){
	if(req.session != null){
		if(req.session.userId){
			console.log("Login ok!");
			next();
		}
		else {
			console.log("Login not detected!");
			res.redirect("/");
		}
	}
	else {
		res.redirect("/");
	}
}

app.listen(5206);